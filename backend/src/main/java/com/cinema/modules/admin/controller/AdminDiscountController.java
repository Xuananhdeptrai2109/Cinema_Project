package com.cinema.modules.admin.controller;

import com.cinema.config.ApiResponse;
import com.cinema.modules.discount.entity.Discount;
import com.cinema.modules.discount.repository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/discounts")
@RequiredArgsConstructor
public class AdminDiscountController {

    private final DiscountRepository discountRepository;

    @GetMapping
    public ApiResponse<List<Discount>> getAllDiscounts() {
        return ApiResponse.success(discountRepository.findAll(), "Lấy danh sách mã giảm giá thành công");
    }

    @PostMapping
    public ApiResponse<Discount> createDiscount(@RequestBody Discount discount) {
        if (discount.getCurrentUsage() == null) discount.setCurrentUsage(0);
        if (discount.getIsUsed() == null) discount.setIsUsed(false);
        Discount saved = discountRepository.save(discount);
        return ApiResponse.success(saved, "Thêm mã giảm giá mới thành công");
    }

    @PutMapping("/{id}")
    public ApiResponse<Discount> updateDiscount(@PathVariable Long id, @RequestBody Discount req) {
        return discountRepository.findById(id).map(existing -> {
            if (req.getDiscountTitle() != null) existing.setDiscountTitle(req.getDiscountTitle());
            if (req.getDiscountCode() != null) existing.setDiscountCode(req.getDiscountCode());
            if (req.getDiscountType() != null) existing.setDiscountType(req.getDiscountType());
            if (req.getDiscountValue() != null) existing.setDiscountValue(req.getDiscountValue());
            if (req.getStartDate() != null) existing.setStartDate(req.getStartDate());
            if (req.getEndDate() != null) existing.setEndDate(req.getEndDate());
            if (req.getMaxUsage() != null) existing.setMaxUsage(req.getMaxUsage());
            Discount updated = discountRepository.save(existing);
            return ApiResponse.success(updated, "Cập nhật mã giảm giá thành công");
        }).orElse(ApiResponse.error(404, "Không tìm thấy mã giảm giá với ID: " + id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDiscount(@PathVariable Long id) {
        if (discountRepository.existsById(id)) {
            discountRepository.deleteById(id);
            return ApiResponse.success(null, "Xóa mã giảm giá thành công");
        }
        return ApiResponse.error(404, "Không tìm thấy mã giảm giá với ID: " + id);
    }
}
