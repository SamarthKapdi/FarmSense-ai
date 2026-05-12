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

        log.info("▶ POST /api/farm/detect HIT — Crop: {}, Language: {}, User: {}, ImageSize: {} bytes", 
                crop, language, userEmail, image != null ? image.getSize() : 0);

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

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${GROQ_API_KEY:}")
    private String groqApiKey;

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        // 1. Gemini API check
        boolean geminiReachable = false;
        String geminiError = null;

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models?key=" + geminiApiKey))
                    .timeout(Duration.ofSeconds(30))
                    .header("User-Agent", "FarmSense-AI/2.0")
                    .GET()
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            geminiReachable = resp.statusCode() == 200;
            if (!geminiReachable) {
                geminiError = "HTTP " + resp.statusCode();
                log.warn("Gemini health check returned HTTP {}", resp.statusCode());
            }
        } catch (HttpTimeoutException e) {
            geminiError = "Timeout after 30s";
            log.warn("Gemini health check TIMEOUT: {}", e.getMessage());
        } catch (Exception e) {
            geminiError = e.getClass().getSimpleName() + ": " + e.getMessage();
            log.warn("Gemini health check FAILED: {}", e.getMessage());
        }

        // 2. Groq API check
        boolean groqReachable = false;
        String groqError = null;
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/models"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("User-Agent", "FarmSense-AI/2.0")
                    .GET()
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            groqReachable = resp.statusCode() == 200;
            if (!groqReachable) {
                groqError = "HTTP " + resp.statusCode();
                log.warn("Groq health check returned HTTP {}", resp.statusCode());
            }
        } catch (HttpTimeoutException e) {
            groqError = "Timeout after 30s";
            log.warn("Groq health check TIMEOUT: {}", e.getMessage());
        } catch (Exception e) {
            groqError = e.getClass().getSimpleName() + ": " + e.getMessage();
            log.warn("Groq health check FAILED: {}", e.getMessage());
        }

        // 3. Database check
        boolean dbReachable = false;
        try {
            reportRepository.count();
            dbReachable = true;
        } catch (Exception e) {
            log.warn("Database health check failed: {}", e.getMessage());
        }

        // 4. Disk space check
        java.io.File root = new java.io.File(".");
        long freeGB = root.getFreeSpace() / (1024 * 1024 * 1024);
        boolean diskOk = freeGB > 1;

        String overallStatus = (dbReachable && diskOk && geminiReachable && groqReachable) ? "UP" : "DEGRADED";

        java.util.LinkedHashMap<String, Object> components = new java.util.LinkedHashMap<>();
        components.put("database", dbReachable ? "UP" : "DOWN");
        components.put("gemini", geminiReachable ? "UP" : "DOWN" + (geminiError != null ? " (" + geminiError + ")" : ""));
        components.put("groq", groqReachable ? "UP" : "DOWN" + (groqError != null ? " (" + groqError + ")" : ""));
        components.put("diskSpace", diskOk ? "UP (" + freeGB + " GB free)" : "LOW (" + freeGB + " GB)");

        java.util.LinkedHashMap<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("status", overallStatus);
        result.put("javaVersion", System.getProperty("java.version"));
        result.put("components", components);
        result.put("geminiApiConfigured", geminiApiKey != null && !geminiApiKey.trim().isEmpty());
        result.put("groqApiConfigured", groqApiKey != null && !groqApiKey.trim().isEmpty());
        result.put("chatModel", "llama3-8b-8192");
        result.put("visionModel", "gemini-1.5-flash");

        return ResponseEntity.ok(ApiResponse.ok("FarmSense AI Running", result));
    }

    /**
     * GET /api/farm/debug/ai — Deep hosted AI connectivity diagnostic.
     * Returns latency, exact URLs, and error details.
     */
    @GetMapping("/debug/ai")
    public ResponseEntity<?> debugAi() {
        long startTime = System.currentTimeMillis();

        log.info("=== AI DEBUG PROBE ===");

        java.util.LinkedHashMap<String, Object> debug = new java.util.LinkedHashMap<>();
        debug.put("geminiConfigured", geminiApiKey != null && !geminiApiKey.trim().isEmpty());
        debug.put("groqConfigured", groqApiKey != null && !groqApiKey.trim().isEmpty());
        debug.put("chatModel", "llama3-8b-8192");
        debug.put("visionModel", "gemini-1.5-flash");

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            HttpRequest geminiRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models?key=" + geminiApiKey))
                    .timeout(Duration.ofSeconds(30))
                    .header("User-Agent", "FarmSense-AI/2.0")
                    .GET()
                    .build();
            HttpResponse<String> geminiResp = client.send(geminiRequest, HttpResponse.BodyHandlers.ofString());
            debug.put("geminiHttpStatus", geminiResp.statusCode());
            debug.put("geminiLatencyMs", System.currentTimeMillis() - startTime);

            HttpRequest groqRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/models"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("User-Agent", "FarmSense-AI/2.0")
                    .GET()
                    .build();
            HttpResponse<String> groqResp = client.send(groqRequest, HttpResponse.BodyHandlers.ofString());
            debug.put("groqHttpStatus", groqResp.statusCode());
            debug.put("groqLatencyMs", System.currentTimeMillis() - startTime);

            debug.put("reachable", geminiResp.statusCode() == 200 && groqResp.statusCode() == 200);

        } catch (HttpTimeoutException e) {
            long latency = System.currentTimeMillis() - startTime;
            debug.put("reachable", false);
            debug.put("error", "TIMEOUT after " + latency + "ms");
            debug.put("latencyMs", latency);
            log.error("AI debug probe TIMEOUT: {}ms", latency);
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            debug.put("reachable", false);
            debug.put("error", e.getClass().getSimpleName() + ": " + e.getMessage());
            debug.put("latencyMs", latency);
            log.error("AI debug probe FAILED: {}", e.getMessage(), e);
        }

        return ResponseEntity.ok(ApiResponse.ok("AI Debug Info", debug));
    }
}
