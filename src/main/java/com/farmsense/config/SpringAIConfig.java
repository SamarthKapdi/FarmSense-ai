package com.farmsense.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;

import java.util.Map;
import java.util.function.Function;

@Configuration
public class SpringAIConfig {

    @Value("${spring.ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${spring.ai.ollama.chat.model:llama3:latest}")
    private String chatModelName;

    @Value("${spring.ai.ollama.vision.model:llama3.2-vision:latest}")
    private String visionModelName;

    @Bean
    public ChatMemory chatMemory() {
        return new InMemoryChatMemory();
    }

    @Bean
    public OllamaApi ollamaApi() {
        return new OllamaApi(ollamaBaseUrl);
    }

    @Bean(name = "chatChatModel")
    public OllamaChatModel chatChatModel(OllamaApi ollamaApi) {
        return OllamaChatModel.builder()
                .ollamaApi(ollamaApi)
            .defaultOptions(OllamaOptions.builder().model(chatModelName).build())
                .build();
    }

    @Bean(name = "visionChatModel")
    public OllamaChatModel visionChatModel(OllamaApi ollamaApi) {
        return OllamaChatModel.builder()
                .ollamaApi(ollamaApi)
            .defaultOptions(OllamaOptions.builder().model(visionModelName).build())
                .build();
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
    public ChatClient chatChatClient(@org.springframework.beans.factory.annotation.Qualifier("chatChatModel") OllamaChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultSystem(
                        "You are KrishiGPT, an expert Indian agricultural scientist. " +
                                "If the farmer asks about prices, use the fetchMarketPrice tool to get real-time info.")
                .build();
    }

    @Bean(name = "visionChatClient")
    public ChatClient visionChatClient(@org.springframework.beans.factory.annotation.Qualifier("visionChatModel") OllamaChatModel visionChatModel) {
        return ChatClient.builder(visionChatModel).build();
    }

    @Bean
    public org.springframework.web.reactive.function.client.WebClient.Builder webClientBuilder() {
        return org.springframework.web.reactive.function.client.WebClient.builder();
    }
}
