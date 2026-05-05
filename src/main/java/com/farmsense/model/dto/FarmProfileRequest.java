package com.farmsense.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FarmProfileRequest {

    @NotBlank(message = "Farm name is required")
    @Size(max = 100)
    private String farmName;

    @Size(max = 200)
    private String location;

    private String city;
    private String state;
    private Double farmSizeAcres;
    private List<String> crops;
    private String soilType;
    private String irrigationType;
}
