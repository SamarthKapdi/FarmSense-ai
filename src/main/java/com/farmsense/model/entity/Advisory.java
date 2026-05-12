package com.farmsense.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "advisories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Advisory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.VARCHAR)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String crop;

    private String region;

    @Column(name = "author_id")
    private String authorId;

    private LocalDateTime validUntil;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
