package com.cinema.modules.admin.controller;

import com.cinema.config.ApiResponse;
import com.cinema.modules.admin.dto.AdminUserResponseDTO;
import com.cinema.modules.user.entity.User;
import com.cinema.modules.user.entity.UserRole;
import com.cinema.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    @GetMapping
    public ApiResponse<List<AdminUserResponseDTO>> getAllUsers() {
        List<AdminUserResponseDTO> dtos = userRepository.findAll().stream()
                .map(this::mapToDto)
                .sorted((u1, u2) -> Integer.compare(getUserRank(u1), getUserRank(u2)))
                .toList();
        return ApiResponse.success(dtos, "Lấy danh sách người dùng thành công");
    }

    @PutMapping("/{id}/role")
    public ApiResponse<AdminUserResponseDTO> updateUserRole(@PathVariable Long id, @RequestParam String role) {
        // RÀO CHẮN BẢO MẬT: Chỉ Super Admin (admin@gmail.com hoặc admin) mới được phân quyền
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmailOrName = "";
        if (auth != null) {
            if (auth.getPrincipal() instanceof UserDetails ud) {
                currentEmailOrName = ud.getUsername();
            } else {
                currentEmailOrName = auth.getName();
            }
        }

        if (!"admin@gmail.com".equalsIgnoreCase(currentEmailOrName) && !"admin".equalsIgnoreCase(currentEmailOrName)) {
            return ApiResponse.error(403, "Chỉ duy nhất Super Admin (admin@gmail.com) mới có quyền phân quyền hoặc tạo thêm vai trò Admin!");
        }

        return userRepository.findById(id).map(user -> {
            try {
                UserRole newRole = UserRole.valueOf(role.toLowerCase());
                user.setRole(newRole);
                User updated = userRepository.save(user);
                return ApiResponse.<AdminUserResponseDTO>success(mapToDto(updated), "Cập nhật quyền người dùng thành công");
            } catch (Exception e) {
                return ApiResponse.<AdminUserResponseDTO>error(400, "Vai trò (Role) không hợp lệ: " + role);
            }
        }).orElse(ApiResponse.<AdminUserResponseDTO>error(404, "Không tìm thấy người dùng với ID: " + id));
    }

    private int getUserRank(AdminUserResponseDTO u) {
        if (u.getEmail() != null && (u.getEmail().equalsIgnoreCase("admin@gmail.com") || u.getEmail().equalsIgnoreCase("admin"))) {
            return 0; // Super Admin lên đầu tiên
        }
        if (u.getRole() == UserRole.admin) {
            return 1; // Admin tiếp theo
        }
        return 2; // Khách hàng
    }

    private AdminUserResponseDTO mapToDto(User user) {
        return AdminUserResponseDTO.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole())
                .coin(user.getCoin())
                .build();
    }
}
