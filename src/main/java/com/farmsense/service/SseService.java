package com.farmsense.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Server-Sent Events hub for real-time push to all connected clients.
 * Supports per-user streams and broadcast events.
 */
@Service
@Slf4j
public class SseService {

    // userId -> list of active SSE connections (supports multi-tab)
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    // Global broadcast emitters (admin dashboards, etc.)
    private final CopyOnWriteArrayList<SseEmitter> globalEmitters = new CopyOnWriteArrayList<>();

    /**
     * Register a per-user SSE connection.
     */
    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(300_000L); // 5 min timeout

        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(e -> removeEmitter(userId, emitter));

        // Send initial heartbeat
        try {
            emitter.send(SseEmitter.event().name("connected").data("{\"status\":\"connected\"}"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        log.info("SSE: User {} connected (total connections: {})",
                userId, userEmitters.getOrDefault(userId, new CopyOnWriteArrayList<>()).size());
        return emitter;
    }

    /**
     * Register a global broadcast SSE connection (for admin dashboards).
     */
    public SseEmitter subscribeBroadcast() {
        SseEmitter emitter = new SseEmitter(300_000L);
        globalEmitters.add(emitter);

        emitter.onCompletion(() -> globalEmitters.remove(emitter));
        emitter.onTimeout(() -> globalEmitters.remove(emitter));
        emitter.onError(e -> globalEmitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("{\"status\":\"connected\"}"));
        } catch (IOException e) {
            globalEmitters.remove(emitter);
        }
        return emitter;
    }

    /**
     * Send event to a specific user (all their tabs).
     */
    public void sendToUser(String userId, String eventName, Object data) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) return;

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                removeEmitter(userId, emitter);
            }
        }
    }

    /**
     * Broadcast event to ALL connected global listeners.
     */
    public void broadcast(String eventName, Object data) {
        for (SseEmitter emitter : globalEmitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                globalEmitters.remove(emitter);
            }
        }
    }

    /**
     * Broadcast to specific list of users.
     */
    public void sendToUsers(java.util.List<String> userIds, String eventName, Object data) {
        for (String userId : userIds) {
            sendToUser(userId, eventName, data);
        }
    }

    private void removeEmitter(String userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }

    public int getActiveConnections() {
        return userEmitters.values().stream().mapToInt(CopyOnWriteArrayList::size).sum() + globalEmitters.size();
    }
}
