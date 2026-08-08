package com.cinema.modules.admin.controller;

import com.cinema.config.ApiResponse;
import com.cinema.modules.admin.dto.AdminShowtimeRequestDTO;
import com.cinema.modules.admin.dto.AdminShowtimeResponseDTO;
import com.cinema.modules.movie.entity.Movie;
import com.cinema.modules.movie.repository.MovieRepository;
import com.cinema.modules.room.entity.Room;
import com.cinema.modules.room.repository.RoomRepository;
import com.cinema.modules.showtime.entity.Showtime;
import com.cinema.modules.showtime.repository.ShowtimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/showtimes")
@RequiredArgsConstructor
public class AdminShowtimeController {

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final RoomRepository roomRepository;

    @GetMapping
    public ApiResponse<List<AdminShowtimeResponseDTO>> getAllShowtimes() {
        List<AdminShowtimeResponseDTO> dtos = showtimeRepository.findAll().stream()
                .map(this::mapToDto)
                .toList();
        return ApiResponse.success(dtos, "Lấy danh sách suất chiếu thành công");
    }

    @PostMapping
    public ApiResponse<AdminShowtimeResponseDTO> createShowtime(@RequestBody AdminShowtimeRequestDTO dto) {
        Movie movie = movieRepository.findById(dto.getMovieId()).orElse(null);
        if (movie == null) {
            return ApiResponse.error(404, "Không tìm thấy phim với ID: " + dto.getMovieId());
        }

        Room room = roomRepository.findById(dto.getRoomId()).orElse(null);
        if (room == null) {
            return ApiResponse.error(404, "Không tìm thấy phòng chiếu với ID: " + dto.getRoomId());
        }

        Showtime showtime = new Showtime();
        showtime.setMovie(movie);
        showtime.setRoom(room);
        showtime.setShowDate(dto.getShowDate());
        showtime.setStartTime(dto.getStartTime());
        showtime.setEndTime(dto.getEndTime());

        Showtime saved = showtimeRepository.save(showtime);
        return ApiResponse.success(mapToDto(saved), "Tạo lịch chiếu thành công");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteShowtime(@PathVariable Long id) {
        if (showtimeRepository.existsById(id)) {
            showtimeRepository.deleteById(id);
            return ApiResponse.success(null, "Xóa lịch chiếu thành công");
        }
        return ApiResponse.error(404, "Không tìm thấy lịch chiếu với ID: " + id);
    }

    private AdminShowtimeResponseDTO mapToDto(Showtime st) {
        return AdminShowtimeResponseDTO.builder()
                .showtimeId(st.getShowtimeId())
                .movieId(st.getMovie() != null ? st.getMovie().getId() : null)
                .movieTitle(st.getMovie() != null ? st.getMovie().getTitle() : "Phim #" + st.getShowtimeId())
                .roomId(st.getRoom() != null ? st.getRoom().getRoomId() : null)
                .roomName(st.getRoom() != null ? st.getRoom().getRoomName() : "Phòng 01")
                .showDate(st.getShowDate())
                .startTime(st.getStartTime())
                .endTime(st.getEndTime())
                .build();
    }
}
