/**
 * CINEMA ADMIN PORTAL - JAVASCRIPT CONTROLLER & API CLIENT
 */

const HOSTNAME = (window.location.hostname && window.location.hostname !== '') ? window.location.hostname : 'localhost';
const API_BASE_URL = `http://${HOSTNAME}:8080/api/v1/admin`;

let currentSelectedCinemaId = null;
let currentSelectedCinemaName = '';
let screeningFormatsList = [];
let roomsList = [];

// Layout Builder State
let currentRoomLayoutData = null;
let activeSelectedSeatTypeId = null;
let isMouseDownOverGrid = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Auth Security Token
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập tài khoản Quản trị viên (Admin) để truy cập!');
        window.location.href = '../login.html';
        return;
    }

    initNavigation();
    loadDashboardData();
    loadMoviesData();
    loadShowtimesData();
    loadInvoicesData();
    loadUsersData();
    loadDiscountsData();
    loadProductsData();
    loadCinemasData();
    loadScreeningFormats();
    initModalHandlers();
    initFileUploadHandlers();
    initSearchHandlers();
    initGridGlobalMouseTracker();
    initSidebarToggle();
});

/* Sidebar Collapse Toggle System */
function initSidebarToggle() {
    const sidebar = document.getElementById('adminSidebar');
    const btnToggleHeader = document.getElementById('btnToggleSidebar');
    const btnCollapseSidebar = document.getElementById('btnCollapseSidebar');

    const toggleSidebar = () => {
        if (!sidebar) return;
        const isCollapsed = sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed', isCollapsed);

        const iconHeader = btnToggleHeader?.querySelector('i');
        if (iconHeader) {
            iconHeader.className = isCollapsed ? 'fa-solid fa-indent' : 'fa-solid fa-bars';
        }

        localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
    };

    btnToggleHeader?.addEventListener('click', toggleSidebar);
    btnCollapseSidebar?.addEventListener('click', toggleSidebar);

    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        if (sidebar) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
            const iconHeader = btnToggleHeader?.querySelector('i');
            if (iconHeader) {
                iconHeader.className = 'fa-solid fa-indent';
            }
        }
    }
}

/* Navigation Router */
function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-menu .nav-item[data-section]');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('currentPageTitle');

    const activateSection = (hash) => {
        const targetHash = hash && hash.startsWith('#') ? hash : '#dashboard';
        let activeItem = Array.from(navItems).find(item => item.getAttribute('href') === targetHash);
        if (!activeItem) activeItem = navItems[0];

        const targetSectionId = activeItem.getAttribute('data-section');
        navItems.forEach(nav => nav.classList.remove('active'));
        sections.forEach(sec => sec.classList.remove('active'));

        activeItem.classList.add('active');
        const targetSec = document.getElementById(targetSectionId);
        if (targetSec) targetSec.classList.add('active');

        if (pageTitle && activeItem.querySelector('span')) {
            pageTitle.textContent = activeItem.querySelector('span').textContent;
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const href = item.getAttribute('href');
            if (href && href.startsWith('#')) {
                window.location.hash = href;
                activateSection(href);
            }
        });
    });

    const initialHash = window.location.hash || '#dashboard';
    activateSection(initialHash);

    window.addEventListener('hashchange', () => {
        activateSection(window.location.hash || '#dashboard');
    });

    // Mobile Sidebar Toggle
    const btnToggle = document.getElementById('btnToggleSidebar');
    const sidebar = document.getElementById('adminSidebar');
    if (btnToggle && sidebar) {
        btnToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Logout Handler
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '../login.html';
        });
    }

    // Back to Cinemas button
    document.getElementById('btnBackToCinemas')?.addEventListener('click', () => {
        backToCinemasList();
    });
}

/* API Fetch Wrapper */
async function fetchAdminApi(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {})
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Bạn không có quyền truy cập trang Quản trị hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập tài khoản Admin!');
            localStorage.removeItem('token');
            window.location.href = '../login.html';
            return null;
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error(`API Error on ${endpoint}:`, err);
        return null;
    }
}

/* 1. Dashboard Analytics */
let revenueChartInstance = null;

async function loadDashboardData() {
    const resStats = await fetchAdminApi('/dashboard/stats');
    if (resStats && resStats.data) {
        const d = resStats.data;
        document.getElementById('valTotalRevenue').textContent = formatVND(d.totalRevenue);
        document.getElementById('valTodayRevenue').textContent = formatVND(d.todayRevenue);
        document.getElementById('valTicketsSold').textContent = d.ticketsSold.toLocaleString();
        document.getElementById('valTodayTickets').textContent = `${d.todayTickets} vé`;
        document.getElementById('valActiveMovies').textContent = d.activeMoviesCount;
        document.getElementById('valTotalCustomers').textContent = d.totalCustomers;
    }

    const resChart = await fetchAdminApi('/dashboard/revenue-chart');
    if (resChart && resChart.data) {
        renderChart(resChart.data.labels, resChart.data.revenueData);
    } else {
        renderChart(['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN'], [1500000, 2400000, 1800000, 3200000, 4500000, 6800000, 5200000]);
    }
}

function renderChart(labels, data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }

    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af', callback: (val) => formatVNDCompact(val) } }
            }
        }
    });
}

/* 2. Movies Management */
let moviesList = [];

async function loadMoviesData() {
    const res = await fetchAdminApi('/movies');
    const tbody = document.getElementById('tbodyMovies');
    const stSelect = document.getElementById('stMovieSelect');

    if (res && res.data) {
        moviesList = res.data;
    } else {
        moviesList = [];
    }

    tbody.innerHTML = moviesList.map(m => {
        const isShowing = m.status === 'showing' || m.status === 'now_showing';
        const isComing = m.status === 'coming_soon';
        const isStopped = m.status === 'stopped' || m.status === 'end_showing' || m.status === 'ended';

        return `
        <tr>
            <td>#${m.id}</td>
            <td><img src="${m.posterLink || 'https://via.placeholder.com/44x60'}" class="poster-thumb" alt="${m.title}"></td>
            <td>
                <strong>${m.title}</strong>
                ${m.directorName ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;"><i class="fa-solid fa-user-ninja"></i> ĐĐ: ${m.directorName}</div>` : ''}
            </td>
            <td>${m.duration} phút</td>
            <td>${m.releaseDate || 'N/A'}</td>
            <td><span class="badge badge-now_showing">${m.ageRating || 'P'}</span></td>
            <td>
                <select class="form-control status-select-badge status-${m.status || 'showing'}" onchange="changeMovieStatusQuick(${m.id}, this.value)" style="width: auto; padding: 4px 8px; font-size: 12px; font-weight: 600; border-radius: 8px;">
                    <option value="showing" ${isShowing ? 'selected' : ''}>🟢 Đang chiếu</option>
                    <option value="coming_soon" ${isComing ? 'selected' : ''}>🟡 Sắp chiếu</option>
                    <option value="stopped" ${isStopped ? 'selected' : ''}>🔴 Ngừng chiếu</option>
                </select>
            </td>
            <td>
                <button class="btn btn-secondary btn-action" onclick="editMovie(${m.id})"><i class="fa-solid fa-pen"></i> Sửa</button>
                <button class="btn btn-secondary btn-action" onclick="deleteMovie(${m.id})"><i class="fa-solid fa-trash"></i> Xóa</button>
            </td>
        </tr>
        `;
    }).join('') || '<tr><td colspan="8" class="text-center">Chưa có dữ liệu phim.</td></tr>';

    if (stSelect) {
        stSelect.innerHTML = '<option value="">-- Chọn phim --</option>' +
            moviesList.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
    }
}

/* 3. Showtimes Management */
async function loadShowtimesData() {
    const res = await fetchAdminApi('/showtimes');
    const tbody = document.getElementById('tbodyShowtimes');
    let showtimes = (res && res.data) ? res.data : [];

    tbody.innerHTML = showtimes.map(st => `
        <tr>
            <td>#${st.showtimeId}</td>
            <td><strong>${st.movieTitle || 'Phim #' + st.movieId}</strong></td>
            <td>${st.roomName || 'Phòng 0' + st.roomId}</td>
            <td>${st.showDate || 'N/A'}</td>
            <td>${st.startTime} - ${st.endTime}</td>
            <td>
                <button class="btn btn-secondary btn-action" onclick="deleteShowtime(${st.showtimeId})"><i class="fa-solid fa-trash"></i> Xóa</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">Chưa có lịch chiếu nào.</td></tr>';
}

/* 4. Invoices Management */
async function loadInvoicesData() {
    const res = await fetchAdminApi('/invoices');
    const tbody = document.getElementById('tbodyInvoices');
    const tbodyRecent = document.getElementById('tbodyRecentInvoices');

    let invoices = (res && res.data) ? res.data : [];

    const rowsHtml = invoices.map(inv => `
        <tr>
            <td><code>${inv.invoiceId ? inv.invoiceId.toString().substring(0, 8) + '...' : 'N/A'}</code></td>
            <td>${inv.createdDatetime ? new Date(inv.createdDatetime).toLocaleString('vi-VN') : 'Mới đây'}</td>
            <td>${formatVND(inv.totalPrice)}</td>
            <td><strong>${formatVND(inv.finalPrice)}</strong></td>
            <td><span class="badge badge-${inv.invoiceStatus}">${inv.invoiceStatus}</span></td>
            <td>
                <button class="btn btn-secondary btn-action" onclick="viewInvoiceDetail('${inv.invoiceId}')"><i class="fa-solid fa-eye"></i> Chi tiết</button>
            </td>
        </tr>
    `).join('');

    if (tbody) tbody.innerHTML = rowsHtml || '<tr><td colspan="6" class="text-center">Chưa có hóa đơn nào.</td></tr>';
    if (tbodyRecent) tbodyRecent.innerHTML = rowsHtml.slice(0, 4) || '<tr><td colspan="4" class="text-center">Chưa có giao dịch.</td></tr>';
}

/* 5. User Management */
let usersList = [];
async function loadUsersData() {
    const res = await fetchAdminApi('/users');
    if (res && res.data) usersList = res.data;
    renderUsersTable(usersList);
}

function renderUsersTable(list) {
    const tbody = document.getElementById('tbodyUsers');
    if (!tbody) return;
    const currentUser = localStorage.getItem('username') || '';
    const isSuperAdmin = currentUser.toLowerCase() === 'admin@gmail.com' || currentUser.toLowerCase() === 'admin';

    // Sắp xếp ưu tiên: Super Admin -> Admin -> Customer
    const sortedList = list.slice().sort((a, b) => {
        const getRank = (u) => {
            const email = (u.email || '').toLowerCase();
            if (email === 'admin@gmail.com' || email === 'admin') return 0;
            if (u.role === 'admin') return 1;
            return 2;
        };
        return getRank(a) - getRank(b);
    });

    tbody.innerHTML = sortedList.map(u => {
        const isThisSuperAdmin = (u.email || '').toLowerCase() === 'admin@gmail.com' || (u.email || '').toLowerCase() === 'admin';
        return `
        <tr>
            <td>#${u.userId}</td>
            <td><strong>${u.fullName || 'Khách hàng'}</strong></td>
            <td>${u.email}</td>
            <td>${u.phoneNumber || 'N/A'}</td>
            <td><strong style="color: #f59e0b;">${u.coin || 0} Coin</strong></td>
            <td>
                ${isThisSuperAdmin ? `
                    <span class="badge" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff;"><i class="fa-solid fa-crown"></i> Super Admin</span>
                ` : `
                    <span class="badge badge-${u.role === 'admin' ? 'now_showing' : 'coming_soon'}">${u.role}</span>
                `}
            </td>
            <td>
                ${isThisSuperAdmin ? `
                    <span class="badge badge-now_showing" style="font-size: 11px;"><i class="fa-solid fa-shield-halved"></i> Gốc Hệ Thống</span>
                ` : isSuperAdmin ? `
                    <button class="btn btn-secondary btn-action" onclick="toggleUserRole(${u.userId}, '${u.role}')">
                        <i class="fa-solid fa-user-gear"></i> ${u.role === 'admin' ? 'Đổi sang Customer' : 'Đổi sang Admin'}
                    </button>
                ` : `
                    <span class="badge badge-end_showing" style="font-size: 11px;"><i class="fa-solid fa-lock"></i> Chỉ Super Admin</span>
                `}
            </td>
        </tr>
    `}).join('') || '<tr><td colspan="7" class="text-center">Chưa có người dùng nào.</td></tr>';
}

/* 6. Discount Management */
let discountsList = [];
async function loadDiscountsData() {
    const res = await fetchAdminApi('/discounts');
    const tbody = document.getElementById('tbodyDiscounts');
    if (res && res.data) discountsList = res.data;

    tbody.innerHTML = discountsList.map(d => `
        <tr>
            <td>#${d.discountId}</td>
            <td><strong>${d.discountTitle}</strong></td>
            <td><code>${d.discountCode}</code></td>
            <td>${d.discountType === 'percent' ? '%' : 'VNĐ'}</td>
            <td>${d.discountType === 'percent' ? d.discountValue + '%' : formatVND(d.discountValue)}</td>
            <td>${d.startDate || 'N/A'}</td>
            <td>${d.endDate || 'N/A'}</td>
            <td>${d.currentUsage || 0} / ${d.maxUsage || '∞'}</td>
            <td>
                <button class="btn btn-secondary btn-action" onclick="editDiscount(${d.discountId})"><i class="fa-solid fa-pen"></i> Sửa</button>
                <button class="btn btn-secondary btn-action" onclick="deleteDiscount(${d.discountId})"><i class="fa-solid fa-trash"></i> Xóa</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="9" class="text-center">Chưa có mã giảm giá nào.</td></tr>';
}

/* 7. Product Management */
let productsList = [];
async function loadProductsData() {
    const res = await fetchAdminApi('/products');
    const tbody = document.getElementById('tbodyProducts');
    if (res && res.data) productsList = res.data;

    tbody.innerHTML = productsList.map(p => `
        <tr>
            <td>#${p.productId}</td>
            <td><img src="${p.imageUrl || 'https://via.placeholder.com/50'}" class="poster-thumb" style="width: 44px; height: 44px; border-radius: 8px;" alt="${p.productName}"></td>
            <td><strong>${p.productName}</strong></td>
            <td>${p.productTypeName || 'Bắp Nước'}</td>
            <td><strong>${formatVND(p.price)}</strong></td>
            <td><span class="badge badge-now_showing">Đang bán</span></td>
            <td>
                <button class="btn btn-secondary btn-action" onclick="editProduct(${p.productId})"><i class="fa-solid fa-pen"></i> Sửa</button>
                <button class="btn btn-secondary btn-action" onclick="deleteProduct(${p.productId})"><i class="fa-solid fa-trash"></i> Xóa</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center">Chưa có sản phẩm bắp nước nào.</td></tr>';
}

/* 8. Cinema & Room Management */
let cinemasList = [];
async function loadCinemasData() {
    const res = await fetchAdminApi('/cinemas');
    const tbody = document.getElementById('tbodyCinemas');
    const stCinemaSelect = document.getElementById('stCinemaSelect');

    if (res && res.data) cinemasList = res.data;

    tbody.innerHTML = cinemasList.map(c => `
        <tr>
            <td>#${c.cinemasId}</td>
            <td><img src="${c.imageUrl || 'https://via.placeholder.com/60x40'}" class="poster-thumb" style="width: 60px; height: 40px; border-radius: 6px;" alt="${c.cinemaName}"></td>
            <td><strong>${c.cinemaName}</strong></td>
            <td>${c.address}</td>
            <td>${c.hotline || 'N/A'}</td>
            <td>
                <button class="btn btn-primary btn-action" onclick="showRoomsOfCinema(${c.cinemasId}, '${c.cinemaName}')"><i class="fa-solid fa-door-open"></i> Xem Phòng</button>
                <button class="btn btn-secondary btn-action" onclick="editCinema(${c.cinemasId})"><i class="fa-solid fa-pen"></i> Sửa</button>
                <button class="btn btn-secondary btn-action" onclick="deleteCinema(${c.cinemasId})"><i class="fa-solid fa-trash"></i> Xóa</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">Chưa có rạp chiếu nào.</td></tr>';

    if (stCinemaSelect) {
        stCinemaSelect.innerHTML = '<option value="">-- Chọn rạp --</option>' +
            cinemasList.map(c => `<option value="${c.cinemasId}">${c.cinemaName}</option>`).join('');
    }
}

async function loadScreeningFormats() {
    const res = await fetchAdminApi('/screening-formats');
    const select = document.getElementById('roomFormatSelect');
    if (res && res.data) screeningFormatsList = res.data;

    if (select) {
        select.innerHTML = '<option value="">-- Chọn định dạng chiếu --</option>' +
            screeningFormatsList.map(f => `<option value="${f.screeningFormatId}">${f.type} ${f.price ? '(' + formatVND(f.price) + ')' : ''}</option>`).join('');
    }
}

window.showRoomsOfCinema = async function(cinemaId, cinemaName) {
    currentSelectedCinemaId = cinemaId;
    currentSelectedCinemaName = cinemaName;

    document.getElementById('viewCinemasList').style.display = 'none';
    document.getElementById('viewCinemaRooms').style.display = 'block';
    document.getElementById('currentCinemaNameTitle').innerHTML = `<i class="fa-solid fa-door-open"></i> Danh Sách Phòng Chiếu: <span style="color: var(--primary);">${cinemaName}</span>`;

    loadRoomsDataForCinema(cinemaId);
};

window.backToCinemasList = function() {
    document.getElementById('viewCinemaRooms').style.display = 'none';
    document.getElementById('viewCinemasList').style.display = 'block';
};

async function loadRoomsDataForCinema(cinemaId) {
    const res = await fetchAdminApi(`/cinemas/${cinemaId}/rooms`);
    const tbody = document.getElementById('tbodyRooms');

    roomsList = (res && res.data) ? res.data : [];

    tbody.innerHTML = roomsList.map(r => `
        <tr>
            <td>#${r.roomId}</td>
            <td><strong>${r.roomName}</strong></td>
            <td>${r.cinemaName}</td>
            <td><span class="badge badge-now_showing">${r.screeningFormatType || '2D'}</span></td>
            <td>${r.price ? formatVND(r.price) : '0 ₫'}</td>
            <td>
                <button class="btn btn-primary btn-action" onclick="editRoom(${r.roomId})"><i class="fa-solid fa-pen-to-square"></i> Sửa & Sơ Đồ Ghế</button>
                <button class="btn btn-secondary btn-action" onclick="deleteRoom(${r.roomId})"><i class="fa-solid fa-trash"></i> Xóa</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">Rạp này chưa có phòng chiếu nào. Bấm nút "+ Thêm Phòng Chiếu Mới" để tạo phòng!</td></tr>';
}

/* Modal Event Handlers */
function initModalHandlers() {
    // Movie Modal
    const movieModal = document.getElementById('movieModal');
    document.getElementById('btnOpenAddMovie')?.addEventListener('click', () => {
        document.getElementById('formMovie').reset();
        document.getElementById('movieId').value = '';
        document.getElementById('movieModalTitle').textContent = 'Thêm Phim Mới';
        updatePreview('moviePosterPreviewBox', 'moviePosterPreviewImg', '', false);
        updatePreview('movieTrailerPreviewBox', 'movieTrailerPreviewVid', '', true);
        movieModal.classList.add('show');
    });
    document.getElementById('btnCloseMovieModal')?.addEventListener('click', () => movieModal.classList.remove('show'));
    document.getElementById('btnCancelMovieModal')?.addEventListener('click', () => movieModal.classList.remove('show'));

    document.getElementById('formMovie')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('movieId').value;
        const payload = {
            title: document.getElementById('movieTitle').value,
            directorName: document.getElementById('movieDirector')?.value || '',
            duration: parseInt(document.getElementById('movieDuration').value),
            ageRating: document.getElementById('movieAgeRating').value,
            releaseDate: document.getElementById('movieReleaseDate').value,
            status: document.getElementById('movieStatus').value,
            posterLink: document.getElementById('moviePosterLink').value,
            trailerLink: document.getElementById('movieTrailerLink').value,
            description: document.getElementById('movieDescription').value
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/movies/${id}` : '/movies';
        const res = await fetchAdminApi(url, { method, body: JSON.stringify(payload) });
        if (res && (res.status === 200 || res.code === 200)) {
            alert(id ? 'Cập nhật thông tin phim thành công!' : 'Thêm phim mới thành công!');
            movieModal.classList.remove('show');
            loadMoviesData();
        } else {
            alert('Lỗi: ' + (res?.message || 'Không thể lưu thông tin phim'));
        }
    });

    // Showtime Modal (Linked dropdowns Cinema -> Rooms)
    const showtimeModal = document.getElementById('showtimeModal');
    const stCinemaSelect = document.getElementById('stCinemaSelect');
    const stRoomSelect = document.getElementById('stRoomSelect');

    document.getElementById('btnOpenAddShowtime')?.addEventListener('click', () => {
        showtimeModal.classList.add('show');
    });
    document.getElementById('btnCloseShowtimeModal')?.addEventListener('click', () => showtimeModal.classList.remove('show'));
    document.getElementById('btnCancelShowtimeModal')?.addEventListener('click', () => showtimeModal.classList.remove('show'));

    stCinemaSelect?.addEventListener('change', async (e) => {
        const cinemaId = e.target.value;
        if (!cinemaId) {
            stRoomSelect.innerHTML = '<option value="">-- Chọn phòng --</option>';
            return;
        }

        stRoomSelect.innerHTML = '<option value="">Đang tải phòng...</option>';
        const res = await fetchAdminApi(`/cinemas/${cinemaId}/rooms`);
        if (res && res.data && res.data.length > 0) {
            stRoomSelect.innerHTML = '<option value="">-- Chọn phòng --</option>' +
                res.data.map(r => `<option value="${r.roomId}">${r.roomName} (${r.screeningFormatType || '2D'})</option>`).join('');
        } else {
            stRoomSelect.innerHTML = '<option value="">Chưa có phòng chiếu tại rạp này</option>';
        }
    });

    document.getElementById('formShowtime')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const roomId = parseInt(document.getElementById('stRoomSelect').value);
        if (!roomId) {
            alert('Vui lòng chọn phòng chiếu!');
            return;
        }

        const payload = {
            movieId: parseInt(document.getElementById('stMovieSelect').value),
            roomId: roomId,
            showDate: document.getElementById('stShowDate').value,
            startTime: document.getElementById('stStartTime').value + ':00',
            endTime: document.getElementById('stEndTime').value + ':00'
        };
        await fetchAdminApi('/showtimes', { method: 'POST', body: JSON.stringify(payload) });
        showtimeModal.classList.remove('show');
        loadShowtimesData();
    });

    // Room Modal Handlers & 10x10 Seat Matrix Submit
    const roomModal = document.getElementById('roomModal');
    document.getElementById('btnOpenAddRoom')?.addEventListener('click', () => {
        if (!currentSelectedCinemaId) {
            alert('Vui lòng chọn Rạp chiếu trước!');
            return;
        }
        document.getElementById('formRoom').reset();
        document.getElementById('roomId').value = '';
        document.getElementById('roomCinemaId').value = currentSelectedCinemaId;
        document.getElementById('roomModalTitle').textContent = `Thêm Phòng Chiếu Mới (${currentSelectedCinemaName})`;
        
        // Hide seat builder container for new room creation until saved
        const container = document.querySelector('.seat-builder-container');
        if (container) container.style.display = 'none';

        roomModal.classList.add('show');
    });
    document.getElementById('btnCloseRoomModal')?.addEventListener('click', () => roomModal.classList.remove('show'));
    document.getElementById('btnCancelRoomModal')?.addEventListener('click', () => roomModal.classList.remove('show'));

    document.getElementById('formRoom')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('roomId').value;

        if (!id) {
            // Thêm phòng chiếu mới
            const payload = {
                roomName: document.getElementById('roomName').value,
                cinemasId: parseInt(document.getElementById('roomCinemaId').value || currentSelectedCinemaId),
                screeningFormatId: parseInt(document.getElementById('roomFormatSelect').value)
            };
            await fetchAdminApi('/rooms', { method: 'POST', body: JSON.stringify(payload) });
            roomModal.classList.remove('show');
            if (currentSelectedCinemaId) loadRoomsDataForCinema(currentSelectedCinemaId);
            return;
        }

        // Chỉnh sửa phòng chiếu & Lưu ma trận 10x10 + Bảng giá 5 loại ghế
        const updatedSeatTypes = [];
        document.querySelectorAll('.seat-price-input').forEach(inp => {
            const typeId = parseInt(inp.getAttribute('data-type-id'));
            const priceVal = parseFloat(inp.value) || 0;
            updatedSeatTypes.push({
                seatTypeId: typeId,
                price: priceVal
            });
        });

        const updatedSeats = [];
        document.querySelectorAll('.seat-cell').forEach(cell => {
            const rowName = cell.getAttribute('data-row');
            const seatNumber = parseInt(cell.getAttribute('data-col'));
            const typeId = parseInt(cell.getAttribute('data-type-id'));
            if (rowName && seatNumber && typeId) {
                updatedSeats.push({
                    rowName: rowName,
                    seatNumber: seatNumber,
                    seatTypeId: typeId
                });
            }
        });

        const payload = {
            roomId: parseInt(id),
            roomName: document.getElementById('roomName').value,
            screeningFormatId: parseInt(document.getElementById('roomFormatSelect').value),
            seatTypes: updatedSeatTypes,
            seats: updatedSeats
        };

        const res = await fetchAdminApi(`/rooms/${id}/layout`, { method: 'PUT', body: JSON.stringify(payload) });
        if (res && res.status === 200) {
            alert('Lưu cấu hình tên phòng, bảng giá và ma trận sơ đồ ghế 10x10 thành công!');
        } else if (res && res.message) {
            alert(res.message);
        }

        roomModal.classList.remove('show');
        if (currentSelectedCinemaId) loadRoomsDataForCinema(currentSelectedCinemaId);
    });

    // Discount Modal
    const discountModal = document.getElementById('discountModal');
    document.getElementById('btnOpenAddDiscount')?.addEventListener('click', () => {
        document.getElementById('formDiscount').reset();
        document.getElementById('discountId').value = '';
        document.getElementById('discountModalTitle').textContent = 'Thêm Mã Giảm Giá Mới';
        discountModal.classList.add('show');
    });
    document.getElementById('btnCloseDiscountModal')?.addEventListener('click', () => discountModal.classList.remove('show'));
    document.getElementById('btnCancelDiscountModal')?.addEventListener('click', () => discountModal.classList.remove('show'));

    document.getElementById('formDiscount')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('discountId').value;
        const payload = {
            discountTitle: document.getElementById('discountTitle').value,
            discountCode: document.getElementById('discountCode').value,
            discountType: document.getElementById('discountType').value,
            discountValue: parseFloat(document.getElementById('discountValue').value),
            maxUsage: parseInt(document.getElementById('maxUsage').value),
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value
        };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/discounts/${id}` : '/discounts';
        await fetchAdminApi(url, { method, body: JSON.stringify(payload) });
        discountModal.classList.remove('show');
        loadDiscountsData();
    });

    // Product Modal
    const productModal = document.getElementById('productModal');
    document.getElementById('btnOpenAddProduct')?.addEventListener('click', () => {
        document.getElementById('formProduct').reset();
        document.getElementById('productId').value = '';
        document.getElementById('productModalTitle').textContent = 'Thêm Sản Phẩm Mới';
        updatePreview('productImagePreviewBox', 'productImagePreviewImg', '', false);
        productModal.classList.add('show');
    });
    document.getElementById('btnCloseProductModal')?.addEventListener('click', () => productModal.classList.remove('show'));
    document.getElementById('btnCancelProductModal')?.addEventListener('click', () => productModal.classList.remove('show'));

    document.getElementById('formProduct')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('productId').value;
        const payload = {
            productName: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            productTypeId: parseInt(document.getElementById('productTypeId').value),
            imageUrl: document.getElementById('productImageUrl').value,
            description: document.getElementById('productDescription').value,
            isAvailable: true
        };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/products/${id}` : '/products';
        const res = await fetchAdminApi(url, { method, body: JSON.stringify(payload) });
        if (res && (res.status === 200 || res.code === 200)) {
            alert(id ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm mới thành công!');
            productModal.classList.remove('show');
            loadProductsData();
        } else {
            alert('Lỗi: ' + (res?.message || 'Không thể lưu sản phẩm'));
        }
    });

    // Cinema Modal
    const cinemaModal = document.getElementById('cinemaModal');
    document.getElementById('btnOpenAddCinema')?.addEventListener('click', () => {
        document.getElementById('formCinema').reset();
        document.getElementById('cinemaId').value = '';
        document.getElementById('cinemaModalTitle').textContent = 'Thêm Rạp Chiếu Mới';
        updatePreview('cinemaImagePreviewBox', 'cinemaImagePreviewImg', '', false);
        cinemaModal.classList.add('show');
    });
    document.getElementById('btnCloseCinemaModal')?.addEventListener('click', () => cinemaModal.classList.remove('show'));
    document.getElementById('btnCancelCinemaModal')?.addEventListener('click', () => cinemaModal.classList.remove('show'));

    document.getElementById('formCinema')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('cinemaId').value;
        const payload = {
            cinemaName: document.getElementById('cinemaName').value,
            address: document.getElementById('cinemaAddress').value,
            hotline: document.getElementById('cinemaHotline').value,
            fax: document.getElementById('cinemaFax').value,
            imageUrl: document.getElementById('cinemaImageUrl').value
        };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/cinemas/${id}` : '/cinemas';
        const res = await fetchAdminApi(url, { method, body: JSON.stringify(payload) });
        if (res && (res.status === 200 || res.code === 200)) {
            alert(id ? 'Cập nhật thông tin rạp thành công!' : 'Thêm rạp chiếu mới thành công!');
            cinemaModal.classList.remove('show');
            loadCinemasData();
        } else {
            alert('Lỗi: ' + (res?.message || 'Không thể lưu rạp chiếu'));
        }
    });

    // Invoice Detail Modal Handlers
    const invoiceDetailModal = document.getElementById('invoiceDetailModal');
    document.getElementById('btnCloseInvoiceDetailModal')?.addEventListener('click', () => invoiceDetailModal.classList.remove('show'));
    document.getElementById('btnOkInvoiceDetail')?.addEventListener('click', () => invoiceDetailModal.classList.remove('show'));
}

/* 10x10 Seat Grid Visual Builder Engine */
window.editRoom = async function(id) {
    const roomModal = document.getElementById('roomModal');
    document.getElementById('roomId').value = id;
    document.getElementById('roomModalTitle').textContent = 'Chỉnh Sửa Phòng & Sơ Đồ Ma Trận Ghế (10x10)';

    const container = document.querySelector('.seat-builder-container');
    if (container) container.style.display = 'grid';

    const res = await fetchAdminApi(`/rooms/${id}/layout`);
    if (res && res.data) {
        currentRoomLayoutData = res.data;
        document.getElementById('roomName').value = res.data.roomName || '';
        document.getElementById('roomCinemaId').value = res.data.cinemasId || currentSelectedCinemaId;
        document.getElementById('roomFormatSelect').value = res.data.screeningFormatId || '';

        renderSeatTypesPalette(res.data.seatTypes);
        renderSeatGrid10x10(res.data.seats, res.data.seatTypes);
    }
    roomModal.classList.add('show');
};

function renderSeatTypesPalette(types) {
    const palette = document.getElementById('seatTypesList');
    if (!palette) return;

    palette.innerHTML = types.map(t => {
        const bgClass = getSeatColorCssClass(t.typeName);
        return `
            <div class="seat-type-card" draggable="true" data-type-id="${t.seatTypeId}">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="seat-color-badge ${bgClass}"></span>
                    <strong style="font-size: 12px; color: var(--text-heading);">${t.typeName}</strong>
                </div>
                <input type="number" class="seat-price-input" data-type-id="${t.seatTypeId}" value="${t.price || 0}" step="1000">
            </div>
        `;
    }).join('');

    // Attach Drag & Drop + Click-to-Paint handlers
    const cards = palette.querySelectorAll('.seat-type-card');
    cards.forEach(card => {
        const typeId = parseInt(card.getAttribute('data-type-id'));

        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', typeId);
            activeSelectedSeatTypeId = typeId;
        });

        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activeSelectedSeatTypeId = typeId;
        });
    });

    if (cards.length > 0) {
        cards[0].classList.add('active');
        activeSelectedSeatTypeId = parseInt(cards[0].getAttribute('data-type-id'));
    }
}

function renderSeatGrid10x10(seatsList, typesList) {
    const grid = document.getElementById('seatGrid10x10');
    if (!grid) return;
    grid.innerHTML = '';

    const seatMap = new Map();
    if (seatsList) {
        seatsList.forEach(s => {
            seatMap.set(`${s.rowName}${s.seatNumber}`, s);
        });
    }

    const typeMap = new Map();
    if (typesList) {
        typesList.forEach(t => typeMap.set(t.seatTypeId, t));
    }

    // Top Column Headers (1 to 10)
    grid.appendChild(createHeaderCell('')); // Empty top-left corner
    for (let c = 1; c <= 10; c++) {
        grid.appendChild(createHeaderCell(c.toString()));
    }

    // 10 Rows (A to J)
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    rows.forEach(rowLetter => {
        // Row letter header (leftmost column)
        grid.appendChild(createHeaderCell(rowLetter));

        for (let colNum = 1; colNum <= 10; colNum++) {
            const seatKey = `${rowLetter}${colNum}`;
            const sItem = seatMap.get(seatKey);
            const typeId = sItem ? sItem.seatTypeId : (typesList[0] ? typesList[0].seatTypeId : 1);
            const stObj = typeMap.get(typeId) || typesList[0];
            const colorClass = getSeatColorCssClass(stObj ? stObj.typeName : 'Thường');

            const cell = document.createElement('div');
            cell.className = `seat-cell ${colorClass}`;
            cell.textContent = `${rowLetter}${colNum}`;
            cell.setAttribute('data-row', rowLetter);
            cell.setAttribute('data-col', colNum);
            cell.setAttribute('data-type-id', typeId);

            // Drag & Drop Handlers
            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                const droppedTypeId = parseInt(e.dataTransfer.getData('text/plain'));
                if (droppedTypeId) applySeatTypeToCell(cell, droppedTypeId, typesList);
            });

            // Click & Paint Handlers
            cell.addEventListener('mousedown', () => {
                if (activeSelectedSeatTypeId) applySeatTypeToCell(cell, activeSelectedSeatTypeId, typesList);
            });

            cell.addEventListener('mouseenter', () => {
                if (isMouseDownOverGrid && activeSelectedSeatTypeId) {
                    applySeatTypeToCell(cell, activeSelectedSeatTypeId, typesList);
                }
            });

            grid.appendChild(cell);
        }
    });
}

function applySeatTypeToCell(cell, typeId, typesList) {
    cell.setAttribute('data-type-id', typeId);
    const typeObj = (typesList || []).find(t => t.seatTypeId === typeId) || (currentRoomLayoutData ? currentRoomLayoutData.seatTypes.find(t => t.seatTypeId === typeId) : null);
    const colorClass = getSeatColorCssClass(typeObj ? typeObj.typeName : 'Thường');

    cell.className = `seat-cell ${colorClass}`;
}

function createHeaderCell(text) {
    const div = document.createElement('div');
    div.className = text.match(/^[A-J]$/) ? 'seat-row-header' : 'seat-col-header';
    div.textContent = text;
    return div;
}

function getSeatColorCssClass(typeName) {
    const name = (typeName || '').toLowerCase();
    if (name.includes('vip')) return 'bg-st-vip';
    if (name.includes('sweet') || name.includes('box')) return 'bg-st-sweetbox';
    if (name.includes('couple') || name.includes('đôi')) return 'bg-st-couple';
    if (name.includes('cao cấp') || name.includes('deluxe') || name.includes('premium')) return 'bg-st-deluxe';
    return 'bg-st-standard'; // Thường
}

function initGridGlobalMouseTracker() {
    window.addEventListener('mousedown', () => { isMouseDownOverGrid = true; });
    window.addEventListener('mouseup', () => { isMouseDownOverGrid = false; });
}

/* User Search */
function initSearchHandlers() {
    const searchInput = document.getElementById('searchUser');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = usersList.filter(u =>
                (u.fullName && u.fullName.toLowerCase().includes(query)) ||
                (u.email && u.email.toLowerCase().includes(query))
            );
            renderUsersTable(filtered);
        });
    }
}

/* Global Actions */
window.toggleUserRole = async function(id, currentRole) {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    if (confirm(`Bạn có chắc chắn muốn đổi quyền người dùng này sang: ${newRole.toUpperCase()}?`)) {
        const res = await fetchAdminApi(`/users/${id}/role?role=${newRole}`, { method: 'PUT' });
        if (res && res.status === 200) {
            alert('Cập nhật quyền thành công!');
        } else if (res && res.message) {
            alert(res.message);
        }
        loadUsersData();
    }
};

window.editMovie = function(id) {
    const movie = moviesList.find(m => m.id === id);
    if (!movie) return;
    document.getElementById('movieId').value = movie.id;
    document.getElementById('movieTitle').value = movie.title || '';
    document.getElementById('movieDirector').value = movie.directorName || '';
    document.getElementById('movieDuration').value = movie.duration || 120;
    document.getElementById('movieAgeRating').value = movie.ageRating || 'P';
    document.getElementById('movieReleaseDate').value = movie.releaseDate || '';
    let stVal = movie.status || 'showing';
    if (stVal === 'now_showing') stVal = 'showing';
    if (stVal === 'end_showing' || stVal === 'ended') stVal = 'stopped';
    document.getElementById('movieStatus').value = stVal;
    document.getElementById('moviePosterLink').value = movie.posterLink || '';
    document.getElementById('movieTrailerLink').value = movie.trailerLink || '';
    document.getElementById('movieDescription').value = movie.description || '';
    document.getElementById('movieModalTitle').textContent = 'Chỉnh Sửa Thông Tin Phim';
    updatePreview('moviePosterPreviewBox', 'moviePosterPreviewImg', movie.posterLink, false);
    updatePreview('movieTrailerPreviewBox', 'movieTrailerPreviewVid', movie.trailerLink, true);
    document.getElementById('movieModal').classList.add('show');
};

window.changeMovieStatusQuick = async function(id, newStatus) {
    const res = await fetchAdminApi(`/movies/${id}/status?status=${newStatus}`, { method: 'PUT' });
    if (res && (res.status === 200 || res.code === 200)) {
        loadMoviesData();
    } else {
        alert('Cập nhật trạng thái thất bại: ' + (res?.message || 'Không thể thay đổi trạng thái phim'));
        loadMoviesData();
    }
};

window.deleteMovie = async function(id) {
    if (confirm('Bạn có chắc chắn muốn xóa phim này?')) {
        const res = await fetchAdminApi(`/movies/${id}`, { method: 'DELETE' });
        if (res && (res.status === 200 || res.code === 200)) {
            alert('Xóa phim thành công!');
            loadMoviesData();
        } else {
            alert('Xóa thất bại: ' + (res?.message || 'Không thể xóa phim này'));
        }
    }
};

window.deleteShowtime = async function(id) {
    if (confirm('Bạn có chắc chắn muốn xóa suất chiếu này?')) {
        const res = await fetchAdminApi(`/showtimes/${id}`, { method: 'DELETE' });
        if (res && (res.status === 200 || res.code === 200)) {
            alert('Xóa suất chiếu thành công!');
            loadShowtimesData();
        } else {
            alert('Xóa thất bại: ' + (res?.message || 'Không thể xóa suất chiếu này'));
        }
    }
};

window.editDiscount = function(id) {
    const d = discountsList.find(item => item.discountId === id);
    if (!d) return;
    document.getElementById('discountId').value = d.discountId;
    document.getElementById('discountTitle').value = d.discountTitle;
    document.getElementById('discountCode').value = d.discountCode;
    document.getElementById('discountType').value = d.discountType;
    document.getElementById('discountValue').value = d.discountValue;
    document.getElementById('maxUsage').value = d.maxUsage || 100;
    document.getElementById('startDate').value = d.startDate || '';
    document.getElementById('endDate').value = d.endDate || '';
    document.getElementById('discountModalTitle').textContent = 'Chỉnh Sửa Mã Giảm Giá';
    document.getElementById('discountModal').classList.add('show');
};

window.deleteDiscount = async function(id) {
    if (confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
        const res = await fetchAdminApi(`/discounts/${id}`, { method: 'DELETE' });
        if (res && (res.status === 200 || res.code === 200)) {
            alert('Xóa mã giảm giá thành công!');
            loadDiscountsData();
        } else {
            alert('Xóa thất bại: ' + (res?.message || 'Không thể xóa mã giảm giá này'));
        }
    }
};

window.editProduct = function(id) {
    const p = productsList.find(item => item.productId === id);
    if (!p) return;
    document.getElementById('productId').value = p.productId;
    document.getElementById('productName').value = p.productName;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productTypeId').value = p.productTypeId || 1;
    document.getElementById('productImageUrl').value = p.imageUrl || '';
    document.getElementById('productDescription').value = p.description || '';
    document.getElementById('productModalTitle').textContent = 'Chỉnh Sửa Sản Phẩm';
    updatePreview('productImagePreviewBox', 'productImagePreviewImg', p.imageUrl, false);
    document.getElementById('productModal').classList.add('show');
};

window.deleteProduct = async function(id) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        const res = await fetchAdminApi(`/products/${id}`, { method: 'DELETE' });
        if (res && (res.status === 200 || res.code === 200)) {
            alert('Xóa sản phẩm thành công!');
            loadProductsData();
        } else {
            alert('Xóa thất bại: ' + (res?.message || 'Không thể xóa sản phẩm này'));
        }
    }
};

window.editCinema = function(id) {
    const c = cinemasList.find(item => item.cinemasId === id);
    if (!c) return;
    document.getElementById('cinemaId').value = c.cinemasId;
    document.getElementById('cinemaName').value = c.cinemaName;
    document.getElementById('cinemaAddress').value = c.address;
    document.getElementById('cinemaHotline').value = c.hotline || '';
    document.getElementById('cinemaFax').value = c.fax || '';
    document.getElementById('cinemaImageUrl').value = c.imageUrl || '';
    document.getElementById('cinemaModalTitle').textContent = 'Chỉnh Sửa Thông Tin Rạp';
    updatePreview('cinemaImagePreviewBox', 'cinemaImagePreviewImg', c.imageUrl, false);
    document.getElementById('cinemaModal').classList.add('show');
};

window.deleteCinema = async function(id) {
    if (confirm('Bạn có chắc chắn muốn xóa rạp chiếu này?')) {
        const res = await fetchAdminApi(`/cinemas/${id}`, { method: 'DELETE' });
        if (res && (res.status === 200 || res.code === 200)) {
            alert('Xóa rạp chiếu thành công!');
            loadCinemasData();
        } else {
            alert('Xóa thất bại: ' + (res?.message || 'Không thể xóa rạp chiếu này'));
        }
    }
};

window.deleteRoom = async function(id) {
    if (confirm('Bạn có chắc chắn muốn xóa phòng chiếu này?')) {
        const res = await fetchAdminApi(`/rooms/${id}`, { method: 'DELETE' });
        if (res && (res.status === 200 || res.code === 200)) {
            alert('Xóa phòng chiếu thành công!');
            if (currentSelectedCinemaId) loadRoomsDataForCinema(currentSelectedCinemaId);
        } else {
            alert('Xóa thất bại: ' + (res?.message || 'Không thể xóa phòng chiếu này'));
        }
    }
};

window.viewInvoiceDetail = async function(id) {
    const modal = document.getElementById('invoiceDetailModal');
    const body = document.getElementById('invoiceDetailBody');
    body.innerHTML = '<p class="text-center">Đang tải chi tiết hóa đơn...</p>';
    modal.classList.add('show');

    const res = await fetchAdminApi(`/invoices/${id}/details`);
    if (res && res.data) {
        const d = res.data;
        body.innerHTML = `
            <div class="invoice-detail-view" style="font-size: 14px; line-height: 1.6;">
                <p><strong>Mã Hóa Đơn:</strong> <code>${d.invoiceId}</code></p>
                <p><strong>Mã Vé (Ticket Code):</strong> <span class="badge badge-now_showing">${d.ticketCode || 'N/A'}</span></p>
                <p><strong>Khách Hàng:</strong> ${d.customerName} (${d.emailAddress}) - SĐT: ${d.phoneNumber}</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 12px 0;">
                <p><strong>Phim:</strong> <strong style="color: #6366f1;">${d.movieTitle}</strong></p>
                <p><strong>Rạp / Phòng:</strong> ${d.cinemaName} - ${d.roomName}</p>
                <p><strong>Suất Chiếu:</strong> ${d.showDate} (${d.showTime})</p>
                <p><strong>Ghế Đã Chọn:</strong> ${d.seatNames && d.seatNames.length > 0 ? d.seatNames.join(', ') : 'Chưa chọn ghế'}</p>
                ${d.products && d.products.length > 0 ? `
                    <p style="margin-top: 10px;"><strong>Đồ Ăn Kèm:</strong></p>
                    <ul>${d.products.map(p => `<li>${p.productName} x${p.quantity} (${formatVND(p.price)})</li>`).join('')}</ul>
                ` : ''}
                <hr style="border-color: rgba(255,255,255,0.1); margin: 12px 0;">
                <p><strong>Mã Giảm Giá:</strong> ${d.discountCode || 'Không sử dụng'}</p>
                <p><strong>Phương Thức Thanh Toán:</strong> ${d.paymentMethod || 'VNPay'}</p>
                <p style="font-size: 16px;"><strong>Thành Tiền:</strong> <strong style="color: #10b981;">${formatVND(d.finalPrice)}</strong></p>
            </div>
        `;
    } else {
        body.innerHTML = '<p class="text-center text-danger">Không thể tải thông tin chi tiết hóa đơn này.</p>';
    }
};

/* Helper Formatters */
function formatVND(amount) {
    if (!amount) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
}

function formatVNDCompact(amount) {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M ₫';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'k ₫';
    return amount + ' ₫';
}

function getStatusText(status) {
    if (!status) return 'Đang chiếu';
    const s = status.toLowerCase().trim();
    if (s === 'showing' || s === 'now_showing') return 'Đang chiếu';
    if (s === 'coming_soon') return 'Sắp chiếu';
    if (s === 'stopped' || s === 'end_showing' || s === 'ended') return 'Ngừng chiếu';
    return status;
}

/* File Upload System for Movie Poster, Movie Trailer, Cinema Image, and Product Image */
function initFileUploadHandlers() {
    setupFileUploadInput('btnUploadMoviePoster', 'moviePosterFileInput', 'moviePosterLink', 'moviePosterPreviewBox', 'moviePosterPreviewImg', false);
    setupFileUploadInput('btnUploadMovieTrailer', 'movieTrailerFileInput', 'movieTrailerLink', 'movieTrailerPreviewBox', 'movieTrailerPreviewVid', true);
    setupFileUploadInput('btnUploadCinemaImage', 'cinemaImageFileInput', 'cinemaImageUrl', 'cinemaImagePreviewBox', 'cinemaImagePreviewImg', false);
    setupFileUploadInput('btnUploadProductImage', 'productImageFileInput', 'productImageUrl', 'productImagePreviewBox', 'productImagePreviewImg', false);

    setupUrlLivePreview('moviePosterLink', 'moviePosterPreviewBox', 'moviePosterPreviewImg', false);
    setupUrlLivePreview('movieTrailerLink', 'movieTrailerPreviewBox', 'movieTrailerPreviewVid', true);
    setupUrlLivePreview('cinemaImageUrl', 'cinemaImagePreviewBox', 'cinemaImagePreviewImg', false);
    setupUrlLivePreview('productImageUrl', 'productImagePreviewBox', 'productImagePreviewImg', false);
}

function setupFileUploadInput(triggerBtnId, fileInputId, urlInputId, previewBoxId, previewMediaId, isVideo) {
    const triggerBtn = document.getElementById(triggerBtnId);
    const fileInput = document.getElementById(fileInputId);
    if (!triggerBtn || !fileInput) return;

    triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.target.files[0];
        if (!file) return;

        const textSpan = triggerBtn.querySelector('.upload-btn-text');
        const originalText = textSpan ? textSpan.innerHTML : null;

        const setUrlAndPreview = (fileUrl) => {
            const urlInput = document.getElementById(urlInputId);
            if (urlInput) {
                urlInput.value = fileUrl;
                urlInput.dispatchEvent(new Event('input'));
            }
            updatePreview(previewBoxId, previewMediaId, fileUrl, isVideo);
        };

        const convertToBase64 = (f) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(f);
            });
        };

        try {
            if (textSpan) {
                textSpan.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...`;
            }

            // Đọc tệp nội bộ Data URL ngay lập tức để hiển thị preview mượt mà và chống out trang
            const localDataUrl = await convertToBase64(file);
            setUrlAndPreview(localDataUrl);

            // Thử gửi file lên server background nếu server có sẵn
            try {
                const formData = new FormData();
                formData.append('file', file);
                const token = localStorage.getItem('token');
                const headers = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });

                if (res.ok) {
                    const result = await res.json();
                    if (result && result.data && result.data.url) {
                        // Nếu server upload thành công, cập nhật URL server chuẩn
                        setUrlAndPreview(result.data.url);
                    }
                }
            } catch (netErr) {
                console.warn('Lỗi kết nối Backend upload, giữ nguyên đường dẫn tệp Data URL:', netErr);
            }
        } catch (err) {
            console.error('Lỗi upload tệp:', err);
            alert('Có lỗi xảy ra khi xử lý tệp: ' + err.message);
        } finally {
            if (textSpan && originalText) {
                textSpan.innerHTML = originalText;
            }
            fileInput.value = '';
        }
    });
}

function setupUrlLivePreview(urlInputId, previewBoxId, previewMediaId, isVideo) {
    const urlInput = document.getElementById(urlInputId);
    if (!urlInput) return;

    const handler = () => {
        const val = urlInput.value.trim();
        updatePreview(previewBoxId, previewMediaId, val, isVideo);
    };

    urlInput.addEventListener('input', handler);
    urlInput.addEventListener('change', handler);
}

function updatePreview(previewBoxId, previewMediaId, url, isVideo) {
    const box = document.getElementById(previewBoxId);
    const media = document.getElementById(previewMediaId);
    if (!box || !media) return;

    if (url && url.length > 5) {
        box.style.display = 'flex';
        if (isVideo) {
            media.src = url;
            media.load();
        } else {
            media.src = url;
        }
    } else {
        box.style.display = 'none';
        media.src = '';
    }
}
