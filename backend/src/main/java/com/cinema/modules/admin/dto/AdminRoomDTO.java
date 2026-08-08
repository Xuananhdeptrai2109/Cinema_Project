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
public class AdminRoomDTO {
    private Long roomId;
    private String roomName;
    private Long cinemasId;
    private String cinemaName;
    private Long screeningFormatId;
    private String screeningFormatType;
    private BigDecimal price;
}
