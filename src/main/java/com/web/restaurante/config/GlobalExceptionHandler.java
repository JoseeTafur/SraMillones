package com.web.restaurante.config;

import com.web.restaurante.exception.CredencialesInvalidasException;
import com.web.restaurante.exception.RecursoNoEncontradoException;
import com.web.restaurante.exception.TokenInvalidoException;
import com.web.restaurante.util.ResponseUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Captura los errores de Bean Validation (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    // Captura las excepciones de lógica de negocio en ReservaService
    @ExceptionHandler({IllegalStateException.class, IllegalArgumentException.class})
    public ResponseEntity<Map<String, String>> handleBusinessException(RuntimeException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception e) {
        return ResponseUtil.error("Error interno del servidor: " + e.getMessage());
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<?> handleRecursoNoEncontrado(RecursoNoEncontradoException e) {
        return ResponseUtil.noEncontrado(e.getMessage());
    }

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<?> handleCredencialesInvalidas(CredencialesInvalidasException e) {
        return ResponseUtil.noEncontrado(e.getMessage());
    }

    @ExceptionHandler(TokenInvalidoException.class)
    public ResponseEntity<?> handleTokenInvalido(TokenInvalidoException e) {
        return ResponseUtil.solicitudIncorrecta(e.getMessage());
    }
}