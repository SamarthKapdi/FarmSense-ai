package com.farmsense.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SpringAIConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem(
                        "You are KrishiGPT, an expert Indian agricultural scientist with 20 years of experience helping farmers across India.")
                .build();
    }
}
