package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.model.dto.ChatRequest;
import com.farmsense.model.dto.ChatResponse;
import com.farmsense.model.entity.ChatHistory;
import com.farmsense.repository.ChatHistoryRepository;
import com.farmsense.service.ActivityService;
import com.farmsense.service.KrishiGPTService;
import com.farmsense.service.ReportService;
import com.farmsense.model.dto.DetectionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/farm")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final KrishiGPTService krishiGPTService;
    private final ChatHistoryRepository chatHistoryRepository;
    private final ActivityService activityService;
    private final ReportService reportService;

    // Calendar cache: crop -> { data, timestamp }
    private final Map<String, CachedCalendar> calendarCache = new ConcurrentHashMap<>();
    private static final long CALENDAR_TTL_MS = 24 * 60 * 60 * 1000L; // 24 hours

    private record CachedCalendar(String data, long timestamp) {}

    /**
         * POST /api/farm/ask — Ask KrishiGPT a farming question
     */
    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<ChatResponse>> askKrishiGPT(
            @RequestBody ChatRequest request, HttpServletRequest httpRequest) {

        String userId = (String) httpRequest.getAttribute("userId");
        String userEmail = (String) httpRequest.getAttribute("userEmail");
        String userName = (String) httpRequest.getAttribute("userName");

        log.info("▶ POST /api/farm/ask HIT — Crop: {}, Language: {}, User: {}, Question: {}chars", 
                request.getCrop(), request.getLanguage(), userEmail,
                request.getQuestion() != null ? request.getQuestion().length() : 0);

        String answer = krishiGPTService.askKrishiGPT(
                userId, request.getQuestion(), request.getCrop(), request.getLanguage(), request.getImageBase64());

        if (userId != null) {
            ChatHistory chatHistory = ChatHistory.builder()
                    .userId(userId)
                    .userEmail(userEmail)
                    .question(request.getQuestion())
                    .answer(answer)
                    .crop(request.getCrop())
                    .language(request.getLanguage())
                    .build();
            chatHistoryRepository.save(chatHistory);

            activityService.logActivity(userId, userEmail, userName,
                    "CHAT", "Chat about " + request.getCrop(), null);
        }

        ChatResponse response = ChatResponse.builder()
                .answer(answer)
                .language(request.getLanguage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

        /**
         * POST /api/farm/treatment-plan — Generate a 7-day treatment plan
         */
    @SuppressWarnings("unchecked")
    @PostMapping("/treatment-plan")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generatePlan(
            @RequestBody Map<String, Object> body, HttpServletRequest request) {

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

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "plan", plan,
                "language", language,
                "timestamp", LocalDateTime.now().toString())));
    }

    /**
     * GET /api/farm/calendar/{crop} — Generate month-by-month crop calendar
     */
    @GetMapping("/calendar/{crop}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCropCalendar(
            @PathVariable String crop, HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");
        log.info("Calendar request for crop: {}, user: {}", crop, userId);

        String cacheKey = crop.toLowerCase().trim();
        CachedCalendar cached = calendarCache.get(cacheKey);

        if (cached != null && (System.currentTimeMillis() - cached.timestamp()) < CALENDAR_TTL_MS) {
            log.info("Calendar cache hit for {}", crop);
            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                    "crop", crop,
                    "calendar", cached.data(),
                    "cached", true)));
        }

        String prompt = "Generate a month-by-month crop calendar for growing " + crop + " in India. " +
                "For each month (January to December), provide: sowing/transplanting, irrigation, fertilisation, " +
                "pest/disease watch, and harvesting activities. " +
                "Return ONLY a JSON array with 12 objects, each with keys: " +
                "\"month\" (month name), \"activities\" (array of activity strings). " +
                "No markdown, no explanation, just the JSON array.";

        String calendarData = krishiGPTService.askKrishiGPT(userId, prompt, crop, "en", null);

        calendarCache.put(cacheKey, new CachedCalendar(calendarData, System.currentTimeMillis()));

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "crop", crop,
                "calendar", calendarData,
                "cached", false)));
    }

    
}
