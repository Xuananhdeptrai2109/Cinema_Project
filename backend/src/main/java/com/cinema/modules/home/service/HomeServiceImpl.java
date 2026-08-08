package com.cinema.modules.home.service;

import com.cinema.modules.cinema.service.CinemaService;
import com.cinema.modules.discount.service.DiscountService;
import com.cinema.modules.home.dto.HomeResponse;
import com.cinema.modules.movie.service.MovieService;
import com.cinema.modules.room.service.RoomService;
import com.cinema.modules.showtime.response.ShowtimeResponse;
import com.cinema.modules.showtime.service.ShowtimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class HomeServiceImpl implements HomeService {
    @Autowired
    private MovieService movieService; // Từ module movie

    @Autowired
    private CinemaService cinemaService; // Từ module room/cinema

    @Autowired
    private ShowtimeService showtimeService; // Từ module room/cinema

    @Autowired
    private DiscountService discountService; // Từ module discount (Lấy ưu đãi/khuyến mãi)

    public HomeResponse getHomeData() {
        HomeResponse response = new HomeResponse();

        // 1. Lấy phim đang chiếu
        try {
            response.setShowingMovies(movieService.getMoviesByStatus("now_showing"));
        } catch (Exception e) {
            System.err.println("Lỗi lấy phim đang chiếu: " + e.getMessage());
            response.setShowingMovies(java.util.Collections.emptyList());
        }

        // 2. Lấy phim sắp chiếu
        try {
            response.setUpcomingMovies(movieService.getMoviesByStatus("coming_soon"));
        } catch (Exception e) {
            System.err.println("Lỗi lấy phim sắp chiếu: " + e.getMessage());
            response.setUpcomingMovies(java.util.Collections.emptyList());
        }

        // 3. Hệ thống rạp
        try {
            response.setLocations(cinemaService.getAllLocationsWithCinemas());
        } catch (Exception e) {
            System.err.println("Lỗi lấy danh sách rạp: " + e.getMessage());
            response.setLocations(java.util.Collections.emptyList());
        }

        // 4. Lấy các chương trình khuyến mãi/ưu đãi
        try {
            response.setPromotions(discountService.getActivePromotions());
        } catch (Exception e) {
            System.err.println("Lỗi lấy danh sách khuyến mãi: " + e.getMessage());
            response.setPromotions(java.util.Collections.emptyList());
        }

        return response;
    }
    @Override
    public List<ShowtimeResponse> getQuickBookingInfo(Long movieId, Long cinemaId) {
        // 1. Lấy ngày hiện tại định dạng ISO (YYYY-MM-DD) để truyền vào service
        String today = java.time.LocalDate.now().toString();

        // 2. Gọi service với đúng thứ tự tham số: cinemaId trước, sau đó là date
        List<ShowtimeResponse> allMoviesShowtimes = showtimeService.getShowtimesByCinemaAndDate(cinemaId, today);

        // 3. Lọc lại danh sách để chỉ trả về đúng bộ phim (movieId) mà người dùng đang xem
        return allMoviesShowtimes.stream()
                .filter(m -> m.getId().equals(movieId))
                .toList();
    }
}
