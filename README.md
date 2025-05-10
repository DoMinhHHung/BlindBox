# 📦 BlindBox E-commerce Platform

BlindBox là nền tảng thương mại điện tử chuyên về bán BlindBox, quần áo, giày dép và các sản phẩm thời trang. Hệ thống được thiết kế theo kiến trúc microservice hiện đại, đảm bảo khả năng mở rộng và bảo trì dễ dàng.

## 🚀 Tổng quan hệ thống

BlindBox được xây dựng với kiến trúc microservice, phân chia thành các dịch vụ độc lập có thể hoạt động và triển khai riêng biệt:

- **Auth Service**: Quản lý xác thực người dùng (đăng ký, đăng nhập, quên mật khẩu)
- **Product Service**: Quản lý sản phẩm và danh mục
- **Order Service**: Quản lý đơn hàng và thanh toán
- **Gateway**: API Gateway làm điểm truy cập trung tâm cho tất cả các dịch vụ

## 🔐 Tính năng phân quyền

### 👤 Đối với khách hàng

- Đăng ký tài khoản với xác thực OTP qua email
- Đăng nhập bằng email hoặc số điện thoại
- Quên mật khẩu với xác thực OTP
- Xem và tìm kiếm sản phẩm
- Đặt hàng và thanh toán
- Theo dõi đơn hàng

### 🛍️ Đối với cửa hàng

- Quản lý sản phẩm (thêm, sửa, xóa)
- Quản lý tồn kho
- Xử lý đơn hàng
- Thống kê doanh số

### 🛡️ Đối với quản trị viên

- Quản lý người dùng và cửa hàng
- Quản lý danh mục sản phẩm
- Phê duyệt cửa hàng
- Xem báo cáo toàn hệ thống

## 📁 Cơ sở dữ liệu

BlindBox sử dụng MongoDB Atlas làm hệ thống cơ sở dữ liệu chính. Các collection chính bao gồm:

- **users**: Thông tin người dùng và quyền
- **auths**: Thông tin xác thực và OTP
- **products**: Dữ liệu sản phẩm
- **orders**: Thông tin đơn hàng
- **categories**: Danh mục sản phẩm
- **store_profiles**: Thông tin cửa hàng

## 🔧 Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling

Ứng dụng có thể được đóng gói bằng Docker và triển khai trên nhiều nền tảng:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

## 🎨 Styling

Template sử dụng sẵn [Tailwind CSS](https://tailwindcss.com/) để bắt đầu nhanh chóng với UI hiện đại và dễ tuỳ biến. Bạn có thể thay thế hoặc kết hợp với framework CSS khác tùy ý.

> 📖 [React Router docs](https://reactrouter.com/) — Tài liệu chính thức của React Router được dùng trong frontend.

## 📦 Công nghệ sử dụng

- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT, OTP qua Email
- **Frontend** (đang phát triển): React + TailwindCSS

## 👤 Tác giả

[Đỗ Minh Hùng](https://github.com/DoMinhHHung)

## 🪪 License

MIT
