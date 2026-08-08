package com.cinema.modules.admin.controller;

import com.cinema.config.ApiResponse;
import com.cinema.modules.admin.dto.AdminInvoiceDetailDTO;
import com.cinema.modules.booking.entity.BookingProduct;
import com.cinema.modules.booking.entity.BookingSeat;
import com.cinema.modules.booking.entity.Invoice;
import com.cinema.modules.booking.repository.InvoiceRepository;
import com.cinema.modules.showtime.entity.Showtime;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/invoices")
@RequiredArgsConstructor
public class AdminInvoiceController {

    private final InvoiceRepository invoiceRepository;

    @GetMapping
    public ApiResponse<List<Invoice>> getRecentInvoices() {
        return ApiResponse.success(invoiceRepository.findTop20ByOrderByCreatedDatetimeDesc(), "Lấy danh sách hóa đơn thành công");
    }

    @GetMapping("/{id}")
    public ApiResponse<Invoice> getInvoice(@PathVariable UUID id) {
        return invoiceRepository.findById(id)
                .map(invoice -> ApiResponse.success(invoice, "Lấy hóa đơn thành công"))
                .orElse(ApiResponse.error(404, "Không tìm thấy hóa đơn với mã ID: " + id));
    }

    @GetMapping("/{id}/details")
    public ApiResponse<AdminInvoiceDetailDTO> getInvoiceDetails(@PathVariable UUID id) {
        return invoiceRepository.findById(id).map(inv -> {
            List<String> seatNames = new ArrayList<>();
            String movieTitle = "N/A";
            String cinemaName = "N/A";
            String roomName = "N/A";
            String showDate = "N/A";
            String showTime = "N/A";

            if (inv.getBookingSeats() != null && !inv.getBookingSeats().isEmpty()) {
                for (BookingSeat bs : inv.getBookingSeats()) {
                    if (bs.getShowtimeSeat() != null && bs.getShowtimeSeat().getSeat() != null) {
                        seatNames.add(bs.getShowtimeSeat().getSeat().getFullSeatName());
                    }
                }
                Showtime st = inv.getBookingSeats().get(0).getShowtime();
                if (st != null) {
                    if (st.getMovie() != null) movieTitle = st.getMovie().getTitle();
                    if (st.getRoom() != null) {
                        roomName = st.getRoom().getRoomName();
                        if (st.getRoom().getCinema() != null) cinemaName = st.getRoom().getCinema().getCinemaName();
                    }
                    if (st.getShowDate() != null) showDate = st.getShowDate().toString();
                    if (st.getStartTime() != null) showTime = st.getStartTime().toString();
                }
            }

            List<AdminInvoiceDetailDTO.ProductItemDTO> products = new ArrayList<>();
            if (inv.getBookingProducts() != null) {
                for (BookingProduct bp : inv.getBookingProducts()) {
                    if (bp.getProduct() != null) {
                        products.add(AdminInvoiceDetailDTO.ProductItemDTO.builder()
                                .productName(bp.getProduct().getProductName())
                                .quantity(bp.getProductQuantity())
                                .price(bp.getPriceAtBooking())
                                .build());
                    }
                }
            }

            AdminInvoiceDetailDTO detailDTO = AdminInvoiceDetailDTO.builder()
                    .invoiceId(inv.getInvoiceId())
                    .ticketCode(inv.getTicketCode())
                    .customerName(inv.getUser() != null ? inv.getUser().getFullName() : "Khách vãng lai")
                    .emailAddress(inv.getEmailAddress() != null ? inv.getEmailAddress() : (inv.getUser() != null ? inv.getUser().getEmail() : "N/A"))
                    .phoneNumber(inv.getUser() != null ? inv.getUser().getPhoneNumber() : "N/A")
                    .totalPrice(inv.getTotalPrice())
                    .finalPrice(inv.getFinalPrice())
                    .invoiceStatus(inv.getInvoiceStatus())
                    .discountCode(inv.getDiscountCode())
                    .paymentMethod(inv.getPaymentMethod())
                    .createdDatetime(inv.getCreatedDatetime())
                    .movieTitle(movieTitle)
                    .cinemaName(cinemaName)
                    .roomName(roomName)
                    .showDate(showDate)
                    .showTime(showTime)
                    .seatNames(seatNames)
                    .products(products)
                    .build();

            return ApiResponse.success(detailDTO, "Lấy chi tiết hóa đơn thành công");
        }).orElse(ApiResponse.error(404, "Không tìm thấy hóa đơn với ID: " + id));
    }
}
