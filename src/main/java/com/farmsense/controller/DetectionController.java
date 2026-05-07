package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.model.dto.DetectionResult;
import com.farmsense.model.entity.DetectionReport;
import com.farmsense.repository.ReportRepository;
import com.farmsense.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.time.format.DateTimeFormatter;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/farm")
@RequiredArgsConstructor
@Slf4j
public class DetectionController {

    private final DiseaseDetectionService detectionService;
    private final TranslationService translationService;
    private final ReportService reportService;
    private final ActivityService activityService;
    private final ReportRepository reportRepository;
    private final PdfReportService pdfReportService;

    @Value("${spring.ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    /**
    * POST /api/farm/detect — Upload image for AI disease detection.
     */
    @PostMapping(value = "/detect", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DetectionResult>> detectDisease(
            @RequestParam("image") MultipartFile image,
            @RequestParam("crop") String crop,
            @RequestParam(value = "language", defaultValue = "en") String language,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");
        String userEmail = (String) request.getAttribute("userEmail");
        String userName = (String) request.getAttribute("userName");

        log.info("Detection request — Crop: {}, Language: {}, User: {}", crop, language, userEmail);

        DetectionResult result;
        try {
            result = detectionService.analyzeImage(image.getBytes(), crop, language);
        } catch (Exception e) {
            log.error("AI Analysis Pipeline Failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.error("AI Analysis Failed: " + e.getMessage()));
        }
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
                    "{\"crop\":\"" + crop + "\",\"disease\":\"" + result.getDiseaseName()
                            + "\",\"confidence\":" + result.getConfidence() + "}");
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping(value = "/detect-batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<DetectionResult>>> detectDiseaseBatch(
            @RequestParam("images") List<MultipartFile> images,
            @RequestParam("crop") String crop,
            @RequestParam(value = "language", defaultValue = "en") String language,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");
        String userEmail = (String) request.getAttribute("userEmail");
        String userName = (String) request.getAttribute("userName");

        log.info("Batch detection request — Images: {}, Crop: {}, Language: {}, User: {}", images.size(), crop, language, userEmail);

        List<CompletableFuture<DetectionResult>> futures = images.stream().map(image -> 
            CompletableFuture.supplyAsync(() -> {
                try {
                    DetectionResult result = detectionService.analyzeImage(image.getBytes(), crop, language);
                    result.setCropName(crop);
                    if (!"en".equals(language)) {
                        result = translationService.translate(result, language);
                    }
                    result.setLanguage(language);
                    
                    String farmerId = userId != null ? userId : "anonymous";
                    reportService.saveReport(result, farmerId, crop, language);
                    return result;
                } catch (Exception e) {
                    log.error("Failed to process image in batch: {}", e.getMessage(), e);
                    throw new RuntimeException("Image processing failed", e);
                }
            })
        ).collect(Collectors.toList());

        List<DetectionResult> results = futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());

        if (userId != null) {
            activityService.logActivity(userId, userEmail, userName,
                    "BATCH_SCAN", "Scanned " + images.size() + " " + crop + " images", null);
        }

        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    /**
     * GET /api/farm/history/me — get authenticated user's scan history
     */
    @GetMapping("/history/me")
    public ResponseEntity<?> getMyHistory(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(reportService.getHistory(userId)));
    }

    /**
     * GET /api/farm/history/bookmarked — get bookmarked scans
     */
    @GetMapping("/history/bookmarked")
    public ResponseEntity<?> getBookmarkedHistory(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(
                reportRepository.findByFarmerIdAndIsBookmarkedTrueOrderByCreatedAtDesc(userId)));
    }

    /**
     * PATCH /api/farm/history/{reportId}/bookmark — toggle bookmark
     */
    @PatchMapping("/history/{reportId}/bookmark")
    public ResponseEntity<?> toggleBookmark(@PathVariable String reportId, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));

        Optional<DetectionReport> opt = reportRepository.findById(reportId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(ApiResponse.error("Report not found"));

        DetectionReport report = opt.get();
        if (!userId.equals(report.getFarmerId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied"));
        }

        report.setBookmarked(!report.isBookmarked());
        reportRepository.save(report);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "reportId", reportId,
                "bookmarked", report.isBookmarked())));
    }

    /**
     * GET /api/farm/report/{reportId}/pdf — Export scan as PDF (text-based)
     */
    @GetMapping("/report/{reportId}/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable String reportId, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        Optional<DetectionReport> opt = reportRepository.findById(reportId);

        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        DetectionReport r = opt.get();

        if (userId != null && !userId.equals(r.getFarmerId())) {
            return ResponseEntity.status(403).build();
        }

        byte[] pdfBytes = pdfReportService.generateReport(r);
        String filename = "FarmSense_Report_" + (r.getCropName() != null ? r.getCropName() : "Unknown") + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    /**
     * GET /api/farm/history/{farmerId} — get scan history by farmer ID
     */
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

        return ResponseEntity.ok(ApiResponse.ok(reportService.getHistory(effectiveId)));
    }

    /**
     * GET /api/farm/stats/me — user stats
     */
    @GetMapping("/stats/me")
    public ResponseEntity<?> getMyStats(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(reportService.getStats(userId)));
    }

    @GetMapping("/stats/{farmerId}")
    public ResponseEntity<?> getStats(@PathVariable String farmerId, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        String effectiveId = userId != null ? userId : farmerId;
        return ResponseEntity.ok(ApiResponse.ok(reportService.getStats(effectiveId)));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        // 1. Ollama check
        boolean ollamaReachable = false;
        String checkedEndpoint = ollamaBaseUrl + "/api/tags";
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(checkedEndpoint))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            ollamaReachable = resp.statusCode() == 200;
        } catch (Exception ignored) {}

        // 2. Database check
        boolean dbReachable = false;
        try {
            reportRepository.count();
            dbReachable = true;
        } catch (Exception ignored) {}

        // 3. Disk space check
        java.io.File root = new java.io.File(".");
        long freeGB = root.getFreeSpace() / (1024 * 1024 * 1024);
        boolean diskOk = freeGB > 1;

        String overallStatus = (dbReachable && diskOk) ? "UP" : "DEGRADED";

        return ResponseEntity.ok(ApiResponse.ok("FarmSense AI Running", Map.of(
                "status", overallStatus,
                "javaVersion", System.getProperty("java.version"),
                "components", Map.of(
                        "database", dbReachable ? "UP" : "DOWN",
                        "ollama", ollamaReachable ? "UP" : "DOWN",
                        "diskSpace", diskOk ? "UP (" + freeGB + " GB free)" : "LOW (" + freeGB + " GB)"
                ),
                "ollamaBaseUrl", ollamaBaseUrl,
                "chatModel", "llama3:latest",
                "visionModel", "llama3.2-vision:latest")));
    }
}
