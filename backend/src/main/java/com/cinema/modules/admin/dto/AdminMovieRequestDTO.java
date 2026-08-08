package com.cinema.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMovieRequestDTO {
    private String title;
    private String posterLink;
    private String language;
    private String description;
    private String releaseDate;
    private Integer duration;
    private String ageRating;
    private String trailerLink;
    private String status;
    private Long directorId;
    private String directorName;
    private Set<Long> genreIds;
}
