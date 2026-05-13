package com.farmsense.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Comprehensive disease detection result with full agricultural intelligence.
 * All fields are populated from Gemini Vision AI — no hardcoded fallbacks.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DetectionResult {

    // ── Core Identity ──────────────────────────────────────────
    private String diseaseName;
    private String scientificName;
    private String cropName;
    private String description;

    // ── Confidence & Image Quality ─────────────────────────────
    private int confidence;
    private String confidenceReasoning;
    private int imageQualityScore;
    private String imageQualityReasoning;

    // ── Severity & Urgency ────────────────────────────────────
    private String severity;
    private String urgencyLevel;
    private String progressionSpeed;
    private String recoverability;

    // ── Spread ─────────────────────────────────────────────────
    private String spreadRisk;
    private String spreadMechanism;

    // ── Symptoms ───────────────────────────────────────────────
    private List<String> symptoms;

    // ── Environmental ──────────────────────────────────────────
    private List<String> environmentalCauses;
    private String weatherImpact;
    private String soilImpact;
    private String wateringAdvice;
    private String fertilizerAdvice;

    // ── Treatment: Organic ─────────────────────────────────────
    private List<String> organicTreatment;

    // ── Treatment: Chemical ────────────────────────────────────
    private List<String> chemicalTreatment;
    private List<String> dosage;
    private String sprayInterval;

    // ── Treatment: Preventive ──────────────────────────────────
    private List<String> preventiveMeasures;

    // ── Treatment Timing ───────────────────────────────────────
    private String bestTimeToTreat;
    private String monitoringAdvice;

    // ── Economic Impact ────────────────────────────────────────
    private double yieldLossPercent;
    private String yieldLossEstimate;
    private String yieldLossReasoning;
    private String estimatedRecoveryCost;

    // ── Differential Diagnosis ─────────────────────────────────
    private List<String> differentialDiagnosis;
    private String differentialDiagnosisReasoning;

    // ── Meta ───────────────────────────────────────────────────
    @JsonProperty("isHealthy")
    private boolean isHealthy;
    private String language;
    private LocalDateTime timestamp;

    // ── Legacy compatibility aliases (read-only, derived) ──────
    @Deprecated
    public String getDisease() { return diseaseName; }
    @Deprecated
    public void setDisease(String d) { this.diseaseName = d; }

    @Deprecated
    public String getOrganic() {
        return organicTreatment != null && !organicTreatment.isEmpty()
                ? String.join("; ", organicTreatment) : null;
    }

    @Deprecated
    public String getChemical() {
        return chemicalTreatment != null && !chemicalTreatment.isEmpty()
                ? String.join("; ", chemicalTreatment) : null;
    }

    @Deprecated
    public String getPreventive() {
        return preventiveMeasures != null && !preventiveMeasures.isEmpty()
                ? String.join("; ", preventiveMeasures) : null;
    }
}
