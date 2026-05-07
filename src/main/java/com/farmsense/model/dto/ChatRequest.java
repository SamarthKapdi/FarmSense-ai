package com.farmsense.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatRequest {

    private String question;
    private String crop;
    private String language;
    private String farmerId;
    private String imageBase64;
}
