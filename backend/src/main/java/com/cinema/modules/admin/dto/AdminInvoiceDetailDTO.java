package com.cinema.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminInvoiceDetailDTO {
    private UUID invoiceId;
    private String ticketCode;
    private String customerName;
    private String emailAddress;
    private String phoneNumber;
    private BigDecimal totalPrice;
    private BigDecimal finalPrice;
    private String invoiceStatus;
    private String discountCode;
    private String paymentMethod;
    private LocalDateTime createdDatetime;

    private String movieTitle;
    private String cinemaName;
    private String roomName;
    private String showDate;
    private String showTime;

    private List<String> seatNames;
    private List<ProductItemDTO> products;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductItemDTO {
        private String productName;
        private Integer quantity;
        private BigDecimal price;
    }
}
