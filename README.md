# 📦 BlindBox E-commerce Platform

**BlindBox** là nền tảng thương mại điện tử chuyên về bán hàng **BlindBox**, thời trang, giày dép, phụ kiện. Hệ thống được thiết kế theo kiến trúc **microservice hiện đại**, giúp dễ dàng mở rộng và bảo trì từng thành phần độc lập.

---

## 🏗️ Kiến trúc tổng quan

Hệ thống được chia thành các microservice:

- **Auth Service**: Xác thực người dùng, đăng ký, đăng nhập, OTP, quên mật khẩu
- **Product Service**: Quản lý sản phẩm, danh mục, tồn kho
- **Order Service**: Xử lý đơn hàng, thanh toán, lịch sử mua hàng
- **User Service**: Quản lý thông tin cá nhân, địa chỉ, phân quyền
- **Admin Service**: Dành riêng cho quản trị viên quản lý toàn hệ thống
- **Gateway**: API Gateway làm điểm truy cập duy nhất cho tất cả dịch vụ

---

## 👥 Phân quyền hệ thống

| Vai trò        | Quyền truy cập                                                            |
| -------------- | ------------------------------------------------------------------------- |
| **Khách hàng** | Đăng ký, đăng nhập, mua BlindBox, theo dõi đơn hàng                       |
| **Người bán**  | Quản lý sản phẩm, theo dõi đơn hàng, xem thống kê doanh thu               |
| **Admin**      | Quản lý người dùng, danh mục, phê duyệt seller, xem báo cáo toàn hệ thống |

---

## ✨ Tính năng theo vai trò

### 🧑‍💼 Khách hàng

- Đăng ký tài khoản với OTP qua email
- Đăng nhập bằng email hoặc số điện thoại
- Quên mật khẩu với OTP
- Xem danh sách sản phẩm, tìm kiếm theo từ khóa và danh mục
- Mua hộp BlindBox, thanh toán đơn hàng
- Theo dõi trạng thái đơn hàng
- Xem lịch sử đơn hàng, sản phẩm đã nhận

### 🛍️ Người bán (Store/Seller)

- Quản lý sản phẩm: thêm, sửa, xóa
- Quản lý tồn kho và giá bán
- Theo dõi đơn hàng của cửa hàng
- Xem thống kê doanh số theo ngày/tháng

### 🛠️ Quản trị viên

- Quản lý người dùng và người bán
- Quản lý và phân loại danh mục sản phẩm
- Phê duyệt tài khoản người bán
- Xem báo cáo doanh thu, lượng đơn hàng, thống kê người dùng

---

## 🧾 Cơ sở dữ liệu

Hệ thống sử dụng **MongoDB Atlas** với các collection chính như sau:

- `users`: Thông tin người dùng, quyền hạn, xác thực OTP
- `products`: Danh sách sản phẩm, tồn kho, giá, loại
- `orders`: Thông tin đơn hàng, trạng thái, thanh toán
- `categories`: Danh mục sản phẩm
- `sellers`: Hồ sơ người bán, cửa hàng
- `blindboxes`: Các hộp bí ẩn, tỷ lệ phần thưởng
- `transactions`: Lịch sử thanh toán
- `reports`: Tổng hợp báo cáo (dành cho admin)

---

## 🔧 Giao tiếp giữa các dịch vụ

Các service giao tiếp với nhau thông qua:

- **HTTP REST API** (nội bộ)
- **Message Queue** (ví dụ: RabbitMQ hoặc Kafka) để xử lý sự kiện như "mua hộp", "xác nhận đơn hàng", "cập nhật tồn kho"

---

## ⚙️ Công nghệ sử dụng

- **Ngôn ngữ**: JavaScript / TypeScript
- **Backend**: Node.js + Express
- **Cơ sở dữ liệu**: MongoDB Atlas
- **Xác thực**: JWT, OTP qua Email
- **API Gateway**: Express Gateway hoặc custom gateway
- **Frontend** _(đang phát triển)_: React.js hoặc Vue.js (SPA, Tailwind CSS)

---

## 📌 Giấy phép

MIT License

---

## ✍️ Tác giả

[Đỗ Minh Hùng]
