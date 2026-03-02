package com.farmsense.controller;

import com.farmsense.model.dto.ChatRequest;
import com.farmsense.model.dto.ChatResponse;
import com.farmsense.model.dto.DetectionResult;
import com.farmsense.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/farm")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class DetectionController {

    private final DiseaseDetectionService detectionService;
    private final TranslationService translationService;
    private final KrishiGPTService krishiGPTService;
    private final ReportService reportService;
    private final ActivityService activityService;

    @PostMapping(value = "/detect", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> detectDisease(
            @RequestParam("image") MultipartFile image,
            @RequestParam("crop") String crop,
            @RequestParam(value = "language", defaultValue = "en") String language,
            HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            String userEmail = (String) request.getAttribute("userEmail");
            String userName = (String) request.getAttribute("userName");

            log.info("Detection request — Crop: {}, Language: {}, User: {}", crop, language, userEmail);

            DetectionResult result = detectionService.analyzeImage(image);
            result.setCropName(crop);

            if (!"en".equals(language)) {
                result = translationService.translate(result, language);
            }
            result.setLanguage(language);

            String farmerId = userId != null ? userId : "anonymous";
            reportService.saveReport(result, farmerId, crop, language);

            if (userId != null) {
                activityService.logActivity(userId, userEmail, userName,
                        "SCAN", "Scanned " + crop + " — detected " + result.getDiseaseName(),
                        "{\"crop\":\"" + crop + "\",\"disease\":\"" + result.getDiseaseName() + "\",\"confidence\":"
                                + result.getConfidence() + "}");
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Detection error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Detection failed: " + e.getMessage(),
                            "timestamp", LocalDateTime.now().toString()));
        }
    }

    @PostMapping("/ask")
    public ResponseEntity<?> askKrishiGPT(@RequestBody ChatRequest chatRequest,
            HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            String userEmail = (String) request.getAttribute("userEmail");
            String userName = (String) request.getAttribute("userName");

            String answer = krishiGPTService.askKrishiGPT(
                    userId, chatRequest.getQuestion(), chatRequest.getCrop(), chatRequest.getLanguage());

            ChatResponse response = ChatResponse.builder()
                    .answer(answer)
                    .language(chatRequest.getLanguage())
                    .timestamp(LocalDateTime.now())
                    .build();

            if (userId != null) {
                activityService.logActivity(userId, userEmail, userName,
                        "CHAT",
                        "Asked about " + chatRequest.getCrop() + ": "
                                + chatRequest.getQuestion().substring(0,
                                        Math.min(50, chatRequest.getQuestion().length())),
                        "{\"crop\":\"" + chatRequest.getCrop() + "\",\"language\":\"" + chatRequest.getLanguage()
                                + "\"}");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Chat error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Chat failed: " + e.getMessage()));
        }
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/treatment-plan")
    public ResponseEntity<?> generateTreatmentPlan(@RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            String userEmail = (String) request.getAttribute("userEmail");
            String userName = (String) request.getAttribute("userName");

            Map<String, Object> resultMap = (Map<String, Object>) body.get("detectionResult");
            String language = (String) body.getOrDefault("language", "en");

            List<String> organicList = List.of();
            Object organicObj = resultMap.get("organicTreatment");
            if (organicObj instanceof List<?> rawList) {
                organicList = rawList.stream().map(Object::toString).toList();
            }

            DetectionResult detectionResult = DetectionResult.builder()
                    .diseaseName((String) resultMap.getOrDefault("diseaseName", "Unknown"))
                    .severity((String) resultMap.getOrDefault("severity", "Moderate"))
                    .organicTreatment(organicList)
                    .build();

            String plan = krishiGPTService.generateTreatmentPlan(detectionResult, language);

            if (userId != null) {
                activityService.logActivity(userId, userEmail, userName,
                        "GENERATE_PLAN", "Generated 7-day plan for " + detectionResult.getDiseaseName(), null);
            }

            return ResponseEntity.ok(Map.of(
                    "plan", plan,
                    "language", language,
                    "timestamp", LocalDateTime.now().toString()));

        } catch (Exception e) {
            log.error("Plan error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Plan generation failed: " + e.getMessage()));
        }
    }

    @GetMapping("/history/{farmerId}")
    public ResponseEntity<?> getHistory(@PathVariable String farmerId, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        String effectiveId = userId != null ? userId : farmerId;

        if (userId != null) {
            String userEmail = (String) request.getAttribute("userEmail");
            String userName = (String) request.getAttribute("userName");
            activityService.logActivity(userId, userEmail, userName,
                    "VIEW_HISTORY", "Viewed scan history", null);
        }

        return ResponseEntity.ok(reportService.getHistory(effectiveId));
    }

    @GetMapping("/stats/{farmerId}")
    public ResponseEntity<?> getStats(@PathVariable String farmerId, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        String effectiveId = userId != null ? userId : farmerId;
        return ResponseEntity.ok(reportService.getStats(effectiveId));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "FarmSense AI Running",
                "timestamp", LocalDateTime.now().toString(),
                "javaVersion", System.getProperty("java.version")));
    }
}
