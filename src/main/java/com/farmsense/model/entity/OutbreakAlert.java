package com.farmsense.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "outbreak_alerts")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OutbreakAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.VARCHAR)
    private String id;

    private String disease;
    private String region;
    private int reportCount;
    private LocalDateTime firstReportedAt;
    private LocalDateTime lastReportedAt;
    private String severity; // LOW, MEDIUM, HIGH

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
