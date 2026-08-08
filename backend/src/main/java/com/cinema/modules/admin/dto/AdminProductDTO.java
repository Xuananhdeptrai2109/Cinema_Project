package com.cinema.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductDTO {
    private Long productId;
    private String productName;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private boolean isAvailable;
    private Long productTypeId;
    private String productTypeName;
}
