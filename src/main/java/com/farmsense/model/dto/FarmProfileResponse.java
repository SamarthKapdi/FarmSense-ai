package com.farmsense.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FarmProfileResponse {

    private String id;
    private String farmName;
    private String location;
    private String city;
    private String state;
    private Double farmSizeAcres;
    private List<String> crops;
    private String soilType;
    private String irrigationType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
