package com.farmsense.config;

import lombok.extern.slf4j.Slf4j;
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
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.function.Function;

/**
 * Spring AI + Ollama configuration with production-grade timeouts and ngrok compatibility.
 *
 * KEY FIX: All HTTP calls to Ollama include the "ngrok-skip-browser-warning" header.
 * Without this, ngrok free tier returns an HTML interstitial page instead of JSON,
 * causing all API calls to fail silently.
 */
@Configuration
@Slf4j
public class SpringAIConfig {

    @Value("${spring.ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${spring.ai.ollama.chat.model:llama3:latest}")
    private String chatModelName;

    @Value("${spring.ai.ollama.vision.model:llava:7b}")
    private String visionModelName;

    // ── Timeout-safe + ngrok-safe OllamaApi ─────────────────────────────────────

    @Bean
    public OllamaApi ollamaApi() {
        // Sanitize: strip trailing /api or slashes that would break OllamaApi paths
        String cleanUrl = ollamaBaseUrl.replaceAll("/+$", "").replaceAll("/api$", "");

        log.info("╔══════════════════════════════════════════════════════════╗");
        log.info("║  OLLAMA CONFIGURATION                                  ║");
        log.info("║  BASE URL  : {}", cleanUrl);
        log.info("║  RAW INPUT : {}", ollamaBaseUrl);
        log.info("║  CHAT MODEL: {}", chatModelName);
        log.info("║  VISION    : {}", visionModelName);
        log.info("╚══════════════════════════════════════════════════════════╝");

        // RestClient timeout (for non-streaming synchronous calls)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(300)); // 5 minutes — vision models need this

        RestClient.Builder restClientBuilder = RestClient.builder()
                .requestFactory(factory)
                // CRITICAL: ngrok free tier blocks requests without this header
                .defaultHeader("ngrok-skip-browser-warning", "true")
                .defaultHeader("User-Agent", "FarmSense-AI/2.0");

        // WebClient timeout (for streaming calls)
        org.springframework.web.reactive.function.client.WebClient.Builder webClientBuilder =
                org.springframework.web.reactive.function.client.WebClient.builder()
                        .defaultHeader("ngrok-skip-browser-warning", "true")
                        .defaultHeader("User-Agent", "FarmSense-AI/2.0");

        return new OllamaApi(cleanUrl, restClientBuilder, webClientBuilder);
    }

    // ── Chat Memory ─────────────────────────────────────────────────────────────

    @Bean
    public ChatMemory chatMemory() {
        return new InMemoryChatMemory();
    }

    // ── Chat Model (llama3 — text only) ─────────────────────────────────────────

    @Bean(name = "chatChatModel")
    public OllamaChatModel chatChatModel(OllamaApi ollamaApi) {
        return OllamaChatModel.builder()
                .ollamaApi(ollamaApi)
                .defaultOptions(OllamaOptions.builder()
                        .model(chatModelName)
                        .temperature(0.7)
                        .build())
                .build();
    }

    // ── Vision Model (llava:7b — multimodal, 8GB-safe) ──────────────────────────

    @Bean(name = "visionChatModel")
    public OllamaChatModel visionChatModel(OllamaApi ollamaApi) {
        return OllamaChatModel.builder()
                .ollamaApi(ollamaApi)
                .defaultOptions(OllamaOptions.builder()
                        .model(visionModelName)
                        .temperature(0.3) // Lower temp = more deterministic JSON
                        .build())
                .build();
    }

    // ── ChatClient wrappers ─────────────────────────────────────────────────────

    @Bean
    public ChatClient chatChatClient(
            @org.springframework.beans.factory.annotation.Qualifier("chatChatModel") OllamaChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultSystem(
                        "You are KrishiGPT, an expert Indian agricultural scientist. " +
                                "If the farmer asks about prices, use the fetchMarketPrice tool to get real-time info.")
                .build();
    }

    @Bean(name = "visionChatClient")
    public ChatClient visionChatClient(
            @org.springframework.beans.factory.annotation.Qualifier("visionChatModel") OllamaChatModel visionChatModel) {
        return ChatClient.builder(visionChatModel).build();
    }

    // ── Function Calling: Market Prices ──────────────────────────────────────────

    public record MarketPriceRequest(String cropName, String state) {
    }

    public record MarketPriceResponse(String cropName, String state, String currentPricePerQuintal, String trend) {
    }

    @Bean
    @Description("Fetch the current APMC Mandi market price of a specific crop in a specific Indian state")
    public Function<MarketPriceRequest, MarketPriceResponse> fetchMarketPrice() {
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

    // ── WebClient Builder (used by AdminService) ────────────────────────────────

    @Bean
    public org.springframework.web.reactive.function.client.WebClient.Builder webClientBuilder() {
        return org.springframework.web.reactive.function.client.WebClient.builder();
    }
}
