package com.cinema.modules.admin.controller;

import com.cinema.config.ApiResponse;
import com.cinema.modules.cinema.entity.Cinema;
import com.cinema.modules.cinema.entity.ProvinceCity;
import com.cinema.modules.cinema.repository.CinemaRepository;
import com.cinema.modules.cinema.repository.ProvinceRepository;
import com.cinema.modules.room.entity.Room;
import com.cinema.modules.room.repository.RoomRepository;
import com.cinema.modules.seat.repository.PhysicalSeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/cinemas")
@RequiredArgsConstructor
public class AdminCinemaController {

    private final CinemaRepository cinemaRepository;
    private final RoomRepository roomRepository;
    private final PhysicalSeatRepository physicalSeatRepository;
    private final ProvinceRepository provinceRepository;

    @GetMapping
    public ApiResponse<List<Cinema>> getAllCinemas() {
        return ApiResponse.success(cinemaRepository.findAll(), "Lấy danh sách rạp thành công");
    }

    @PostMapping
    public ApiResponse<Cinema> createCinema(@RequestBody Cinema cinema) {
        if (cinema.getProvince() == null) {
            ProvinceCity province = provinceRepository.findAll().stream().findFirst().orElseGet(() -> {
                ProvinceCity p = new ProvinceCity();
                p.setProvinceName("TP Hồ Chí Minh");
                return provinceRepository.save(p);
            });
            cinema.setProvince(province);
        }

        Cinema saved = cinemaRepository.save(cinema);
        return ApiResponse.success(saved, "Thêm rạp chiếu mới thành công");
    }

    @PutMapping("/{id}")
    public ApiResponse<Cinema> updateCinema(@PathVariable Long id, @RequestBody Cinema req) {
        return cinemaRepository.findById(id).map(existing -> {
            if (req.getCinemaName() != null) existing.setCinemaName(req.getCinemaName());
            if (req.getAddress() != null) existing.setAddress(req.getAddress());
            if (req.getHotline() != null) existing.setHotline(req.getHotline());
            if (req.getFax() != null) existing.setFax(req.getFax());
            if (req.getImageUrl() != null) existing.setImageUrl(req.getImageUrl());
            Cinema updated = cinemaRepository.save(existing);
            return ApiResponse.success(updated, "Cập nhật thông tin rạp thành công");
        }).orElse(ApiResponse.error(404, "Không tìm thấy rạp chiếu với ID: " + id));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<Void> deleteCinema(@PathVariable Long id) {
        if (!cinemaRepository.existsById(id)) {
            return ApiResponse.error(404, "Không tìm thấy rạp chiếu với ID: " + id);
        }

        try {
            List<Room> rooms = roomRepository.findByCinema_CinemasId(id);
            for (Room room : rooms) {
                physicalSeatRepository.deleteByRoom_RoomId(room.getRoomId());
            }
            if (!rooms.isEmpty()) {
                roomRepository.deleteAll(rooms);
            }
            cinemaRepository.deleteById(id);
            return ApiResponse.success(null, "Xóa rạp chiếu thành công");
        } catch (Exception e) {
            return ApiResponse.error(400, "Không thể xóa rạp này vì đang có lịch chiếu hoặc hóa đơn đặt vé liên kết!");
        }
    }
}
