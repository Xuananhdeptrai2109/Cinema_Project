package com.cinema.modules.admin.controller;

import com.cinema.config.ApiResponse;
import com.cinema.modules.admin.dto.AdminMovieRequestDTO;
import com.cinema.modules.admin.dto.AdminMovieResponseDTO;
import com.cinema.modules.movie.entity.Director;
import com.cinema.modules.movie.entity.Movie;
import com.cinema.modules.movie.repository.DirectorRepository;
import com.cinema.modules.movie.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/movies")
@RequiredArgsConstructor
public class AdminMovieController {

    private final MovieRepository movieRepository;
    private final DirectorRepository directorRepository;

    @GetMapping
    public ApiResponse<List<AdminMovieResponseDTO>> getAllMovies() {
        List<AdminMovieResponseDTO> dtos = movieRepository.findAll().stream()
                .map(this::mapToDto)
                .toList();
        return ApiResponse.success(dtos, "Lấy danh sách phim thành công");
    }

    @PostMapping
    public ApiResponse<AdminMovieResponseDTO> createMovie(@RequestBody AdminMovieRequestDTO dto) {
        Movie movie = new Movie();
        movie.setTitle(dto.getTitle());
        movie.setPosterLink(dto.getPosterLink() != null ? dto.getPosterLink() : "");
        movie.setLanguage(dto.getLanguage() != null && !dto.getLanguage().isBlank() ? dto.getLanguage() : "Việt Nam");
        movie.setDescription(dto.getDescription());
        String relDate = dto.getReleaseDate();
        if (relDate == null || relDate.isBlank()) {
            relDate = java.time.LocalDate.now().toString();
        }
        movie.setReleaseDate(relDate);
        movie.setDuration(dto.getDuration() != null ? dto.getDuration() : 120);
        movie.setAgeRating(dto.getAgeRating() != null ? dto.getAgeRating() : "P");
        movie.setTrailerLink(dto.getTrailerLink());
        movie.setStatus(dto.getStatus() != null ? dto.getStatus() : "now_showing");
        movie.setStar(5.0);

        String dirNameInput = (dto.getDirectorName() != null && !dto.getDirectorName().isBlank()) ? dto.getDirectorName().trim() : "Đạo diễn Mặc Định";
        String[] directorNames = dirNameInput.split("[,;]+");
        Director primaryDirector = null;

        for (String name : directorNames) {
            String cleanName = name.trim();
            if (cleanName.isEmpty()) continue;

            Director d = directorRepository.findByDirectorName(cleanName)
                    .orElseGet(() -> {
                        Director newDir = new Director();
                        newDir.setDirectorName(cleanName);
                        return directorRepository.save(newDir);
                    });
            if (primaryDirector == null) {
                primaryDirector = d;
            }
        }
        movie.setDirector(primaryDirector);

        Movie saved = movieRepository.save(movie);
        return ApiResponse.success(mapToDto(saved), "Thêm phim mới thành công");
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminMovieResponseDTO> updateMovie(@PathVariable Long id, @RequestBody AdminMovieRequestDTO dto) {
        return movieRepository.findById(id).map(movie -> {
            if (dto.getTitle() != null) movie.setTitle(dto.getTitle());
            if (dto.getPosterLink() != null) movie.setPosterLink(dto.getPosterLink());
            if (dto.getLanguage() != null) movie.setLanguage(dto.getLanguage());
            if (dto.getDescription() != null) movie.setDescription(dto.getDescription());
            if (dto.getReleaseDate() != null) movie.setReleaseDate(dto.getReleaseDate());
            if (dto.getDuration() != null) movie.setDuration(dto.getDuration());
            if (dto.getAgeRating() != null) movie.setAgeRating(dto.getAgeRating());
            if (dto.getTrailerLink() != null) movie.setTrailerLink(dto.getTrailerLink());
            if (dto.getStatus() != null) movie.setStatus(dto.getStatus());

            if (dto.getDirectorName() != null && !dto.getDirectorName().isBlank()) {
                String dirNameInput = dto.getDirectorName().trim();
                String[] dNames = dirNameInput.split("[,;]+");
                Director pDirector = null;

                for (String name : dNames) {
                    String cleanName = name.trim();
                    if (cleanName.isEmpty()) continue;

                    Director d = directorRepository.findByDirectorName(cleanName)
                            .orElseGet(() -> {
                                Director newDir = new Director();
                                newDir.setDirectorName(cleanName);
                                return directorRepository.save(newDir);
                            });
                    if (pDirector == null) {
                        pDirector = d;
                    }
                }
                if (pDirector != null) {
                    movie.setDirector(pDirector);
                }
            }

            Movie updated = movieRepository.save(movie);
            return ApiResponse.success(mapToDto(updated), "Cập nhật thông tin phim thành công");
        }).orElse(ApiResponse.error(404, "Không tìm thấy phim với ID: " + id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteMovie(@PathVariable Long id) {
        if (!movieRepository.existsById(id)) {
            return ApiResponse.error(404, "Không tìm thấy phim với ID: " + id);
        }
        try {
            movieRepository.deleteById(id);
            return ApiResponse.success(null, "Xóa phim thành công");
        } catch (Exception e) {
            return ApiResponse.error(400, "Không thể xóa phim này vì đang có lịch chiếu hoặc hóa đơn xem phim liên kết!");
        }
    }

    private AdminMovieResponseDTO mapToDto(Movie movie) {
        return AdminMovieResponseDTO.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .posterLink(sanitizePosterLink(movie.getPosterLink()))
                .language(movie.getLanguage())
                .description(movie.getDescription())
                .releaseDate(movie.getReleaseDate())
                .duration(movie.getDuration())
                .ageRating(movie.getAgeRating())
                .trailerLink(movie.getTrailerLink())
                .status(movie.getStatus())
                .star(movie.getStar())
                .directorName(movie.getDirector() != null ? movie.getDirector().getDirectorName() : "N/A")
                .build();
    }

    private String sanitizePosterLink(String link) {
        if (link == null || link.isBlank()) return link;
        if (link.contains("www.themoviedb.org/t/p/")) {
            return link.replace("www.themoviedb.org/t/p/w1280/", "image.tmdb.org/t/p/w500/")
                       .replace("www.themoviedb.org/t/p/", "image.tmdb.org/t/p/w500/");
        }
        return link;
    }
}
