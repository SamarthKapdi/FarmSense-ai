package com.farmsense.controller;

import com.farmsense.model.dto.ChatRequest;
import com.farmsense.model.dto.ChatResponse;
import com.farmsense.model.entity.ChatHistory;
import com.farmsense.repository.ChatHistoryRepository;
import com.farmsense.service.ActivityService;
import com.farmsense.service.KrishiGPTService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final KrishiGPTService krishiGPTService;
    private final ChatHistoryRepository chatHistoryRepository;
    private final ActivityService activityService;

    @PostMapping("/ask")
    public ResponseEntity<?> askKrishiGPT(@RequestBody ChatRequest request,
            HttpServletRequest httpRequest) {
        try {
            String userId = (String) httpRequest.getAttribute("userId");
            String userEmail = (String) httpRequest.getAttribute("userEmail");
            String userName = (String) httpRequest.getAttribute("userName");

            log.info("Chat — Crop: {}, Language: {}, User: {}", request.getCrop(), request.getLanguage(), userEmail);

            String answer = krishiGPTService.askKrishiGPT(
                    request.getQuestion(), request.getCrop(), request.getLanguage());

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

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Chat error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Chat failed: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "service", "KrishiGPT Chat",
                "status", "Running",
                "timestamp", LocalDateTime.now().toString()));
    }
}
