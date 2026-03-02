package com.farmsense.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;

import java.util.Map;
import java.util.function.Function;

@Configuration
public class SpringAIConfig {

    @Bean
    public ChatMemory chatMemory() {
        return new InMemoryChatMemory();
    }

    // ── Java 21+ Data Records for Spring AI Function Calling ──
    public record MarketPriceRequest(String cropName, String state) {
    }

    public record MarketPriceResponse(String cropName, String state, String currentPricePerQuintal, String trend) {
    }

    @Bean
    @Description("Fetch the current APMC Mandi market price of a specific crop in a specific Indian state")
    public Function<MarketPriceRequest, MarketPriceResponse> fetchMarketPrice() {
        // Mocking real APIs - structured function tool calling
        return request -> {
            String crop = request.cropName().toLowerCase();
            String price = switch (crop) {
                case "tomato" -> "₹1,200";
                case "wheat" -> "₹2,275";
                case "rice", "paddy" -> "₹2,183";
                case "cotton" -> "₹6,620";
                case "potato" -> "₹800";
                default -> "₹1,500";
            };

            String trend = Math.random() > 0.5 ? "Up 🔺" : "Down 🔻";
            return new MarketPriceResponse(request.cropName(), request.state(), price, trend);
        };
    }

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder, ChatMemory chatMemory) {
        return builder
                .defaultSystem(
                        "You are KrishiGPT, an expert Indian agricultural scientist. " +
                                "If the farmer asks about prices, use the fetchMarketPrice tool to get real-time info.")
                .build();
    }
}
