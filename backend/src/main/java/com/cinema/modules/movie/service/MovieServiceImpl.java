package com.cinema.modules.movie.service;

import com.cinema.modules.movie.entity.Genre;
import com.cinema.modules.movie.entity.Movie;
import com.cinema.modules.movie.entity.Performer;
import com.cinema.modules.movie.repository.MovieRepository;
import com.cinema.modules.movie.response.MovieResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static java.util.stream.Collectors.toList;

@Service
public class MovieServiceImpl implements MovieService {
    @Autowired
    private MovieRepository movieRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MovieResponse> getNowShowing() {
        return getMoviesByStatus("now_showing");
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovieResponse> getComingSoon() {
        return getMoviesByStatus("coming_soon");
    }

    @Override
    @Transactional(readOnly = true)
    public MovieResponse getMovieById(Long id) {
        // 1. Tìm Movie trong DB theo ID
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phim với ID: " + id));

        // 2. Map từ Entity sang Response
        MovieResponse res = new MovieResponse();

        res.setId(movie.getId());
        res.setTitle(movie.getTitle());
        res.setPosterLink(sanitizePosterLink(movie.getPosterLink()));
        res.setLanguage(movie.getLanguage());
        res.setDescription(movie.getDescription());
        res.setReleaseDate(movie.getReleaseDate());
        res.setDuration(movie.getDuration());
        res.setAgeRating(movie.getAgeRating());
        res.setTrailerLink(movie.getTrailerLink());
        res.setStatus(movie.getStatus());
        res.setStar(movie.getStar());
        if (movie.getDirector() != null) {
            res.setDirector(movie.getDirector().getDirectorName());
        }
        if (movie.getGenres() != null) {
            List<String> genreNames = movie.getGenres().stream()
                    .map(Genre::getGenreName)
                    .toList();
            res.setGenreNames(genreNames);
        }
        if (movie.getPerformers() != null) {
            List<String> performerNames = movie.getPerformers().stream()
                    .map(Performer::getPerformerName)
                    .toList();
            res.setPerformerNames(performerNames);
        }
        return res;
    }

    private String sanitizePosterLink(String link) {
        if (link == null || link.isBlank()) return link;
        if (link.contains("www.themoviedb.org/t/p/")) {
            return link.replace("www.themoviedb.org/t/p/w1280/", "image.tmdb.org/t/p/w500/")
                       .replace("www.themoviedb.org/t/p/", "image.tmdb.org/t/p/w500/");
        }
        return link;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovieResponse> getMoviesByStatus(String status) {
        // 1. Lấy danh sách Entity từ Repository (Hỗ trợ alias 'showing' và 'now_showing')
        List<Movie> movies;
        if ("showing".equalsIgnoreCase(status) || "now_showing".equalsIgnoreCase(status)) {
            movies = movieRepository.findByStatus("now_showing");
            if (movies.isEmpty()) {
                movies = movieRepository.findByStatus("showing");
            }
        } else {
            movies = movieRepository.findByStatus(status);
        }

        // Fallback: Nếu không tìm thấy theo status chỉ định, lấy tất cả phim từ DB
        if (movies.isEmpty()) {
            movies = movieRepository.findAll();
        }

        // 2. Chuyển đổi (Map) từng Movie sang MovieResponse
        return movies.stream().map(movie -> {
            MovieResponse res = new MovieResponse();

            res.setId(movie.getId());
            res.setTitle(movie.getTitle());
            res.setPosterLink(sanitizePosterLink(movie.getPosterLink()));
            res.setLanguage(movie.getLanguage());
            res.setDescription(movie.getDescription());
            res.setReleaseDate(movie.getReleaseDate());
            res.setDuration(movie.getDuration());
            res.setAgeRating(movie.getAgeRating());   // Ánh xạ từ age_rating
            res.setTrailerLink(movie.getTrailerLink());
            res.setStatus(movie.getStatus());
            res.setStar(movie.getStar());
            if (movie.getGenres() != null) {
                List<String> genreNames = movie.getGenres().stream()
                        .map(Genre::getGenreName)
                        .toList();
                res.setGenreNames(genreNames);
            }
            return res;
        }).toList();
    }
}