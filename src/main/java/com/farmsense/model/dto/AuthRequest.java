package com.farmsense.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    private String fullName;
    private String email;
    private String password;
    private String otpCode;
    private String purpose;
}
