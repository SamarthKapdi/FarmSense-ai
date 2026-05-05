package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.model.dto.MandiPriceResponse;
import com.farmsense.service.MarketPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketPriceService marketPriceService;

    @GetMapping("/prices")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPrices(
            @RequestParam(defaultValue = "Tomato") String crop,
            @RequestParam(defaultValue = "Maharashtra") String state) {
        List<MandiPriceResponse> prices = marketPriceService.getPrices(crop, state);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "prices", prices,
                "disclaimer", "Simulated prices for demonstration. Connect to Data.gov.in API for live data.")));
    }

    @GetMapping("/states")
    public ResponseEntity<ApiResponse<List<String>>> getStates() {
        return ResponseEntity.ok(ApiResponse.ok(marketPriceService.getStates()));
    }

    @GetMapping("/crops")
    public ResponseEntity<ApiResponse<List<String>>> getCrops() {
        return ResponseEntity.ok(ApiResponse.ok(marketPriceService.getTrackedCrops()));
    }
}
