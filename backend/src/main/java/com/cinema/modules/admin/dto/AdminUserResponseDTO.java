package com.cinema.modules.admin.dto;

import com.cinema.modules.user.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponseDTO {
    private Long userId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private UserRole role;
    private Integer coin;
}
