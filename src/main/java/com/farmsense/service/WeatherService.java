package com.farmsense.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

/**
 * Fetches real weather data from OpenWeatherMap API.
 * Generates disease risk alerts based on humidity and temperature.
 */
@Service
@Slf4j
public class WeatherService {

    @Value("${farmsense.weather.api-key:demo}")
    private String apiKey;

    @Value("${farmsense.weather.base-url:https://api.openweathermap.org/data/2.5}")
    private String baseUrl;

    private final WebClient webClient = WebClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> getWeather(String city) {
        try {
            String url = String.format("%s/weather?q=%s&appid=%s&units=metric", baseUrl, city, apiKey);
            String response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null || response.isBlank()) {
                throw new IllegalStateException("Empty response from weather API");
            }

            JsonNode root = objectMapper.readTree(response);

            double temp = root.path("main").path("temp").asDouble();
            int humidity = root.path("main").path("humidity").asInt();
            double windSpeed = root.path("wind").path("speed").asDouble();
            String description = root.path("weather").get(0).path("description").asText();
            String icon = root.path("weather").get(0).path("icon").asText();

            Map<String, Object> weather = new LinkedHashMap<>();
            weather.put("city", city);
            weather.put("temperature", temp);
            weather.put("humidity", humidity);
            weather.put("windSpeed", windSpeed);
            weather.put("description", description);
            weather.put("icon", icon);
            weather.put("alerts", generateDiseaseAlerts(temp, humidity));

            return weather;

        } catch (Exception e) {
            log.warn("Weather API failed for {}: {}", city, e.getMessage());
            return getFallbackWeather(city);
        }
    }

    private List<Map<String, String>> generateDiseaseAlerts(double temp, int humidity) {
        List<Map<String, String>> alerts = new ArrayList<>();

        if (humidity > 85 && temp > 20 && temp < 30) {
            alerts.add(Map.of(
                    "level", "HIGH",
                    "disease", "Late Blight",
                    "message", "High humidity + warm temperature: Late Blight risk is HIGH. Spray preventively.",
                    "icon", "🚨"
            ));
        }
        if (humidity > 80) {
            alerts.add(Map.of(
                    "level", "MEDIUM",
                    "disease", "Downy Mildew",
                    "message", "Humidity above 80%: Monitor crops for Downy Mildew symptoms.",
                    "icon", "⚠️"
            ));
        }
        if (temp > 25 && temp < 35 && humidity > 60) {
            alerts.add(Map.of(
                    "level", "MEDIUM",
                    "disease", "Powdery Mildew",
                    "message", "Warm and humid conditions: Powdery Mildew risk is elevated.",
                    "icon", "⚠️"
            ));
        }
        if (temp > 30 && humidity < 40) {
            alerts.add(Map.of(
                    "level", "LOW",
                    "disease", "Spider Mites",
                    "message", "Hot and dry conditions: Watch for spider mite infestations.",
                    "icon", "ℹ️"
            ));
        }
        if (alerts.isEmpty()) {
            alerts.add(Map.of(
                    "level", "OK",
                    "disease", "None",
                    "message", "Current weather conditions are favorable for crops.",
                    "icon", "✅"
            ));
        }

        return alerts;
    }

    private Map<String, Object> getFallbackWeather(String city) {
        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("city", city);
        fallback.put("temperature", 28.0);
        fallback.put("humidity", 65);
        fallback.put("windSpeed", 3.5);
        fallback.put("description", "Weather data unavailable");
        fallback.put("icon", "01d");
        fallback.put("alerts", List.of(Map.of(
                "level", "INFO", "disease", "N/A",
                "message", "Weather service offline. Monitor crops manually.",
                "icon", "ℹ️"
        )));
        fallback.put("offline", true);
        return fallback;
    }
}
