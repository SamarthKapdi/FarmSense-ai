package com.farmsense.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Configuration for direct HTTP API calls to Gemini and Groq.
 * Production-ready cloud AI integration without Spring AI dependencies.
 */
@Configuration
@Slf4j
public class SpringAIConfig {

    // ── WebClient for HTTP API calls ───────────────────────────────────────────

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024)); // 10MB for images
    }
}
