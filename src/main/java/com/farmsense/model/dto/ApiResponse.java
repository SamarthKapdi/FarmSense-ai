package com.farmsense.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standard API response wrapper for all endpoints.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;

    @Builder.Default
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class)
    private LocalDateTime timestamp = LocalDateTime.now();

    public static class FlexibleLocalDateTimeDeserializer extends com.fasterxml.jackson.databind.JsonDeserializer<LocalDateTime> {
        @Override
        public LocalDateTime deserialize(com.fasterxml.jackson.core.JsonParser p, com.fasterxml.jackson.databind.DeserializationContext ctxt) throws java.io.IOException {
            String text = p.getText();
            if (text == null || text.isBlank()) return null;
            try {
                return LocalDateTime.parse(text);
            } catch (java.time.format.DateTimeParseException e) {
                try {
                    return java.time.ZonedDateTime.parse(text).toLocalDateTime();
                } catch (Exception ex) {
                    try {
                        return java.time.OffsetDateTime.parse(text).toLocalDateTime();
                    } catch (Exception ex2) {
                        return LocalDateTime.now();
                    }
                }
            }
        }
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}
