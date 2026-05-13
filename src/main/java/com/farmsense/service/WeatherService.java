package com.farmsense.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class WeatherService {

    private final WebClient webClient = WebClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // In-memory cache
    private final Map<String, CacheEntry> weatherCache = new ConcurrentHashMap<>();
    private final Map<String, String> cityCache = new ConcurrentHashMap<>();

    private static class CacheEntry {
        Object data;
        LocalDateTime timestamp;

        CacheEntry(Object data) {
            this.data = data;
            this.timestamp = LocalDateTime.now();
        }

        boolean isExpired(int minutes) {
            return timestamp.plusMinutes(minutes).isBefore(LocalDateTime.now());
        }
    }

    public Map<String, Object> getCurrentWeather(double lat, double lon) {
        String cacheKey = "current_" + lat + "_" + lon;
        if (weatherCache.containsKey(cacheKey) && !weatherCache.get(cacheKey).isExpired(15)) {
            return (Map<String, Object>) weatherCache.get(cacheKey).data;
        }

        try {
            String url = String.format("https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f" +
                            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code," +
                            "wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,cloud_cover,pressure_msl,uv_index,is_day",
                    lat, lon);

            String response = webClient.get().uri(url).retrieve().bodyToMono(String.class).block();
            JsonNode root = objectMapper.readTree(response);
            JsonNode current = root.path("current");

            int code = current.path("weather_code").asInt();
            double temp = current.path("temperature_2m").asDouble();
            int humidity = current.path("relative_humidity_2m").asInt();

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("latitude", lat);
            data.put("longitude", lon);
            data.put("cityName", getCityName(lat, lon));
            data.put("temperature", temp);
            data.put("feelsLike", current.path("apparent_temperature").asDouble());
            data.put("humidity", humidity);
            data.put("windSpeed", current.path("wind_speed_10m").asDouble());
            data.put("windDirection", current.path("wind_direction_10m").asInt());
            data.put("windGusts", current.path("wind_gusts_10m").asDouble());
            data.put("pressure", current.path("pressure_msl").asDouble());
            data.put("uvIndex", current.path("uv_index").asDouble());
            data.put("weatherCode", code);
            data.put("weatherDescription", mapWeatherCode(code));
            data.put("weatherIcon", mapWeatherIcon(code));
            data.put("isDay", current.path("is_day").asInt() == 1);
            data.put("cloudCover", current.path("cloud_cover").asInt());
            data.put("precipitation", current.path("precipitation").asDouble());
            data.put("lastUpdated", LocalDateTime.now().toString());
            data.put("alerts", generateDiseaseAlerts(temp, humidity));

            weatherCache.put(cacheKey, new CacheEntry(data));
            return data;
        } catch (Exception e) {
            log.error("Failed to fetch current weather for {}, {}: {}", lat, lon, e.getMessage());
            if (weatherCache.containsKey(cacheKey)) {
                Map<String, Object> cached = (Map<String, Object>) weatherCache.get(cacheKey).data;
                cached.put("isFallback", true);
                return cached;
            }
            throw new RuntimeException("Weather service currently unavailable");
        }
    }

    public List<Map<String, Object>> getHourlyForecast(double lat, double lon) {
        String cacheKey = "hourly_" + lat + "_" + lon;
        if (weatherCache.containsKey(cacheKey) && !weatherCache.get(cacheKey).isExpired(15)) {
            return (List<Map<String, Object>>) weatherCache.get(cacheKey).data;
        }

        try {
            String url = String.format("https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f" +
                            "&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m&forecast_days=2",
                    lat, lon);

            String response = webClient.get().uri(url).retrieve().bodyToMono(String.class).block();
            JsonNode root = objectMapper.readTree(response);
            JsonNode hourly = root.path("hourly");

            List<Map<String, Object>> forecast = new ArrayList<>();
            JsonNode times = hourly.path("time");
            JsonNode temps = hourly.path("temperature_2m");
            JsonNode probs = hourly.path("precipitation_probability");
            JsonNode codes = hourly.path("weather_code");
            JsonNode winds = hourly.path("wind_speed_10m");
            JsonNode hums = hourly.path("relative_humidity_2m");

            // Get next 24 hours
            int startIndex = 0;
            String now = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0).toString().substring(0, 13);
            for (int i = 0; i < times.size(); i++) {
                if (times.get(i).asText().startsWith(now)) {
                    startIndex = i;
                    break;
                }
            }

            for (int i = startIndex; i < startIndex + 24 && i < times.size(); i++) {
                Map<String, Object> hour = new LinkedHashMap<>();
                int code = codes.get(i).asInt();
                hour.put("time", times.get(i).asText());
                hour.put("temperature", temps.get(i).asDouble());
                hour.put("precipitationProbability", probs.get(i).asInt());
                hour.put("weatherCode", code);
                hour.put("weatherDescription", mapWeatherCode(code));
                hour.put("weatherIcon", mapWeatherIcon(code));
                hour.put("windSpeed", winds.get(i).asDouble());
                hour.put("humidity", hums.get(i).asInt());
                forecast.add(hour);
            }

            weatherCache.put(cacheKey, new CacheEntry(forecast));
            return forecast;
        } catch (Exception e) {
            log.error("Failed to fetch hourly forecast: {}", e.getMessage());
            return (List<Map<String, Object>>) weatherCache.getOrDefault(cacheKey, new CacheEntry(new ArrayList<>())).data;
        }
    }

    public List<Map<String, Object>> getDailyForecast(double lat, double lon, int days) {
        String cacheKey = "daily_" + lat + "_" + lon + "_" + days;
        if (weatherCache.containsKey(cacheKey) && !weatherCache.get(cacheKey).isExpired(15)) {
            return (List<Map<String, Object>>) weatherCache.get(cacheKey).data;
        }

        try {
            String url = String.format("https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f" +
                            "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max," +
                            "wind_speed_10m_max,sunrise,sunset,uv_index_max,weather_code&timezone=auto&forecast_days=%d",
                    lat, lon, days);

            String response = webClient.get().uri(url).retrieve().bodyToMono(String.class).block();
            JsonNode root = objectMapper.readTree(response);
            JsonNode daily = root.path("daily");

            List<Map<String, Object>> forecast = new ArrayList<>();
            JsonNode dates = daily.path("time");
            JsonNode maxTemps = daily.path("temperature_2m_max");
            JsonNode minTemps = daily.path("temperature_2m_min");
            JsonNode codes = daily.path("weather_code");
            JsonNode precips = daily.path("precipitation_sum");
            JsonNode probs = daily.path("precipitation_probability_max");
            JsonNode winds = daily.path("wind_speed_10m_max");
            JsonNode sunrises = daily.path("sunrise");
            JsonNode sunsets = daily.path("sunset");
            JsonNode uvs = daily.path("uv_index_max");

            for (int i = 0; i < dates.size(); i++) {
                Map<String, Object> day = new LinkedHashMap<>();
                int code = codes.get(i).asInt();
                day.put("date", dates.get(i).asText());
                day.put("highTemp", maxTemps.get(i).asDouble());
                day.put("lowTemp", minTemps.get(i).asDouble());
                day.put("weatherCode", code);
                day.put("weatherDescription", mapWeatherCode(code));
                day.put("weatherIcon", mapWeatherIcon(code));
                day.put("precipitation", precips.get(i).asDouble());
                day.put("precipitationProbability", probs.get(i).asInt());
                day.put("windSpeed", winds.get(i).asDouble());
                day.put("sunrise", sunrises.get(i).asText());
                day.put("sunset", sunsets.get(i).asText());
                day.put("uvIndex", uvs.get(i).asDouble());
                forecast.add(day);
            }

            weatherCache.put(cacheKey, new CacheEntry(forecast));
            return forecast;
        } catch (Exception e) {
            log.error("Failed to fetch daily forecast: {}", e.getMessage());
            return (List<Map<String, Object>>) weatherCache.getOrDefault(cacheKey, new CacheEntry(new ArrayList<>())).data;
        }
    }

    public Map<String, Object> getAirQuality(double lat, double lon) {
        String cacheKey = "aqi_" + lat + "_" + lon;
        if (weatherCache.containsKey(cacheKey) && !weatherCache.get(cacheKey).isExpired(15)) {
            return (Map<String, Object>) weatherCache.get(cacheKey).data;
        }

        try {
            String url = String.format("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=%f&longitude=%f" +
                            "&current=european_aqi,pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide",
                    lat, lon);

            String response = webClient.get().uri(url).retrieve().bodyToMono(String.class).block();
            JsonNode root = objectMapper.readTree(response);
            JsonNode current = root.path("current");

            int aqi = current.path("european_aqi").asInt();
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("aqi", aqi);
            data.put("pm10", current.path("pm10").asDouble());
            data.put("pm25", current.path("pm2_5").asDouble());
            data.put("ozone", current.path("ozone").asDouble());
            data.put("nitrogenDioxide", current.path("nitrogen_dioxide").asDouble());
            data.put("sulphurDioxide", current.path("sulphur_dioxide").asDouble());
            data.put("category", getAQICategory(aqi));
            data.put("healthRecommendation", getAQIRecommendation(aqi));

            weatherCache.put(cacheKey, new CacheEntry(data));
            return data;
        } catch (Exception e) {
            log.error("Failed to fetch air quality: {}", e.getMessage());
            return (Map<String, Object>) weatherCache.getOrDefault(cacheKey, new CacheEntry(new HashMap<>())).data;
        }
    }

    public String getCityName(double lat, double lon) {
        String cacheKey = lat + "_" + lon;
        if (cityCache.containsKey(cacheKey)) {
            return cityCache.get(cacheKey);
        }

        try {
            // Open-Meteo geocoding search doesn't support reverse geocoding via lat/lon.
            // Using a generic location identifier since coordinates are the primary source of truth.
            
            String name = "📍 Current Location";
            cityCache.put(cacheKey, name);
            return name;
        } catch (Exception e) {
            return "Unknown Location";
        }
    }

    private String mapWeatherCode(int code) {
        return switch (code) {
            case 0 -> "Clear sky";
            case 1 -> "Mainly clear";
            case 2 -> "Partly cloudy";
            case 3 -> "Overcast";
            case 45, 48 -> "Foggy";
            case 51, 53, 55 -> "Drizzle";
            case 61, 63, 65 -> "Rain";
            case 71, 73, 75 -> "Snow";
            case 77 -> "Snow grains";
            case 80, 81, 82 -> "Rain showers";
            case 85, 86 -> "Snow showers";
            case 95 -> "Thunderstorm";
            case 96, 99 -> "Thunderstorm with hail";
            default -> "Unknown";
        };
    }

    private String mapWeatherIcon(int code) {
        return switch (code) {
            case 0 -> "sunny";
            case 1, 2 -> "cloudy-sunny";
            case 3 -> "cloudy";
            case 45, 48 -> "foggy";
            case 51, 53, 55, 61, 63, 65, 80, 81, 82 -> "rainy";
            case 71, 73, 75, 77, 85, 86 -> "snowy";
            case 95, 96, 99 -> "stormy";
            default -> "unknown";
        };
    }

    private String getAQICategory(int aqi) {
        if (aqi <= 20) return "Good";
        if (aqi <= 40) return "Moderate";
        if (aqi <= 60) return "Poor";
        if (aqi <= 80) return "Unhealthy";
        if (aqi <= 100) return "Very Unhealthy";
        return "Hazardous";
    }

    private String getAQIRecommendation(int aqi) {
        if (aqi <= 20) return "Air quality is ideal for outdoor activities.";
        if (aqi <= 40) return "Air quality is acceptable; however, some people may be sensitive.";
        if (aqi <= 60) return "Sensitive groups should reduce outdoor exercise.";
        if (aqi <= 80) return "Avoid outdoor activities if you experience symptoms.";
        if (aqi <= 100) return "Everyone should limit outdoor time.";
        return "Stay indoors and keep windows closed.";
    }

    private List<Map<String, String>> generateDiseaseAlerts(double temp, int humidity) {
        List<Map<String, String>> alerts = new ArrayList<>();
        if (humidity > 85 && temp > 20 && temp < 30) {
            alerts.add(Map.of("level", "HIGH", "disease", "Late Blight", "message", "High risk of Late Blight.", "icon", "🚨"));
        }
        if (humidity > 80) {
            alerts.add(Map.of("level", "MEDIUM", "disease", "Downy Mildew", "message", "Monitor for Downy Mildew.", "icon", "⚠️"));
        }
        if (alerts.isEmpty()) {
            alerts.add(Map.of("level", "OK", "disease", "None", "message", "Conditions are favorable.", "icon", "✅"));
        }
        return alerts;
    }

    // This method is kept for backward compatibility if needed, but updated to use lat/lon of Mumbai as default
    public Map<String, Object> getWeather(String city) {
        // Simple mapping for demo: Mumbai
        if ("Mumbai".equalsIgnoreCase(city)) return getCurrentWeather(19.0760, 72.8777);
        if ("Delhi".equalsIgnoreCase(city)) return getCurrentWeather(28.6139, 77.2090);
        return getCurrentWeather(19.0760, 72.8777);
    }
}
