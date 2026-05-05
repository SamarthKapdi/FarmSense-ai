package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    /**
     * GET /api/weather?city=Mumbai — Returns weather data + disease risk alerts
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWeather(
            @RequestParam(defaultValue = "Mumbai") String city) {
        return ResponseEntity.ok(ApiResponse.ok(weatherService.getWeather(city)));
    }
}
