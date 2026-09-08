// ============================================================
// seat.js — CineMax Seat Selection Page
// Features: seat layout generation, type assignment, click toggle,
//           price calculation, summary update, checkout
// ============================================================
// STATE & API CONFIG
// ============================================================
const API_BASE = "http://localhost:8080/api";
const urlParams = new URLSearchParams(window.location.search);
const showtimeId = urlParams.get('showtimeId'); // Lấy từ URL

let seatData = [];      // Danh sách ghế từ API
let selectedSeats = new Set(); // Lưu showtime_seat_id

const TYPE_COLORS = {
    normal:   '#10b981',
    vip:      '#f59e0b',
    sweetbox: '#a855f7',
    couple:   '#ec4899',
    premium:  '#ef4444',
};
// ============================================================
// API CALLS
// ============================================================
// seat.js - CẬP NHẬT LẠI HÀM NÀY
async function fetchSeatLayout() {
    // 1. Kiểm tra ID suất chiếu trước khi thực hiện logic
    if (!showtimeId || showtimeId === "undefined") {
        console.error("ID suất chiếu không hợp lệ!");
        const grid = document.getElementById('seat-grid');
        if (grid) grid.innerHTML = `<p class="error">Không tìm thấy mã suất chiếu. Vui lòng quay lại.</p>`;
        return; // Dừng hàm tại đây nếu ID lỗi
    }

    // 2. Thực hiện gọi API (Xóa bỏ dòng fetchSeatLayout() tự gọi lại ở đây)
    try {
        const res = await fetch(`${API_BASE}/showtime-seats?showtimeId=${showtimeId}`);

        if (res.status === 403) {
            throw new Error("Lỗi 403: Backend chặn quyền truy cập. Kiểm tra SecurityConfig.java!");
        }

        if (!res.ok) throw new Error("Lỗi tải sơ đồ ghế");

        seatData = await res.json();
        console.log("DỮ LIỆU THỰC TẾ TỪ API:", seatData);

        renderColNumbers();
        renderGrid();
        renderPriceTable();
    } catch (err) {
        console.error(err);
        const grid = document.getElementById('seat-grid');
        if (grid) grid.innerHTML = `<p class="error">Lỗi: ${err.message}</p>`;
    }
}
// ============================================================
// RENDER COLUMN NUMBERS
// ============================================================
function renderColNumbers() {
    const el = document.getElementById('col-numbers');
    const grid = document.getElementById('seat-grid');
    if (!el || !grid || seatData.length === 0) return;

    const maxCols = Math.max(...seatData.map(s => s.seatNumber));

    // Cập nhật CSS grid-template-columns để khớp với số cột thực tế
    // +1 đại diện cho cột nhãn hàng (Row Label) ở cuối
    grid.style.gridTemplateColumns = `repeat(${maxCols}, 1fr) 40px`;
    el.style.gridTemplateColumns = `repeat(${maxCols}, 1fr) 40px`;

    el.innerHTML = Array.from({ length: maxCols }, (_, i) =>
        `<div class="col-num">${i + 1}</div>`
    ).join('') + '<div class="col-num-empty"></div>';
}
// ============================================================
// RENDER SEAT GRID
// ============================================================
function renderGrid() {
    const grid = document.getElementById('seat-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // 1. Lấy danh sách các hàng
    const rows = [...new Set(seatData.map(s => s.rowName))].sort();

    rows.forEach(row => {
        // Tạo một container cho mỗi hàng để dễ quản lý nhãn và ghế
        const rowContainer = document.createElement('div');
        rowContainer.className = 'seat-row-container';
        rowContainer.style.display = 'contents'; // Giữ nguyên cấu trúc grid nếu dùng CSS grid

        // 2. Lấy ghế trong hàng
        const seatsInRow = seatData
            .filter(s => s.rowName === row)
            .sort((a, b) => a.seatNumber - b.seatNumber);

        // 3. Render ghế
        seatsInRow.forEach(data => {
            const btn = document.createElement('button');

            const status = (data.statusName || 'available').toLowerCase();
            const displayState = status === 'available' ? 'empty' : 'sold';
            const typeClass = mapTypeToClass(data.typeName, 'seat');

            btn.className = `seat ${typeClass} ${displayState}`;
            btn.dataset.dbId = data.showtimeSeatId;
            btn.innerHTML = `<span class="s-num">${data.seatNumber}</span>`;

            if (displayState === 'sold') {
                btn.disabled = true;
            } else {
                btn.onclick = () => handleSeatClick(data, btn);
            }

            // Gắn Tooltip
            btn.addEventListener('mouseenter', (e) => showTooltip(e, data));
            btn.addEventListener('mouseleave', hideTooltip);
            btn.addEventListener('mousemove', moveTooltip);

            grid.appendChild(btn);
        });

        // 4. SỬA TẠI ĐÂY: Thêm nhãn hàng vào cuối hàng (tùy vào CSS của bạn)
        const label = document.createElement('div');
        label.className = 'row-label';
        label.textContent = row;
        grid.appendChild(label);
    });
}

async function renderPriceTable() {
    const priceListEl = document.getElementById('price-list-db');
    if (!priceListEl) return;

    let dbTypes = [];

    // 1. Thử gọi API lấy danh sách loại ghế thực tế từ CSDL
    try {
        const res = await fetch(`${API_BASE}/seat-types`);
        if (res.ok) {
            dbTypes = await res.json();
        }
    } catch (e) {
        console.warn("Lỗi đọc /api/seat-types từ DB:", e);
    }

    // 2. Tra cứu thêm từ dữ liệu ghế thực tế của suất chiếu
    const priceMap = new Map();
    if (seatData && seatData.length > 0) {
        seatData.forEach(s => {
            if (s.typeName && s.price) {
                priceMap.set(s.typeName.toLowerCase().trim(), s.price);
            }
        });
    }

    let finalTypes = [];

    if (dbTypes && dbTypes.length > 0) {
        finalTypes = dbTypes.map(t => {
            const normName = t.typeName.toLowerCase().trim();
            const realPrice = priceMap.get(normName) || t.price || 0;
            return {
                name: t.typeName,
                price: realPrice
            };
        });
    } else if (seatData && seatData.length > 0) {
        const seen = new Set();
        seatData.forEach(s => {
            if (s.typeName && !seen.has(s.typeName)) {
                seen.add(s.typeName);
                finalTypes.push({
                    name: s.typeName,
                    price: s.price || 0
                });
            }
        });
    }

    finalTypes.sort((a, b) => a.price - b.price);

    priceListEl.innerHTML = finalTypes.map(type => {
        const colorClass = mapTypeToClass(type.name, 'price');
        return `
            <div class="price-row-item">
                <div class="pr-badge ${colorClass}">
                    <span class="pr-dot-inner"></span>
                </div>
                <span class="pr-name">${type.name}</span>
                <span class="pr-val">${(type.price || 0).toLocaleString('vi-VN')}đ</span>
            </div>
        `;
    }).join('');
}

// Hàm hỗ trợ map tên từ DB sang class CSS
function mapTypeToClass(typeName, target = 'seat') {
    if (!typeName) return target === 'seat' ? 'normal' : 'type-normal';

    const name = typeName.toLowerCase().trim();
    let baseClass = 'normal';

    if (name.includes('vip')) {
        baseClass = 'vip';
    } else if (name.includes('sweetbox') || name.includes('sweet box') || name.includes('sweet')) {
        baseClass = 'sweetbox';
    } else if (name.includes('couple') || name.includes('đôi') || name.includes('doi')) {
        baseClass = 'couple';
    } else if (name.includes('cao cấp') || name.includes('cao cap') || name.includes('cao') || name.includes('premium') || name.includes('deluxe')) {
        baseClass = 'premium';
    }

    // Nếu dùng cho ghế thì trả về 'vip', nếu dùng cho bảng giá thì trả về 'type-vip'
    return target === 'seat' ? baseClass : `type-${baseClass}`;
}
// ============================================================
// SEAT CLICK HANDLER
// ============================================================
function handleSeatClick(data, btn) {
    const id = data.showtimeSeatId;

    if (selectedSeats.has(id)) {
        selectedSeats.delete(id);
        btn.classList.remove('selected');
        btn.classList.add('empty');
    } else {
        if (selectedSeats.size >= 10) {
            alert("Bạn chỉ được chọn tối đa 10 ghế");
            return;
        }
        selectedSeats.add(id);
        btn.classList.remove('empty');
        btn.classList.add('selected');
    }
    updateSummary();
}
// ============================================================
// SUMMARY PANEL
// ============================================================
function updateSummary() {
    const badge = document.getElementById('seat-count-badge');
    const empty = document.getElementById('summary-empty');
    const chips = document.getElementById('seat-chips');
    const breakdown = document.getElementById('price-breakdown');
    const totalVal = document.getElementById('total-val');

    const count = selectedSeats.size;
    if (badge) badge.textContent = count;

    if (count === 0) {
        if (empty) empty.style.display = 'flex';
        if (chips) chips.style.display = 'none';
        if (breakdown) breakdown.style.display = 'none';
        return;
    }

    if (empty) empty.style.display = 'none';
    if (chips) chips.style.display = 'flex';
    if (breakdown) breakdown.style.display = 'block';

    const selectedDetails = seatData
        .filter(s => selectedSeats.has(s.showtimeSeatId))
        .sort((a, b) => a.rowName !== b.rowName ? a.rowName.localeCompare(b.rowName) : a.seatNumber - b.seatNumber);

    // Render Chips
    chips.innerHTML = selectedDetails.map(s => `
        <div class="seat-chip">
            <span>${s.rowName}${s.seatNumber}</span>
            <span class="chip-x" onclick="removeSeat(${s.showtimeSeatId})">✕</span>
        </div>`).join('');

    // Render Breakdown & Total
    let total = 0;
    const html = selectedDetails.map(s => {
        total += s.price;
        const colorClass = mapTypeToClass(s.typeName, 'price');
        return `
            <div class="breakdown-row">
                <span class="pr-dot ${colorClass}" style="width:12px; height:12px; border-radius:3px; display:inline-block; flex-shrink:0;"></span>
                <span>Ghế ${s.rowName}${s.seatNumber} (${s.typeName})</span>
                <span>${s.price.toLocaleString('vi-VN')}đ</span>
            </div>`;
    }).join('');

    document.getElementById('breakdown-rows').innerHTML = html;
    if (totalVal) totalVal.textContent = total.toLocaleString('vi-VN') + 'đ';
}
function removeSeat(showtimeSeatId) {
    const btn = document.querySelector(`.seat[data-db-id="${showtimeSeatId}"]`);
    const data = seatData.find(s => s.showtimeSeatId === showtimeSeatId);
    if (btn && data) handleSeatClick(data, btn);
}
// ============================================================
// TOOLTIP (Cập nhật cho API)
// ============================================================
let tooltip;

function getTooltip() {
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'seat-tooltip';
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

function showTooltip(e, data) {
    const t = getTooltip();
    const status = data.statusName.toLowerCase();
    const stateLabel = { available: 'Trống', booked: 'Đã bán', holding: 'Đang giữ' }[status] || status;
    const seatName = `${data.rowName}${data.seatNumber}`;

    t.innerHTML = `
        <strong>Ghế ${seatName}</strong> · ${data.typeName} · 
        ${status === 'available' ? `<strong>${data.price.toLocaleString('vi-VN')}đ</strong>` : stateLabel}
    `;
    t.style.opacity = '1';
    moveTooltip(e);
}

function moveTooltip(e) {
    const t = getTooltip();
    t.style.left = (e.clientX + 15) + 'px';
    t.style.top  = (e.clientY + 15) + 'px';
}
function hideTooltip() { if (tooltip) tooltip.style.opacity = '0'; }

// ============================================================
// CHECKOUT & INIT
// ============================================================
// seat.js
document.getElementById('btn-checkout').addEventListener('click', () => {
    // Kiểm tra nếu chưa chọn ghế
    if (selectedSeats.size === 0) {
        const warn = document.getElementById('checkout-warn');
        if (warn) {
            warn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Vui lòng chọn ít nhất 1 ghế.';
            warn.style.animation = 'shake .35s ease';
        }
        return;
    }

    // Kiểm tra showtimeId (Phòng hờ lỗi không lấy được ID từ URL)
    if (!showtimeId || showtimeId === "undefined") {
        alert("Lỗi: Không tìm thấy mã suất chiếu. Vui lòng tải lại trang.");
        return;
    }

    // 1. Lấy thông tin phim hiện tại
    const rawData = sessionStorage.getItem('tempBookingInfo');
    const movieInfo = rawData ? JSON.parse(rawData) : {};

    // 2. Lấy danh sách chi tiết các ghế đã chọn
    const selectedDetails = seatData.filter(s => selectedSeats.has(s.showtimeSeatId))
        .map(s => ({
            dbId: s.showtimeSeatId,
            id: `${s.rowName}${s.seatNumber}`,
            type: mapTypeToClass(s.typeName),
            price: s.price
        }));

    // 3. ĐỒNG BỘ HÓA
    try {
        sessionStorage.setItem('selectedShowtimeId', showtimeId);
        sessionStorage.setItem('selectedSeats', JSON.stringify(selectedDetails));
        sessionStorage.setItem('selectedMovie', JSON.stringify({
            title: movieInfo.movieTitle || 'N/A',
            poster: movieInfo.movieImg || '',
            date: movieInfo.date || '',
            time: movieInfo.time || '',
            cinema: movieInfo.cinemaName || '',
            room: movieInfo.room || '',
            age: movieInfo.age || 'T13',
            tags: [movieInfo.type || '2D', movieInfo.age || 'T13']
        }));

        console.log("✅ Đã lưu dữ liệu đặt vé thành công:", { showtimeId, seats: selectedDetails.length });

        // Chuyển trang
        window.location.href = 'payment.html';
    } catch (e) {
        console.error("❌ Lỗi khi lưu vào sessionStorage:", e);
        alert("Có lỗi xảy ra khi lưu thông tin đặt vé.");
    }
});
// ============================================================
// PRICE DOT COLORS (inject dynamically into breakdown rows)
// ============================================================
// Patch breakdown pr-dot inline color
function patchDotColors() {
    document.querySelectorAll('.breakdown-row .pr-dot').forEach(dot => {
        const type = [...dot.classList].find(c => TYPE_COLORS[c]);
        if (type) {
            dot.style.background   = TYPE_COLORS[type] + '33';
            dot.style.borderColor  = TYPE_COLORS[type];
        }
    });
}

// Observe breakdown changes to patch colors
const observer = new MutationObserver(patchDotColors);
observer.observe(document.getElementById('breakdown-rows'), { childList: true });

// ============================================================
// SHAKE ANIMATION (CSS injection)
// ============================================================
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%,60%  { transform: translateX(-5px); }
    40%,80%  { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

// ============================================================
// INIT & EVENT HANDLERS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ĐỌC VÀ HIỂN THỊ THÔNG TIN PHIM TỪ TRANG TRƯỚC ---
    const rawData = sessionStorage.getItem('tempBookingInfo');
    let movieInfo = {};

    if (rawData) {
        movieInfo = JSON.parse(rawData);

        const dateEl = document.getElementById('mib-date');
        if (dateEl) {
            // Ưu tiên hiển thị info.date (đã format DD/MM/YYYY ở booking.js)
            dateEl.textContent = movieInfo.date || movieInfo.showDate || "--/--/----";
        }

        // Đổ dữ liệu lên UI bar (Sử dụng các ID khớp với HTML của bạn)
        if (document.getElementById('mib-title'))
            document.getElementById('mib-title').textContent = movieInfo.movieTitle;
        if (document.getElementById('mib-cinema'))
            document.getElementById('mib-cinema').textContent = movieInfo.cinemaName || "CineMax Cinema";
        if (document.getElementById('mib-room'))
            document.getElementById('mib-room').textContent = movieInfo.room;
        if (document.getElementById('mib-time'))
            document.getElementById('mib-time').textContent = movieInfo.time;
        if (document.getElementById('mib-date'))
            document.getElementById('mib-date').textContent = movieInfo.date || movieInfo.showDate || "---";
        if (document.getElementById('mib-img') && movieInfo.movieImg)
            document.getElementById('mib-img').src = movieInfo.movieImg;

        // Xử lý Badges (Tránh lỗi Undefined)
        const badges = document.getElementById('mib-badges');
        if (badges) {
            const ageLabel = movieInfo.age || 'T13';
            const typeLabel = movieInfo.type || '2D';
            const formattedAge = ageLabel.toString().includes('T') ? ageLabel : 'T' + ageLabel;
            badges.innerHTML = `
                <span class="mib-badge type">${typeLabel}</span>
                <span class="mib-badge age">${formattedAge}</span>
            `;
        }
    }

    // --- 2. TẢI SƠ ĐỒ GHẾ TỪ API ---
    fetchSeatLayout();

    // --- 3. XỬ LÝ CHUYỂN TRANG THANH TOÁN ---
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            // Kiểm tra chọn ghế
            if (selectedSeats.size === 0) {
                const warn = document.getElementById('checkout-warn');
                if (warn) {
                    warn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Vui lòng chọn ít nhất 1 ghế.';
                    warn.style.animation = 'shake .35s ease';
                }
                return;
            }

            // Kiểm tra showtimeId (Phòng hờ lỗi không lấy được ID từ URL)
            if (!showtimeId || showtimeId === "undefined") {
                alert("Lỗi: Không tìm thấy mã suất chiếu. Vui lòng quay lại trang chọn phim.");
                return;
            }

            // Lấy danh sách chi tiết ghế để truyền sang Payment
            const selectedDetails = seatData.filter(s => selectedSeats.has(s.showtimeSeatId))
                .map(s => ({
                    dbId: s.showtimeSeatId, // Dùng cho Stored Procedure ở Backend
                    id: `${s.rowName}${s.seatNumber}`,
                    type: mapTypeToClass(s.typeName),
                    price: s.price
                }));

            try {
                // ĐỒNG BỘ CÁC KHÓA MÀ PAYMENT.JS ĐANG ĐỢI
                sessionStorage.setItem('selectedShowtimeId', showtimeId);
                sessionStorage.setItem('selectedSeats', JSON.stringify(selectedDetails));
                sessionStorage.setItem('selectedMovie', JSON.stringify({
                    title: movieInfo.movieTitle || 'N/A',
                    poster: movieInfo.movieImg || '',
                    date: movieInfo.date || movieInfo.showDate || '',
                    time: movieInfo.time || '',
                    cinema: movieInfo.cinemaName || '',
                    room: movieInfo.room || '',
                    age: movieInfo.age || 'T13',
                    // Tags dùng để hiển thị các ô nhỏ ở trang payment
                    tags: [movieInfo.type || '2D', movieInfo.age || 'T13', movieInfo.genre || 'Phim']
                }));

                console.log("✅ Chuyển trang thanh toán:", { showtimeId, seats: selectedDetails.length });
                window.location.href = 'payment.html';
            } catch (e) {
                console.error("❌ Storage error:", e);
                alert("Lỗi lưu trữ thông tin đơn hàng vào Session.");
            }
        });
    }
});