package com.farmsense.controller;

import com.farmsense.model.entity.User;
import com.farmsense.repository.UserRepository;
import com.farmsense.service.SseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/sse")
@RequiredArgsConstructor
public class SseController {

    private final SseService sseService;
    private final UserRepository userRepository;

    /**
     * Per-user SSE stream. Receives notifications, verification updates, etc.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        return sseService.subscribe(user.getId());
    }

    /**
     * Global broadcast stream for admin dashboards.
     */
    @GetMapping(value = "/broadcast", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter broadcast() {
        return sseService.subscribeBroadcast();
    }
}
