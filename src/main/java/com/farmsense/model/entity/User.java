package com.farmsense.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    private String passwordHash;

    @Builder.Default
    private boolean emailVerified = false;

    @Builder.Default
    private String role = "FARMER";

    @Builder.Default
    private String preferredLanguage = "en";

    @Builder.Default
    private String preferredCrop = "Tomato";

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime lastLoginAt;
}
