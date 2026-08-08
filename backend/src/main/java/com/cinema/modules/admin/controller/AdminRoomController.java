package com.cinema.modules.admin.controller;

import com.cinema.config.ApiResponse;
import com.cinema.modules.admin.dto.AdminRoomDTO;
import com.cinema.modules.admin.dto.AdminRoomLayoutDTO;
import com.cinema.modules.admin.dto.AdminSeatItemDTO;
import com.cinema.modules.admin.dto.AdminSeatTypeDTO;
import com.cinema.modules.cinema.entity.Cinema;
import com.cinema.modules.cinema.repository.CinemaRepository;
import com.cinema.modules.room.entity.Room;
import com.cinema.modules.room.entity.ScreeningFormat;
import com.cinema.modules.room.repository.RoomRepository;
import com.cinema.modules.room.repository.ScreeningFormatRepository;
import com.cinema.modules.seat.entity.Seat;
import com.cinema.modules.seat.entity.SeatType;
import com.cinema.modules.seat.repository.PhysicalSeatRepository;
import com.cinema.modules.seat.repository.SeatTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminRoomController {

    private final RoomRepository roomRepository;
    private final CinemaRepository cinemaRepository;
    private final ScreeningFormatRepository screeningFormatRepository;
    private final PhysicalSeatRepository physicalSeatRepository;
    private final SeatTypeRepository seatTypeRepository;

    @GetMapping("/cinemas/{cinemaId}/rooms")
    public ApiResponse<List<AdminRoomDTO>> getRoomsByCinema(@PathVariable Long cinemaId) {
        List<AdminRoomDTO> dtos = roomRepository.findByCinema_CinemasId(cinemaId).stream()
                .map(this::mapToDto)
                .toList();
        return ApiResponse.success(dtos, "Lấy danh sách phòng chiếu thành công");
    }

    @GetMapping("/screening-formats")
    public ApiResponse<List<ScreeningFormat>> getAllScreeningFormats() {
        return ApiResponse.success(screeningFormatRepository.findAll(), "Lấy danh sách định dạng chiếu thành công");
    }

    @PostMapping("/rooms")
    public ApiResponse<AdminRoomDTO> createRoom(@RequestBody AdminRoomDTO dto) {
        Cinema cinema = cinemaRepository.findById(dto.getCinemasId()).orElse(null);
        if (cinema == null) {
            return ApiResponse.error(404, "Không tìm thấy rạp chiếu với ID: " + dto.getCinemasId());
        }

        Long formatId = dto.getScreeningFormatId() != null ? dto.getScreeningFormatId() : 1L;
        ScreeningFormat format = screeningFormatRepository.findById(formatId).orElse(null);
        if (format == null && screeningFormatRepository.count() > 0) {
            format = screeningFormatRepository.findAll().get(0);
        }

        Room room = new Room();
        room.setRoomName(dto.getRoomName());
        room.setCinema(cinema);
        room.setScreeningFormat(format);

        Room saved = roomRepository.save(room);
        return ApiResponse.success(mapToDto(saved), "Thêm phòng chiếu mới thành công");
    }

    @GetMapping("/rooms/{id}/layout")
    public ApiResponse<AdminRoomLayoutDTO> getRoomLayout(@PathVariable Long id) {
        Room room = roomRepository.findById(id).orElse(null);
        if (room == null) {
            return ApiResponse.error(404, "Không tìm thấy phòng chiếu với ID: " + id);
        }

        // Đọc trực tiếp danh sách loại ghế từ MySQL Database
        List<SeatType> seatTypes = seatTypeRepository.findAll();

        // Đọc trực tiếp danh sách ghế vật lý của phòng từ MySQL Database
        List<Seat> seats = physicalSeatRepository.findByRoom_RoomIdOrderByRowNameAscSeatNumberAsc(id);

        List<AdminSeatTypeDTO> typeDtos = seatTypes.stream()
                .map(st -> AdminSeatTypeDTO.builder()
                        .seatTypeId(st.getSeatTypeId())
                        .typeName(st.getTypeName())
                        .price(st.getPrice())
                        .build())
                .toList();

        List<AdminSeatItemDTO> seatDtos = seats.stream()
                .map(s -> AdminSeatItemDTO.builder()
                        .seatId(s.getSeatId())
                        .rowName(s.getRowName())
                        .seatNumber(s.getSeatNumber())
                        .seatTypeId(s.getSeatType() != null ? s.getSeatType().getSeatTypeId() : (typeDtos.isEmpty() ? null : typeDtos.get(0).getSeatTypeId()))
                        .seatTypeName(s.getSeatType() != null ? s.getSeatType().getTypeName() : (typeDtos.isEmpty() ? "" : typeDtos.get(0).getTypeName()))
                        .build())
                .toList();

        AdminRoomLayoutDTO layoutDTO = AdminRoomLayoutDTO.builder()
                .roomId(room.getRoomId())
                .roomName(room.getRoomName())
                .cinemasId(room.getCinema() != null ? room.getCinema().getCinemasId() : null)
                .cinemaName(room.getCinema() != null ? room.getCinema().getCinemaName() : "")
                .screeningFormatId(room.getScreeningFormat() != null ? room.getScreeningFormat().getScreeningFormatId() : null)
                .screeningFormatType(room.getScreeningFormat() != null ? room.getScreeningFormat().getType() : "2D")
                .seatTypes(typeDtos)
                .seats(seatDtos)
                .build();

        return ApiResponse.success(layoutDTO, "Lấy sơ đồ ma trận ghế từ MySQL Database thành công");
    }

    @PutMapping("/rooms/{id}/layout")
    @Transactional
    public ApiResponse<AdminRoomLayoutDTO> saveRoomLayout(@PathVariable Long id, @RequestBody AdminRoomLayoutDTO payload) {
        Room room = roomRepository.findById(id).orElse(null);
        if (room == null) {
            return ApiResponse.error(404, "Không tìm thấy phòng chiếu với ID: " + id);
        }

        // 1. Cập nhật tên phòng & định dạng
        if (payload.getRoomName() != null && !payload.getRoomName().isBlank()) {
            room.setRoomName(payload.getRoomName());
        }
        if (payload.getScreeningFormatId() != null) {
            screeningFormatRepository.findById(payload.getScreeningFormatId()).ifPresent(room::setScreeningFormat);
        }
        roomRepository.save(room);

        // 2. Cập nhật bảng giá loại ghế vào MySQL DB
        if (payload.getSeatTypes() != null) {
            for (AdminSeatTypeDTO stDto : payload.getSeatTypes()) {
                if (stDto.getSeatTypeId() != null && stDto.getPrice() != null) {
                    seatTypeRepository.findById(stDto.getSeatTypeId()).ifPresent(st -> {
                        st.setPrice(stDto.getPrice());
                        if (stDto.getTypeName() != null && !stDto.getTypeName().isBlank()) {
                            st.setTypeName(stDto.getTypeName());
                        }
                        seatTypeRepository.save(st);
                    });
                }
            }
        }

        // 3. UPSERT vị trí loại ghế vào bảng Seat trong MySQL DB
        if (payload.getSeats() != null && !payload.getSeats().isEmpty()) {
            Map<Long, SeatType> seatTypeMap = new HashMap<>();
            seatTypeRepository.findAll().forEach(st -> seatTypeMap.put(st.getSeatTypeId(), st));

            List<Seat> existingSeats = physicalSeatRepository.findByRoom_RoomIdOrderByRowNameAscSeatNumberAsc(id);
            Map<String, Seat> existingSeatMap = new HashMap<>();
            for (Seat s : existingSeats) {
                existingSeatMap.put(s.getRowName() + s.getSeatNumber(), s);
            }

            List<Seat> seatsToSave = new ArrayList<>();
            for (AdminSeatItemDTO sDto : payload.getSeats()) {
                String key = sDto.getRowName() + sDto.getSeatNumber();
                Seat seat = existingSeatMap.get(key);
                if (seat == null) {
                    seat = new Seat();
                    seat.setRoom(room);
                    seat.setRowName(sDto.getRowName());
                    seat.setSeatNumber(sDto.getSeatNumber());
                }

                SeatType st = seatTypeMap.get(sDto.getSeatTypeId());
                if (st == null && !seatTypeMap.isEmpty()) {
                    st = seatTypeMap.values().iterator().next();
                }
                seat.setSeatType(st);
                seatsToSave.add(seat);
            }
            physicalSeatRepository.saveAll(seatsToSave);
        }

        return getRoomLayout(id);
    }

    @PutMapping("/rooms/{id}")
    public ApiResponse<AdminRoomDTO> updateRoom(@PathVariable Long id, @RequestBody AdminRoomDTO dto) {
        return roomRepository.findById(id).map(room -> {
            if (dto.getRoomName() != null) room.setRoomName(dto.getRoomName());
            if (dto.getScreeningFormatId() != null) {
                screeningFormatRepository.findById(dto.getScreeningFormatId()).ifPresent(room::setScreeningFormat);
            }
            Room updated = roomRepository.save(room);
            return ApiResponse.success(mapToDto(updated), "Cập nhật thông tin phòng chiếu thành công");
        }).orElse(ApiResponse.error(404, "Không tìm thấy phòng chiếu với ID: " + id));
    }

    @DeleteMapping("/rooms/{id}")
    @Transactional
    public ApiResponse<Void> deleteRoom(@PathVariable Long id) {
        if (roomRepository.existsById(id)) {
            try {
                physicalSeatRepository.deleteByRoom_RoomId(id);
                roomRepository.deleteById(id);
                return ApiResponse.success(null, "Xóa phòng chiếu thành công");
            } catch (Exception e) {
                return ApiResponse.error(400, "Không thể xóa phòng chiếu này vì đã có suất chiếu hoặc đơn hàng được tạo!");
            }
        }
        return ApiResponse.error(404, "Không tìm thấy phòng chiếu với ID: " + id);
    }

    private AdminRoomDTO mapToDto(Room room) {
        return AdminRoomDTO.builder()
                .roomId(room.getRoomId())
                .roomName(room.getRoomName())
                .cinemasId(room.getCinema() != null ? room.getCinema().getCinemasId() : null)
                .cinemaName(room.getCinema() != null ? room.getCinema().getCinemaName() : "N/A")
                .screeningFormatId(room.getScreeningFormat() != null ? room.getScreeningFormat().getScreeningFormatId() : null)
                .screeningFormatType(room.getScreeningFormat() != null ? room.getScreeningFormat().getType() : "2D")
                .price(room.getScreeningFormat() != null ? room.getScreeningFormat().getPrice() : null)
                .build();
    }
}
