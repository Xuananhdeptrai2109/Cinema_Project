package com.cinema.modules.movie.controller;

import com.cinema.modules.movie.dto.CommentRequest;
import com.cinema.modules.movie.response.CommentResponse;
import com.cinema.modules.movie.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    // Gửi bình luận (Yêu cầu đăng nhập)
    @PostMapping
    public ResponseEntity<?> createComment(@RequestBody CommentRequest request, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(com.cinema.config.ApiResponse.error(401, "Vui lòng đăng nhập để gửi bình luận"));
        }
        try {
            CommentResponse res = commentService.saveComment(principal.getName(), request);
            return ResponseEntity.ok(com.cinema.config.ApiResponse.success(res, "Gửi bình luận thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(com.cinema.config.ApiResponse.error(400, e.getMessage()));
        }
    }

    // Lấy danh sách bình luận theo ID phim
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long movieId) {
        return ResponseEntity.ok(commentService.getCommentsByMovie(movieId));
    }

    // Xóa bình luận (Yêu cầu chính chủ hoặc Admin)
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(com.cinema.config.ApiResponse.error(401, "Vui lòng đăng nhập để thực hiện tác vụ này"));
        }
        try {
            commentService.deleteComment(principal.getName(), commentId);
            return ResponseEntity.ok(com.cinema.config.ApiResponse.success(null, "Xóa bình luận thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(com.cinema.config.ApiResponse.error(403, e.getMessage()));
        }
    }
}