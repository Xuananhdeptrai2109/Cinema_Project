package com.cinema.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSeatItemDTO {
    private Long seatId;
    private String rowName;
    private Integer seatNumber;
    private Long seatTypeId;
    private String seatTypeName;
}
