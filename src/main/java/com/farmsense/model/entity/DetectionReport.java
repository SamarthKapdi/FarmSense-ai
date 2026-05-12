package com.farmsense.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "detection_reports", indexes = {
    @Index(name = "idx_report_user", columnList = "user_id"),
    @Index(name = "idx_report_created", columnList = "createdAt")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetectionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.VARCHAR)
    private String id;

    // Proper FK relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Keep farmerId for backward compatibility during migration
    @Column(name = "farmer_id")
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

    @Builder.Default
    private boolean isBookmarked = false;

    @Builder.Default
    private boolean isHealthy = false;

    @Builder.Default
    private boolean verified = false;

    @Column(columnDefinition = "TEXT")
    private String expertNotes;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
