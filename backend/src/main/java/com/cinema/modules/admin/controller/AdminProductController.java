package com.cinema.modules.admin.controller;

import com.cinema.config.ApiResponse;
import com.cinema.modules.admin.dto.AdminProductDTO;
import com.cinema.modules.booking.entity.Product;
import com.cinema.modules.booking.entity.ProductType;
import com.cinema.modules.booking.repository.ProductRepository;
import com.cinema.modules.booking.repository.ProductTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductRepository productRepository;
    private final ProductTypeRepository productTypeRepository;

    @GetMapping
    public ApiResponse<List<AdminProductDTO>> getAllProducts() {
        List<AdminProductDTO> dtos = productRepository.findAll().stream()
                .map(this::mapToDto)
                .toList();
        return ApiResponse.success(dtos, "Lấy danh sách sản phẩm thành công");
    }

    @PostMapping
    public ApiResponse<AdminProductDTO> createProduct(@RequestBody AdminProductDTO dto) {
        ProductType type = ensureProductTypeExists(dto.getProductTypeId());

        Product product = new Product();
        product.setProductName(dto.getProductName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setImageUrl(dto.getImageUrl());
        product.setAvailable(dto.isAvailable());
        product.setProductType(type);

        Product saved = productRepository.save(product);
        return ApiResponse.success(mapToDto(saved), "Thêm sản phẩm thành công");
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminProductDTO> updateProduct(@PathVariable Long id, @RequestBody AdminProductDTO dto) {
        return productRepository.findById(id).map(product -> {
            if (dto.getProductName() != null) product.setProductName(dto.getProductName());
            if (dto.getDescription() != null) product.setDescription(dto.getDescription());
            if (dto.getPrice() != null) product.setPrice(dto.getPrice());
            if (dto.getImageUrl() != null) product.setImageUrl(dto.getImageUrl());
            product.setAvailable(dto.isAvailable());

            if (dto.getProductTypeId() != null) {
                product.setProductType(ensureProductTypeExists(dto.getProductTypeId()));
            }

            Product updated = productRepository.save(product);
            return ApiResponse.success(mapToDto(updated), "Cập nhật sản phẩm thành công");
        }).orElse(ApiResponse.error(404, "Không tìm thấy sản phẩm với ID: " + id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProduct(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            return ApiResponse.error(404, "Không tìm thấy sản phẩm với ID: " + id);
        }
        try {
            productRepository.deleteById(id);
            return ApiResponse.success(null, "Xóa sản phẩm thành công");
        } catch (Exception e) {
            return ApiResponse.error(400, "Không thể xóa sản phẩm này vì sản phẩm đã được bán trong hóa đơn liên kết!");
        }
    }

    private ProductType ensureProductTypeExists(Long typeId) {
        if (productTypeRepository.count() == 0) {
            ProductType t1 = new ProductType();
            t1.setTypeName("Combo Bắp Nước");
            productTypeRepository.save(t1);

            ProductType t2 = new ProductType();
            t2.setTypeName("Bắp Rang Bơ");
            productTypeRepository.save(t2);

            ProductType t3 = new ProductType();
            t3.setTypeName("Nước Giải Khát");
            productTypeRepository.save(t3);
        }

        Long targetId = (typeId != null) ? typeId : 1L;
        return productTypeRepository.findById(targetId)
                .orElseGet(() -> productTypeRepository.findAll().stream().findFirst().orElseThrow(() -> new RuntimeException("Không tìm thấy loại sản phẩm")));
    }

    private AdminProductDTO mapToDto(Product p) {
        return AdminProductDTO.builder()
                .productId(p.getProductId())
                .productName(p.getProductName())
                .description(p.getDescription())
                .price(p.getPrice())
                .imageUrl(p.getImageUrl())
                .isAvailable(p.isAvailable())
                .productTypeId(p.getProductType() != null ? p.getProductType().getProductTypeId() : null)
                .productTypeName(p.getProductType() != null ? p.getProductType().getTypeName() : "Khác")
                .build();
    }
}
