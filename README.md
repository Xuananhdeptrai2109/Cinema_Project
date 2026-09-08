# Cinema Management System (CineMax) 🎬

Hệ thống quản lý và đặt vé xem phim trực tuyến — cho phép người dùng tra cứu lịch chiếu, chọn rạp, chọn ghế theo sơ đồ real-time, áp dụng mã giảm giá và thanh toán trực tuyến qua cổng VNPay.

---

## 🚀 Tech Stack

| Thành phần | Công nghệ | Mô tả |
|---|---|---|
| **Backend** | Java 21 + Spring Boot 3.x | RESTful API, Lombok, Spring Data JPA |
| **Security** | Spring Security + JWT | Phân quyền Token Stateless (Customer / Admin) |
| **Frontend** | HTML5, CSS3, Vanilla JS (ES Modules) | Giao diện Cine Dark Mode, Responsive, Multi-Page |
| **Database** | MySQL 8.x | 20+ Bảng, Stored Procedures, Triggers, Views |
| **Payment** | VNPay Sandbox Integration | Tích hợp thanh toán trực tuyến & IPN Webhook |
| **Email** | Spring Boot Starter Mail | Gửi thông báo vé & xác nhận đơn hàng |
| **Build Tool** | Maven 3.8+ | Quản lý dependency & build backend |

---

## 📁 Cấu trúc dự án

```
Cinema_Project/
├── backend/                           # Spring Boot REST API
│   ├── src/main/java/com/cinema/
│   │   ├── config/                    # SecurityConfig, AppConfig, WebConfig
│   │   ├── security/                  # JwtFilter, JwtUtil, CustomUserDetailsService
│   │   └── modules/                   # Thiết kế theo mô hình Feature/Domain Modules
│   │       ├── auth/                  # Đăng ký, Đăng nhập, JWT Token
│   │       ├── booking/               # Đặt vé, Hóa đơn, Thanh toán VNPay, Sản phẩm đi kèm
│   │       ├── cinema/                # Quản lý Rạp chiếu & Tỉnh/Thành phố
│   │       ├── discount/              # Quản lý & kiểm tra mã giảm giá
│   │       ├── home/                  # API trang chủ (Phim hot, Banner)
│   │       ├── movie/                 # Phim, Thể loại, Diễn viên, Đạo diễn, Bình luận
│   │       ├── room/                  # Phòng chiếu & Định dạng chiếu
│   │       ├── seat/                  # Sơ đồ ghế, Loại ghế & Khóa ghế tạm thời
│   │       ├── showtime/              # Lịch chiếu theo rạp & phim
│   │       └── user/                  # Thông tin người dùng & Lịch sử đặt vé
│   ├── src/main/resources/
│   │   ├── application.properties     # Cấu hình Spring Boot & VNPay
│   │   └── application.properties.example
│   ├── .env.example                   # Khai báo các biến môi trường
│   └── pom.xml                        # Dependencies & Maven build
│
├── frontend/                          # Giao diện Người dùng (Vanilla Multi-Page App)
│   ├── pages/                         # Các trang HTML độc lập
│   │   ├── home.html                  # Trang chủ (Phim đang chiếu, sắp chiếu, rạp)
│   │   ├── movies.html                # Danh sách phim & Lọc theo thể loại
│   │   ├── movie.html                 # Chi tiết phim & Đánh giá/Bình luận
│   │   ├── seat.html                  # Sơ đồ chọn ghế trực quan
│   │   ├── booking.html               # Xác nhận thông tin đặt vé & Đồ ăn/thức uống
│   │   ├── payment.html               # Trang thanh toán VNPay
│   │   ├── vnpay-return.html          # Trang kết quả trả về từ VNPay
│   │   ├── profile.html               # Trang cá nhân & Lịch sử đặt vé
│   │   ├── login.html                 # Đăng nhập
│   │   ├── register.html              # Đăng ký tài khoản
│   │   └── forgot-password.html       # Quên mật khẩu
│   ├── css/                           # Tệp kiểu dáng CSS riêng cho từng trang
│   └── js/
│       ├── api/                       # Đóng gói các hàm gọi API (Axios / Fetch)
│       └── main/                      # Logic tương tác DOM & render cho từng trang
│
├── cinema.sql                         # Schema + Dữ liệu mẫu + Stored Procedures + Triggers
├── .gitignore
└── README.md
```

---

## ⚙️ Yêu cầu môi trường

- **Java Development Kit (JDK):** 21 trở lên
- **Web Server:** Live Server (Extension VS Code), Nginx hoặc HTTP Server tĩnh bất kỳ
- **Database:** MySQL Server 8.x
- **Build Tool:** Apache Maven 3.8+

---

## 🛠️ Cài đặt & Chạy ứng dụng

### 1. Clone Repository

```bash
git clone https://github.com/Xuananhdeptrai2109/Cinema_Project.git
cd Cinema_Project
```

### 2. Thêm Cấu hình Database & Biến Môi Trường

Import file cơ sở dữ liệu `cinema.sql` vào MySQL:

```bash
mysql -u root -p < cinema.sql
```

Tạo file `.env` tại thư mục `backend/` dựa trên `backend/.env.example` và điền thông tin kết nối:

```env
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_email_app_password
```

### 3. Chạy Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```
*(Hoặc `mvn spring-boot:run` nếu bạn đã cài Maven trên máy)*

- API Server sẽ khởi chạy tại: **`http://localhost:8080`**

### 4. Chạy Frontend

Vì Frontend được xây dựng bằng thuần HTML/CSS/JS (ES Modules):
- Mở tệp `frontend/pages/home.html` bằng extension **Live Server** trong VS Code hoặc mở qua Web Server tĩnh bất kỳ (địa chỉ mặc định thường là `http://127.0.0.1:5500/frontend/pages/home.html` hoặc `http://localhost:63342/...`).

---

## 🔑 Các Endpoint API chính

### 1. Phân quyền & Tài khoản (`/api/auth`)
- `POST /api/auth/register` : Đăng ký tài khoản mới.
- `POST /api/auth/login` : Đăng nhập & Nhận JWT Token.

### 2. Phim & Lịch chiếu (`/api/movies`, `/api/showtimes`)
- `GET /api/movies` : Lấy danh sách phim (Đang chiếu / Sắp chiếu).
- `GET /api/movies/{id}` : Lấy chi tiết thông tin phim & Đánh giá.
- `GET /api/showtimes` : Tra cứu lịch chiếu theo Phim, Rạp và Ngày.

### 3. Ghế & Đặt vé (`/api/showtime-seats`, `/api/booking`, `/api/payment`)
- `GET /api/showtime-seats/{showtimeId}` : Lấy sơ đồ ghế & trạng thái ghế real-time theo suất chiếu.
- `POST /api/payment/vnpay-create` : Khởi tạo giao dịch thanh toán qua cổng VNPay.
- `GET /api/payment/vnpay-callback` : Nhận và xử lý kết quả phản hồi từ VNPay.

---

## ⚡ Kiến trúc Xử lý Nghiệp vụ & Database (Services Architecture)

Nghiệp vụ giữ ghế, đặt vé và thanh toán được đóng gói và xử lý trực tiếp tại tầng **Spring Boot Services**:

| Thành phần | Lớp Service | Mô tả |
|---|---|---|
| **Giữ ghế (Seat Holding)** | `BookingService` | Kiểm tra trạng thái ghế trống, khóa giữ ghế sang trạng thái `holding` và ngăn chặn trùng lặp đặt ghế. |
| **Xác nhận thanh toán** | `PaymentService` | Xử lý callback VNPay, trừ Coin tích lũy, đổi trạng thái ghế sang `booked`, tạo ticket code và gửi email. |
| **Giải phóng ghế** | `PaymentService` | Tự động chuyển ghế về `available` khi giao dịch thanh toán thất bại hoặc hủy đơn. |
| **Bảo mật & Mã hóa** | `VNPayService` | Tạo URL thanh toán bảo mật với mã hóa HMAC-SHA512 và xác thực chữ ký callback. |

---

## 👥 Tài khoản Thử nghiệm (Mặc định)

| Vai trò | Username | Password | Email
|---|---|---|
| **Super Admin** | `admin` | `123456` | `admin@gmail.com`
| **Khách hàng** | `userA` | `123456` | `nguyenvana@gmail.com`

---

## 📝 License & Ghi chú

- **Bảo mật:** Không commit file `.env` chứa mật khẩu thực tế lên Git repository.
- **Thanh toán Sandbox:** Tích hợp VNPay đang sử dụng môi trường Sandbox (Test).