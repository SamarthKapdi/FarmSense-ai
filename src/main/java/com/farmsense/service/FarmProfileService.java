package com.farmsense.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmsense.model.dto.FarmProfileRequest;
import com.farmsense.model.dto.FarmProfileResponse;
import com.farmsense.model.entity.FarmProfile;
import com.farmsense.model.entity.User;
import com.farmsense.repository.FarmProfileRepository;
import com.farmsense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FarmProfileService {

    private final FarmProfileRepository farmProfileRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public FarmProfileResponse createProfile(String userId, FarmProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FarmProfile profile = FarmProfile.builder()
                .user(user)
                .farmName(request.getFarmName())
                .location(request.getLocation())
                .city(request.getCity())
                .state(request.getState())
                .farmSizeAcres(request.getFarmSizeAcres())
                .crops(toJson(request.getCrops()))
                .soilType(request.getSoilType())
                .irrigationType(request.getIrrigationType())
                .build();

        FarmProfile saved = farmProfileRepository.save(profile);
        log.info("Farm profile created for user {}: {}", userId, saved.getFarmName());
        return toResponse(saved);
    }

    public List<FarmProfileResponse> getUserProfiles(String userId) {
        return farmProfileRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public FarmProfileResponse getProfile(String profileId, String userId) {
        FarmProfile profile = farmProfileRepository.findByIdAndUserId(profileId, userId)
                .orElseThrow(() -> new RuntimeException("Farm profile not found"));
        return toResponse(profile);
    }

    @Transactional
    public FarmProfileResponse updateProfile(String profileId, String userId, FarmProfileRequest request) {
        FarmProfile profile = farmProfileRepository.findByIdAndUserId(profileId, userId)
                .orElseThrow(() -> new RuntimeException("Farm profile not found"));

        profile.setFarmName(request.getFarmName());
        profile.setLocation(request.getLocation());
        profile.setCity(request.getCity());
        profile.setState(request.getState());
        profile.setFarmSizeAcres(request.getFarmSizeAcres());
        profile.setCrops(toJson(request.getCrops()));
        profile.setSoilType(request.getSoilType());
        profile.setIrrigationType(request.getIrrigationType());

        FarmProfile saved = farmProfileRepository.save(profile);
        return toResponse(saved);
    }

    @Transactional
    public void deleteProfile(String profileId, String userId) {
        FarmProfile profile = farmProfileRepository.findByIdAndUserId(profileId, userId)
                .orElseThrow(() -> new RuntimeException("Farm profile not found"));
        farmProfileRepository.delete(profile);
        log.info("Farm profile deleted: {}", profileId);
    }

    private FarmProfileResponse toResponse(FarmProfile p) {
        return FarmProfileResponse.builder()
                .id(p.getId())
                .farmName(p.getFarmName())
                .location(p.getLocation())
                .city(p.getCity())
                .state(p.getState())
                .farmSizeAcres(p.getFarmSizeAcres())
                .crops(fromJson(p.getCrops()))
                .soilType(p.getSoilType())
                .irrigationType(p.getIrrigationType())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private String toJson(List<String> list) {
        if (list == null) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }
}
