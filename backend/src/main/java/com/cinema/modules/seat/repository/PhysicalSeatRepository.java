package com.cinema.modules.seat.repository;

import com.cinema.modules.seat.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PhysicalSeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByRoom_RoomIdOrderByRowNameAscSeatNumberAsc(Long roomId);

    @Transactional
    void deleteByRoom_RoomId(Long roomId);
}
