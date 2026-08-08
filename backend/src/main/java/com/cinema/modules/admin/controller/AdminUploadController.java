package com.cinema.modules.admin.controller;

import com.cinema.config.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AdminUploadController {

    @PostMapping(value = {"/api/v1/admin/upload", "/api/v1/upload", "/upload"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        if (file == null || file.isEmpty()) {
            return ApiResponse.error(400, "Tệp tải lên không được để rỗng!");
        }

        try {
            File uploadDir = new File("uploads").getAbsoluteFile();
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String newFilename = UUID.randomUUID().toString() + extension;
            File targetFile = new File(uploadDir, newFilename);
            file.transferTo(targetFile);

            String scheme = request.getScheme();
            String serverName = request.getServerName();
            int serverPort = request.getServerPort();

            String portStr = (serverPort == 80 || serverPort == 443) ? "" : ":" + serverPort;
            String baseUrl = scheme + "://" + serverName + portStr;
            String fileUrl = baseUrl + "/uploads/" + newFilename;

            Map<String, String> responseData = new HashMap<>();
            responseData.put("url", fileUrl);
            responseData.put("filename", newFilename);

            return ApiResponse.success(responseData, "Tải tệp lên thành công!");
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error(500, "Lỗi lưu tệp: " + e.getMessage());
        }
    }
}
