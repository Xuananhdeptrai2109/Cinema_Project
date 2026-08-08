package com.cinema.modules.admin.controller;

import com.cinema.config.ApiResponse;
import com.cinema.modules.admin.dto.DashboardStatsDTO;
import com.cinema.modules.admin.dto.RevenueChartDTO;
import com.cinema.modules.admin.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/stats")
    public ApiResponse<DashboardStatsDTO> getStats() {
        return ApiResponse.success(adminDashboardService.getDashboardStats(), "Lấy thống kê tổng quan thành công");
    }

    @GetMapping("/revenue-chart")
    public ApiResponse<RevenueChartDTO> getRevenueChart() {
        return ApiResponse.success(adminDashboardService.getRevenueChartData(), "Lấy biểu đồ doanh thu thành công");
    }
}
