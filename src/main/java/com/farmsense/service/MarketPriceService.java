package com.farmsense.service;

import com.farmsense.model.dto.MandiPriceResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class MarketPriceService {

    private final Map<String, CachedPrices> priceCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60 * 60 * 1000L; // 1 hour

    private record CachedPrices(List<MandiPriceResponse> data, long timestamp) {}

    private static final List<String> STATES = List.of(
            "Maharashtra", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana",
            "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Gujarat", "Punjab",
            "Haryana", "West Bengal", "Bihar", "Odisha", "Kerala"
    );

    private static final List<String> TRACKED_CROPS = List.of(
            "Tomato", "Wheat", "Rice", "Potato", "Cotton", "Onion",
            "Maize", "Soybean", "Sugarcane", "Chili", "Groundnut", "Mango"
    );

    public List<String> getStates() {
        return STATES;
    }

    public List<String> getTrackedCrops() {
        return TRACKED_CROPS;
    }

    public List<MandiPriceResponse> getPrices(String crop, String state) {
        String cacheKey = (crop + "_" + state).toLowerCase();
        CachedPrices cached = priceCache.get(cacheKey);

        if (cached != null && (System.currentTimeMillis() - cached.timestamp()) < CACHE_TTL_MS) {
            return cached.data();
        }

        // Generate realistic mock data with disclaimer (free APIs are unreliable)
        List<MandiPriceResponse> prices = generateMockPrices(crop, state);
        priceCache.put(cacheKey, new CachedPrices(prices, System.currentTimeMillis()));
        return prices;
    }

    private List<MandiPriceResponse> generateMockPrices(String crop, String state) {
        Random rng = new Random(Objects.hash(crop, state, LocalDate.now().getDayOfYear()));
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

        Map<String, List<String>> stateMarkets = Map.of(
                "Maharashtra", List.of("Pune", "Nashik", "Nagpur", "Mumbai APMC", "Solapur"),
                "Karnataka", List.of("Bangalore", "Hubli", "Mysore", "Belgaum", "Mangalore"),
                "Tamil Nadu", List.of("Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"),
                "Uttar Pradesh", List.of("Lucknow", "Agra", "Varanasi", "Kanpur", "Meerut"),
                "Punjab", List.of("Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda")
        );

        List<String> markets = stateMarkets.getOrDefault(state,
                List.of(state + " Mandi 1", state + " Mandi 2", state + " Mandi 3"));

        // Base prices by crop (₹ per quintal)
        Map<String, int[]> basePrices = Map.of(
                "Tomato", new int[]{800, 2500},
                "Wheat", new int[]{2000, 2800},
                "Rice", new int[]{1800, 3200},
                "Potato", new int[]{600, 1500},
                "Onion", new int[]{700, 2200},
                "Cotton", new int[]{5000, 7500},
                "Maize", new int[]{1400, 2200},
                "Soybean", new int[]{3500, 5500}
        );

        int[] range = basePrices.getOrDefault(crop, new int[]{1000, 3000});

        List<MandiPriceResponse> result = new ArrayList<>();
        for (String market : markets) {
            int min = range[0] + rng.nextInt(500);
            int max = range[1] - rng.nextInt(500);
            int modal = (min + max) / 2 + rng.nextInt(200) - 100;

            result.add(MandiPriceResponse.builder()
                    .crop(crop)
                    .state(state)
                    .market(market)
                    .arrivalDate(today)
                    .minPrice("₹" + min + "/q")
                    .maxPrice("₹" + max + "/q")
                    .modalPrice("₹" + modal + "/q")
                    .build());
        }
        return result;
    }
}
