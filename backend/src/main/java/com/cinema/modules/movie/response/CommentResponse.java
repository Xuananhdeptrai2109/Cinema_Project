package com.cinema.modules.movie.response;

import com.cinema.modules.movie.entity.MovieComment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long commentId;
    private String fullName;
    private String userName; // Biệt danh định danh theo yêu cầu
    private String email;
    private String content;
    private String imageUrl;
    private Integer starRating;
    private LocalDateTime createdAt;

    // Constructor nhanh để convert từ Entity
    public CommentResponse(MovieComment comment) {
        this.commentId = comment.getCommentId();
        this.fullName = comment.getUser() != null ? comment.getUser().getFullName() : "Khách";
        this.userName = comment.getUser() != null ? comment.getUser().getUserName() : "user";
        this.email = comment.getUser() != null ? comment.getUser().getEmail() : "";
        this.content = comment.getContent();
        this.imageUrl = comment.getImageUrl();
        this.starRating = comment.getStarRating();
        this.createdAt = comment.getCreatedAt();
    }
}