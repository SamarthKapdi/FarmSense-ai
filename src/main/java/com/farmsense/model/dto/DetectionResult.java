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
public class DetectionResult {

    private String disease;
    private double yieldLossPercent;
    private String organic;
    private String chemical;
    private String preventive;

    private String diseaseName;
    private List<String> affectedCrops;
    private String severity;
    private String yieldLossEstimate;
    private List<String> symptoms;
    private List<String> organicTreatment;
    private List<String> chemicalTreatment;
    private List<String> preventiveMeasures;
    private String bestTimeToTreat;
    private String estimatedRecoveryCost;
    private int confidence;
    private String cropName;
    private String language;
    private LocalDateTime timestamp;
    private boolean isHealthy;
    private String urgencyLevel;
}
