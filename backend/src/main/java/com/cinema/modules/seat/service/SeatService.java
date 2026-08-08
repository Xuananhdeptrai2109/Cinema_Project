package com.cinema.modules.seat.service;

import com.cinema.modules.seat.entity.Seat;
import com.cinema.modules.seat.entity.ShowtimeSeat;
import com.cinema.modules.seat.entity.Status;
import com.cinema.modules.seat.repository.PhysicalSeatRepository;
import com.cinema.modules.seat.repository.SeatRepository;
import com.cinema.modules.seat.repository.StatusRepository;
import com.cinema.modules.seat.response.SeatResponse;
import com.cinema.modules.showtime.entity.Showtime;
import com.cinema.modules.showtime.repository.ShowtimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeatService {
    private final SeatRepository seatRepository;
    private final PhysicalSeatRepository physicalSeatRepository;
    private final ShowtimeRepository showtimeRepository;
    private final StatusRepository statusRepository;

    @Transactional
    public List<SeatResponse> getSeatsByShowtime(Long showtimeId) {
        List<ShowtimeSeat> seats = seatRepository.findByShowtime_ShowtimeId(showtimeId);

        // Nếu suất chiếu chưa có danh sách ghế trong bảng ShowtimeSeat, tự động lấy dữ liệu ghế vật lý từ MySQL Database của phòng chiếu đó
        if (seats.isEmpty()) {
            Showtime showtime = showtimeRepository.findById(showtimeId).orElse(null);
            if (showtime != null && showtime.getRoom() != null) {
                Long roomId = showtime.getRoom().getRoomId();
                List<Seat> physicalSeats = physicalSeatRepository.findByRoom_RoomIdOrderByRowNameAscSeatNumberAsc(roomId);

                Status availableStatus = statusRepository.findByStatusName(Status.SeatStatusName.available).orElse(null);
                if (availableStatus == null) {
                    Status newStatus = new Status();
                    newStatus.setStatusName(Status.SeatStatusName.available);
                    availableStatus = statusRepository.save(newStatus);
                }

                List<ShowtimeSeat> newShowtimeSeats = new ArrayList<>();
                for (Seat physicalSeat : physicalSeats) {
                    ShowtimeSeat ss = new ShowtimeSeat();
                    ss.setShowtime(showtime);
                    ss.setSeat(physicalSeat);
                    ss.setStatus(availableStatus);
                    newShowtimeSeats.add(ss);
                }
                if (!newShowtimeSeats.isEmpty()) {
                    seats = seatRepository.saveAll(newShowtimeSeats);
                }
            }
        }

        return seats.stream().map(s -> new SeatResponse(
                s.getShowtimeSeatId(),
                s.getSeat().getRowName(),
                s.getSeat().getSeatNumber(),
                s.getSeat().getSeatType() != null ? s.getSeat().getSeatType().getTypeName() : "Thường",
                s.getSeat().getSeatType() != null ? s.getSeat().getSeatType().getPrice() : null,
                s.getStatus() != null ? s.getStatus().getStatusName().name() : "available"
        )).collect(Collectors.toList());
    }
}