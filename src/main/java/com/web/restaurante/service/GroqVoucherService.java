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

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GroqVoucherService {

    @Value("${app.groq.token:}")
    private String apiKey;

    @Value("${app.groq.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqUrl;

    // Modelo de visión vigente. Se puede cambiar en application-dev.properties con app.groq.model
   @Value("${app.groq.model:qwen/qwen3.8-27b}")
private String modelo;

    private final ObjectMapper mapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> validarVoucher(MultipartFile file, double totalEsperado) {
        Map<String, Object> respuesta = new HashMap<>();

        if (apiKey == null || apiKey.isBlank()) {
            return error(respuesta, "Falta configurar app.groq.token en el backend.");
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            String imageUrl = "data:" + file.getContentType() + ";base64," + base64Image;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            String prompt = "Analiza este voucher de pago de Yape/Plin para el restaurante Sra. Millones. "
                    + "El monto total esperado es S/ " + totalEsperado + ". "
                    + "Responde SOLO con un JSON plano, sin markdown ni texto adicional, con las claves: "
                    + "\"valido\" (boolean: true si el voucher es legítimo, legible y el monto coincide con lo esperado), "
                    + "\"montoDetectado\" (number: el monto exacto que figura en el comprobante), "
                    + "\"mensaje\" (string: explicación breve del resultado).";

            Map<String, Object> imageContent = Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", imageUrl));
            Map<String, Object> textContent = Map.of("type", "text", "text", prompt);
            Map<String, Object> message = Map.of(
                    "role", "user",
                    "content", List.of(textContent, imageContent));

            Map<String, Object> body = new HashMap<>();
            body.put("model", modelo);
            body.put("temperature", 0.1);
            body.put("messages", List.of(message));
            body.put("response_format", Map.of("type", "json_object"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(groqUrl, HttpMethod.POST, entity, Map.class);

            JsonNode root = mapper.valueToTree(response.getBody());
            String content = root.path("choices").path(0).path("message").path("content").asText();

            // Extrae solo el objeto JSON (por si el modelo agrega texto o ```json)
            int ini = content.indexOf('{');
            int fin = content.lastIndexOf('}');
            if (ini < 0 || fin <= ini) {
                return error(respuesta, "La IA no devolvió un JSON válido.");
            }
            JsonNode resultado = mapper.readTree(content.substring(ini, fin + 1));

            double montoDetectado = resultado.path("montoDetectado").asDouble(0.0);
            boolean montoCoincide = Math.abs(montoDetectado - totalEsperado) < 0.01;
            boolean valido = resultado.path("valido").asBoolean(false) && montoCoincide;

            String mensaje = resultado.path("mensaje").asText("Sin mensaje");
            if (!montoCoincide) {
                mensaje = "El monto detectado (S/ " + montoDetectado
                        + ") no coincide con el total del pedido (S/ " + totalEsperado + ").";
            }

            respuesta.put("valido", valido);
            respuesta.put("montoDetectado", montoDetectado);
            respuesta.put("mensaje", mensaje);

        } catch (HttpStatusCodeException e) {
            System.err.println("Groq respondió " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
            return error(respuesta, "Groq respondió con error " + e.getStatusCode().value()
                    + ". Revisa la clave y el modelo.");
        } catch (Exception e) {
            e.printStackTrace();
            return error(respuesta, "Error procesando el voucher: " + e.getMessage());
        }
        return respuesta;
    }

    private Map<String, Object> error(Map<String, Object> respuesta, String mensaje) {
        respuesta.put("valido", false);
        respuesta.put("montoDetectado", 0.0);
        respuesta.put("mensaje", mensaje);
        return respuesta;
    }
}