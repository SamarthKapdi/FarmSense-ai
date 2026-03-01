package com.farmsense.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DiseaseInfo {

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
}
