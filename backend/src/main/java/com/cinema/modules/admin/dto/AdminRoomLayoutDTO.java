package com.cinema.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRoomLayoutDTO {
    private Long roomId;
    private String roomName;
    private Long cinemasId;
    private String cinemaName;
    private Long screeningFormatId;
    private String screeningFormatType;
    private List<AdminSeatTypeDTO> seatTypes;
    private List<AdminSeatItemDTO> seats;
}
