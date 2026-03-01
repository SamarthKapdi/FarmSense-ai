package com.farmsense.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "detection_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetectionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String farmerId;
    private String cropName;
    private String diseaseName;
    private Integer confidence;
    private String severity;
    private String yieldLossEstimate;
    private String language;

    @Column(columnDefinition = "TEXT")
    private String organicTreatment;

    @Column(columnDefinition = "TEXT")
    private String chemicalTreatment;

    @Column(columnDefinition = "TEXT")
    private String preventiveMeasures;

    private String bestTimeToTreat;
    private String estimatedRecoveryCost;
    private String urgencyLevel;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
