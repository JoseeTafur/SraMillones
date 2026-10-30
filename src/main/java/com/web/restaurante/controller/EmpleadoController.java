package com.web.restaurante.controller;

import com.web.restaurante.model.Cargo;
import com.web.restaurante.model.Empleado;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.service.EmpleadoService;
import com.web.restaurante.service.UsuarioService;
import com.web.restaurante.util.ValidationUtil;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/empleados")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class EmpleadoController {

    private final EmpleadoService empleadoService;
    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<?> listar() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", empleadoService.listar());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cargos")
    public ResponseEntity<?> listarCargos() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", empleadoService.listarCargos());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/usuarios-disponibles")
    public ResponseEntity<?> listarUsuariosDisponibles() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", usuarioService.listar());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        return empleadoService.obtenerPorId(id)
                .map(emp -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("data", emp);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/buscar")
    public ResponseEntity<?> buscar(@RequestParam(required = false) String termino,
                                    @RequestParam(required = false) String turno) {
        Map<String, Object> response = new HashMap<>();
        List<Empleado> resultado;

        if (turno != null && !turno.isBlank() && !"TODOS".equalsIgnoreCase(turno)) {
            resultado = empleadoService.buscarPorTurno(turno);
        } else {
            resultado = empleadoService.buscarPorTermino(termino);
        }

        response.put("success", true);
        response.put("data", resultado);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/guardar")
    public ResponseEntity<?> guardar(@RequestBody Empleado empleado, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Validaciones de negocio y campos
            if (empleado.getNombre() == null || empleado.getNombre().isBlank()) {
                response.put("success", false);
                response.put("message", "El nombre del empleado es obligatorio.");
                return ResponseEntity.badRequest().body(response);
            }
            if (!ValidationUtil.soloLetras(empleado.getNombre())) {
                response.put("success", false);
                response.put("message", "El nombre solo puede contener letras.");
                return ResponseEntity.badRequest().body(response);
            }

            if (empleado.getApellido() == null || empleado.getApellido().isBlank()) {
                response.put("success", false);
                response.put("message", "El apellido del empleado es obligatorio.");
                return ResponseEntity.badRequest().body(response);
            }
            if (!ValidationUtil.soloLetras(empleado.getApellido())) {
                response.put("success", false);
                response.put("message", "El apellido solo puede contener letras.");
                return ResponseEntity.badRequest().body(response);
            }

            if (empleado.getTelefono() != null && !empleado.getTelefono().isBlank()) {
                if (!empleado.getTelefono().trim().matches("^[0-9]{" + ValidationUtil.TELEFONO_EXACTO + "}$")) {
                    response.put("success", false);
                    response.put("message", "El teléfono debe tener exactamente " + ValidationUtil.TELEFONO_EXACTO + " dígitos.");
                    return ResponseEntity.badRequest().body(response);
                }
            }

            Empleado guardado = empleadoService.guardar(empleado);
            response.put("success", true);
            response.put("data", guardado);
            response.put("message", empleado.getId() != null
                    ? "Empleado actualizado correctamente"
                    : "Empleado registrado correctamente");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error interno del servidor: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/cambiar-estado/{id}")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Empleado emp = empleadoService.alternarEstado(id);
            response.put("success", true);
            response.put("message", "Estado del empleado actualizado correctamente");
            response.put("data", emp);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al cambiar estado: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            empleadoService.eliminar(id);
            response.put("success", true);
            response.put("message", "Empleado desactivado correctamente.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al eliminar: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}