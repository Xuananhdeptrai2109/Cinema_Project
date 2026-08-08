package com.cinema.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMovieResponseDTO {
    private Long id;
    private String title;
    private String posterLink;
    private String language;
    private String description;
    private String releaseDate;
    private Integer duration;
    private String ageRating;
    private String trailerLink;
    private String status;
    private Double star;
    private String directorName;
}
