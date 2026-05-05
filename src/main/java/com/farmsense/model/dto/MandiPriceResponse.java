package com.farmsense.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MandiPriceResponse {
    private String crop;
    private String state;
    private String market;
    private String arrivalDate;
    private String minPrice;
    private String maxPrice;
    private String modalPrice;
}
