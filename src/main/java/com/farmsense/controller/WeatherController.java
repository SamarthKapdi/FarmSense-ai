package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentWeather(
            @RequestParam double lat, @RequestParam double lon) {
        return ResponseEntity.ok(ApiResponse.ok(weatherService.getCurrentWeather(lat, lon)));
    }

    @GetMapping("/hourly")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHourlyForecast(
            @RequestParam double lat, @RequestParam double lon) {
        return ResponseEntity.ok(ApiResponse.ok(weatherService.getHourlyForecast(lat, lon)));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDailyForecast(
            @RequestParam double lat, @RequestParam double lon,
            @RequestParam(defaultValue = "10") int days) {
        return ResponseEntity.ok(ApiResponse.ok(weatherService.getDailyForecast(lat, lon, days)));
    }

    @GetMapping("/airquality")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAirQuality(
            @RequestParam double lat, @RequestParam double lon) {
        return ResponseEntity.ok(ApiResponse.ok(weatherService.getAirQuality(lat, lon)));
    }

    /**
     * Backward compatibility endpoint
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWeather(
            @RequestParam(defaultValue = "Mumbai") String city) {
        return ResponseEntity.ok(ApiResponse.ok(weatherService.getWeather(city)));
    }
}
