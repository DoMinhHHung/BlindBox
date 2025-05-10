# BlindBox Auth Service

Auth Service là một microservice trong hệ thống BlindBox, chịu trách nhiệm quản lý xác thực và phân quyền người dùng. Service này cung cấp các chức năng đăng ký, đăng nhập, quên mật khẩu với bảo mật thông qua hệ thống OTP gửi qua email.

## Tính năng chính

- **Đăng ký người dùng**: Xác thực OTP qua email trước khi tạo tài khoản
- **Đăng nhập**: Hỗ trợ đăng nhập bằng email hoặc số điện thoại
- **Quên mật khẩu**: Đặt lại mật khẩu với xác thực OTP
- **Phân quyền**: Phân biệt quyền người dùng thường và quản trị viên
- **JWT Authentication**: Bảo mật API bằng JSON Web Token

## Cài đặt và chạy

### Yêu cầu

- Node.js (v16 hoặc cao hơn)
- MongoDB (hoặc MongoDB Atlas)

### Các bước cài đặt

1. **Clone repository và cài đặt dependencies**

```bash
cd service/auth-service
npm install
```

2. **Cấu hình môi trường**

Tạo file `.env` trong thư mục gốc của auth-service với nội dung:

```
# Config
ATLAS_URL=mongodb+srv://<username>:<password>@<cluster_url>/blindbox?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=12h
PORT=2003

# Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM_NAME=BlindBox
EMAIL_FROM_ADDRESS=your_email@gmail.com
```

3. **Khởi động service**

```bash
npm run dev
```

Service sẽ chạy tại `http://localhost:2003`

## Cấu trúc thư mục

```
auth-service/
│
├── src/
│   ├── controllers/
│   │   └── userController.js      # Xử lý logic nghiệp vụ
│   │
│   ├── middlewares/
│   │   └── authMiddleware.js      # Middleware xác thực token
│   │
│   ├── models/
│   │   ├── authModel.js           # Schema cho xác thực/OTP
│   │   └── userModel.js           # Schema cho thông tin người dùng
│   │
│   ├── routes/
│   │   └── userRoutes.js          # Định nghĩa API endpoints
│   │
│   └── index.js                   # Entry point
│
└── package.json
```

## API Endpoints

### Đăng ký người dùng

**1. Gửi OTP đăng ký**

```
POST /api/auth/send-otp
Content-Type: application/json

{
    "email": "example@gmail.com"
}
```

Response (200 OK):

```json
{
  "message": "OTP sent to your email for verification",
  "email": "example@gmail.com"
}
```

**2. Đăng ký với OTP**

```
POST /api/auth/register
Content-Type: application/json

{
    "firstName": "John",
    "lastName": "Doe",
    "email": "example@gmail.com",
    "phone": "0123456789",
    "birthDate": "1990-01-01",
    "address": "123 Street, City",
    "password": "Password123",
    "otp": "123456"
}
```

Response (201 Created):

```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "firstName": "John",
    "lastName": "Doe",
    "email": "example@gmail.com",
    "phone": "0123456789",
    "role": "user"
  }
}
```

### Đăng nhập

```
POST /api/auth/login
Content-Type: application/json

{
    "identifier": "example@gmail.com",
    "password": "Password123"
}
```

Response (200 OK):

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "firstName": "John",
    "lastName": "Doe",
    "email": "example@gmail.com",
    "phone": "0123456789",
    "role": "user"
  }
}
```

### Quên mật khẩu

**1. Yêu cầu OTP đặt lại mật khẩu**

```
POST /api/auth/forgot-password
Content-Type: application/json

{
    "email": "example@gmail.com"
}
```

Response (200 OK):

```json
{
  "message": "Password reset OTP sent to your email",
  "email": "example@gmail.com"
}
```

**2. Đặt lại mật khẩu với OTP**

```
POST /api/auth/reset-password
Content-Type: application/json

{
    "email": "example@gmail.com",
    "otp": "123456",
    "newPassword": "NewPassword123"
}
```

Response (200 OK):

```json
{
  "message": "Password reset successful"
}
```

### Xác thực tài khoản

```
POST /api/auth/verify-account
Content-Type: application/json

{
    "email": "example@gmail.com",
    "otp": "123456"
}
```

Response (200 OK):

```json
{
  "message": "Email verified successfully",
  "verified": true
}
```

## Bảo mật API

Để bảo vệ API endpoint yêu cầu xác thực, thêm JWT token vào header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Cơ sở dữ liệu

Auth Service sử dụng hai collection chính trong MongoDB:

### Collection `users`

```javascript
{
  "_id": ObjectId("..."),
  "firstName": String,
  "lastName": String,
  "email": String,
  "phone": String,
  "password": String, // đã được mã hóa
  "birthDate": Date,
  "address": String,
  "role": String, // "user" hoặc "admin"
  "createdAt": Date,
  "updatedAt": Date
}
```

### Collection `auths`

```javascript
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."), // tham chiếu đến user (có thể null khi chưa đăng ký)
  "email": String,
  "otp": String, // mã OTP 6 số
  "otpExpiresAt": Date, // thời gian hết hạn OTP
  "resetPasswordToken": String,
  "resetPasswordExpires": Date,
  "verifyEmailToken": String,
  "verifyEmailExpires": Date,
  "createdAt": Date,
  "updatedAt": Date
}
```

## Testing với Postman

Bạn có thể kiểm tra tất cả API của Auth Service bằng collection Postman sau:

1. Tải [Postman Collection](https://www.postman.com/collections/)
2. Import vào Postman
3. Cập nhật base URL (mặc định là `http://localhost:2003`)
4. Chạy các request theo thứ tự đã được sắp xếp

## Xử lý lỗi phổ biến

1. **Lỗi kết nối MongoDB**: Kiểm tra URL kết nối trong file .env
2. **Lỗi gửi email**: Đảm bảo cấu hình email và mật khẩu ứng dụng là chính xác
3. **Invalid token**: Token JWT đã hết hạn, hãy đăng nhập lại

## Biến môi trường

| Biến                 | Mô tả                                      |
| -------------------- | ------------------------------------------ |
| `ATLAS_URL`          | URL kết nối MongoDB Atlas                  |
| `JWT_SECRET`         | Khóa bí mật để ký JWT                      |
| `JWT_EXPIRES_IN`     | Thời gian hết hạn của JWT (ví dụ: 12h, 7d) |
| `PORT`               | Cổng chạy service                          |
| `EMAIL_HOST`         | Host của SMTP server                       |
| `EMAIL_PORT`         | Port của SMTP server                       |
| `EMAIL_USER`         | Email đăng nhập SMTP                       |
| `EMAIL_PASS`         | Mật khẩu (hoặc mật khẩu ứng dụng)          |
| `EMAIL_FROM_NAME`    | Tên người gửi hiển thị                     |
| `EMAIL_FROM_ADDRESS` | Địa chỉ email người gửi                    |

## Phát triển tiếp theo

Các tính năng dự kiến sẽ phát triển:

- Xác thực 2 yếu tố (2FA)
- OAuth với các dịch vụ bên thứ ba (Google, Facebook)
- Quản lý phiên đăng nhập
- Blacklist token
- Tự động làm mới token
