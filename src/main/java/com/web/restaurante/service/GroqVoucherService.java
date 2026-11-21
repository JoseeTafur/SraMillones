package com.web.restaurante.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GroqVoucherService {

    private static final long MAX_VOUCHER_BYTES = 4 * 1024 * 1024; // 4 MB
    private static final Set<String> TIPOS_PERMITIDOS = Set.of("image/jpeg", "image/png", "image/webp");

    @Value("${app.groq.token:}")
    private String apiKey;

    @Value("${app.groq.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqUrl;

    @Value("${app.groq.model:qwen/qwen3.8-27b}")
    private String modelo;

    @Value("${app.restaurante.titular-pago:Sra. Millones}")
    private String titularEsperado;

    private final ObjectMapper mapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    // Registro en memoria de números de operación ya usados para evitar reutilización de capturas
    private final Set<String> operacionesUsadas = ConcurrentHashMap.newKeySet();

    public Map<String, Object> validarVoucher(MultipartFile file, double totalEsperado, String metodo) {
        Map<String, Object> respuesta = new HashMap<>();

        String errorValidacion = validarEntradaVoucher(file, totalEsperado);
        if (errorValidacion != null) {
            return error(respuesta, errorValidacion);
        }

        if (apiKey == null || apiKey.isBlank()) {
            return error(respuesta, "Falta configurar app.groq.token en el backend.");
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            String imageUrl = "data:" + file.getContentType() + ";base64," + base64Image;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            String fechaHoy = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            String metodoNombre = (metodo != null && !metodo.isBlank()) ? metodo.toUpperCase() : "YAPE/PLIN";

            String prompt = "Eres un auditor antifraude de comprobantes de pago (" + metodoNombre + ") en Perú. "
                    + "Analiza la imagen adjunta para el restaurante \"" + titularEsperado + "\". "
                    + "Monto total esperado: S/ " + String.format(Locale.US, "%.2f", totalEsperado) + ". "
                    + "Fecha actual de referencia: " + fechaHoy + ". "
                    + "Verifica: 1) Que sea un comprobante real y legible de Yape o Plin (no edición falsa ni otra app). "
                    + "2) Que el destinatario corresponda a \"" + titularEsperado + "\" o al restaurante. "
                    + "3) El monto exacto transferido y el número de operación/transacción. "
                    + "Responde ÚNICAMENTE con un JSON plano sin markdown con estas claves: "
                    + "\"valido\" (boolean: true solo si es legítimo, legible, destinatario correcto y monto exacto), "
                    + "\"montoDetectado\" (number: monto exacto en soles), "
                    + "\"numeroOperacion\" (string: código o número de operación del voucher, o vacío si no se ve), "
                    + "\"destinatario\" (string: nombre del destinatario que figura en el voucher), "
                    + "\"mensaje\" (string: explicación clara en español para el cliente).";

            Map<String, Object> imageContent = Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", imageUrl));
            Map<String, Object> textContent = Map.of("type", "text", "text", prompt);
            Map<String, Object> message = Map.of(
                    "role", "user",
                    "content", List.of(textContent, imageContent));

            Map<String, Object> body = new HashMap<>();
            body.put("model", modelo);
            body.put("temperature", 0.0);
            body.put("messages", List.of(message));
            body.put("response_format", Map.of("type", "json_object"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity response = restTemplate.exchange(groqUrl, HttpMethod.POST, entity, Map.class);

            JsonNode root = mapper.valueToTree(response.getBody());
            String content = root.path("choices").path(0).path("message").path("content").asText();

            int ini = content.indexOf('{');
            int fin = content.lastIndexOf('}');
            if (ini < 0 || fin <= ini) {
                return error(respuesta, "La IA no devolvió un formato de respuesta válido.");
            }
            JsonNode resultado = mapper.readTree(content.substring(ini, fin + 1));

            double montoDetectado = resultado.path("montoDetectado").asDouble(0.0);
            String numOperacion = resultado.path("numeroOperacion").asText("").trim();
            boolean montoCoincide = Math.abs(montoDetectado - totalEsperado) < 0.01;
            boolean validoIA = resultado.path("valido").asBoolean(false);

            if (!montoCoincide) {
                return error(respuesta, String.format(Locale.US,
                        "El monto detectado (S/ %.2f) no coincide con el total del pedido (S/ %.2f).",
                        montoDetectado, totalEsperado));
            }

            if (validoIA && !numOperacion.isEmpty() && !operacionesUsadas.add(numOperacion)) {
                return error(respuesta, "Este comprobante (Operación " + numOperacion + ") ya fue utilizado anteriormente.");
            }

            boolean validoFinal = validoIA && montoCoincide;
            String mensaje = resultado.path("mensaje").asText("Comprobante verificado.");

            respuesta.put("valido", validoFinal);
            respuesta.put("montoDetectado", montoDetectado);
            respuesta.put("mensaje", mensaje);

        } catch (HttpStatusCodeException e) {
            System.err.println("Groq respondió " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
            return error(respuesta, "No se pudo verificar el comprobante en este momento. Intenta nuevamente.");
        } catch (Exception e) {
            e.printStackTrace();
            return error(respuesta, "Error procesando la imagen del voucher.");
        }
        return respuesta;
    }

    // --- Métodos privados de soporte ---

    private String validarEntradaVoucher(MultipartFile file, double totalEsperado) {
        if (file == null || file.isEmpty()) {
            return "Falta adjuntar el voucher.";
        }
        if (file.getSize() > MAX_VOUCHER_BYTES) {
            return "La imagen supera el límite permitido de 4 MB.";
        }
        String contentType = file.getContentType();
        if (contentType == null || !TIPOS_PERMITIDOS.contains(contentType)) {
            return "Solo se permiten capturas en formato JPG, PNG o WEBP.";
        }
        if (totalEsperado <= 0 || totalEsperado > 5000) {
            return "El monto del pedido no es válido.";
        }
        return null;
    }

    private Map<String, Object> error(Map<String, Object> respuesta, String mensaje) {
        respuesta.put("valido", false);
        respuesta.put("montoDetectado", 0.0);
        respuesta.put("mensaje", mensaje);
        return respuesta;
    }
}