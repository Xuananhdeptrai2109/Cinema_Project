package com.cinema.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private Double totalRevenue;
    private Long ticketsSold;
    private Long activeMoviesCount;
    private Long totalCustomers;
    private Double todayRevenue;
    private Long todayTickets;
}
