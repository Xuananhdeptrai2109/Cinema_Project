package com.cinema.modules.movie.service;

import com.cinema.modules.movie.dto.CommentRequest;
import com.cinema.modules.movie.entity.Movie;
import com.cinema.modules.movie.entity.MovieComment;
import com.cinema.modules.movie.repository.CommentRepository;
import com.cinema.modules.movie.repository.MovieRepository;
import com.cinema.modules.movie.response.CommentResponse;
import com.cinema.modules.user.entity.User;
import com.cinema.modules.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j; // Thêm để logging
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j // Tự động tạo logger
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Transactional
    public CommentResponse saveComment(String email, CommentRequest request) {
        String cleanEmail = email != null ? email.trim() : "";
        User user = userRepository.findByEmail(cleanEmail)
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(cleanEmail))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Tài khoản người dùng (" + cleanEmail + ") không tồn tại")));

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Phim không tồn tại"));

        // CHẶN: Chỉ chặn đánh giá nếu phim là sắp chiếu (coming_soon)
        String status = movie.getStatus() != null ? movie.getStatus().toLowerCase() : "";
        if ("coming_soon".equals(status)) {
            throw new RuntimeException("Chương trình đánh giá không áp dụng cho phim sắp chiếu.");
        }

        // 1. Khởi tạo và gán giá trị thủ công để đảm bảo không mất dữ liệu
        MovieComment comment = new MovieComment();
        comment.setUser(user);
        comment.setMovie(movie);
        comment.setContent(request.getContent()); // Nếu cái này null, DB sẽ lưu null
        comment.setStarRating(request.getStarRating());
        comment.setImageUrl(request.getImageUrl());
        comment.setCreatedAt(LocalDateTime.now());

        commentRepository.save(comment);
        updateMovieAverageStar(movie);
        return new CommentResponse(comment);
    }

    private void updateMovieAverageStar(Movie movie) {
        List<MovieComment> allComments = commentRepository.findByMovie_IdOrderByCreatedAtDesc(movie.getId());

        if (allComments.isEmpty()) {
            movie.setStar(0.0);
        } else {
            double averageStar = allComments.stream()
                    .mapToInt(MovieComment::getStarRating)
                    .average()
                    .orElse(0.0);

            // Làm tròn 1 chữ số thập phân
            movie.setStar((double) Math.round(averageStar * 10) / 10);
        }
        movieRepository.save(movie);
    }

    public List<CommentResponse> getCommentsByMovie(Long movieId) {
        return commentRepository.findByMovie_IdOrderByCreatedAtDesc(movieId)
                .stream()
                .map(CommentResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(String email, Long commentId) {
        MovieComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Bình luận không tồn tại"));

        String cleanEmail = email != null ? email.trim() : "";
        User user = userRepository.findByEmail(cleanEmail)
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(cleanEmail))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Tài khoản người dùng không tồn tại")));

        boolean isOwner = comment.getUser() != null && (
                comment.getUser().getUserId().equals(user.getUserId()) ||
                (comment.getUser().getEmail() != null && comment.getUser().getEmail().equalsIgnoreCase(user.getEmail()))
        );
        boolean isAdmin = user.getRole() != null && "admin".equalsIgnoreCase(user.getRole().name());

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Bạn không có quyền xóa bình luận này!");
        }

        Movie movie = comment.getMovie();
        commentRepository.delete(comment);

        if (movie != null) {
            updateMovieAverageStar(movie);
        }
    }
}