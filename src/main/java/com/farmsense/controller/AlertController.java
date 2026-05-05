package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.model.entity.OutbreakAlert;
import com.farmsense.service.OutbreakAlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final OutbreakAlertService outbreakAlertService;

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<OutbreakAlert>>> getActiveAlerts() {
        return ResponseEntity.ok(ApiResponse.ok(outbreakAlertService.getActiveAlerts()));
    }

    @GetMapping("/region/{state}")
    public ResponseEntity<ApiResponse<List<OutbreakAlert>>> getAlertsByRegion(@PathVariable String state) {
        return ResponseEntity.ok(ApiResponse.ok(outbreakAlertService.getAlertsByRegion(state)));
    }
}
