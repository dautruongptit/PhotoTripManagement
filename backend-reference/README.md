# Tích hợp Google Login vào backend Spring Boot

Frontend (React) hiện gọi 2 endpoint sau. Bạn cần thêm chúng vào backend Spring Boot
hiện có của mình (ráp vào package đang có, không cần tạo project mới).

## 1. `POST /api/auth/google`

Frontend gửi lên **Google ID token** (JWT do Google Identity Services trả về ở trình
duyệt sau khi người dùng chọn tài khoản Google) — KHÔNG phải access token.

Request:
```json
{ "idToken": "eyJhbGciOi..." }
```

Backend cần:
1. Verify `idToken` với Google (chữ ký, `aud` = Client ID, `exp` chưa hết hạn).
2. Lấy `sub` (Google user id), `email`, `name`, `picture` từ token đã verify.
3. Tìm user theo `googleId` (hoặc `email`) trong DB — nếu chưa có thì tạo mới.
4. Phát hành JWT nội bộ của hệ thống (không dùng lại token Google cho các API khác).
5. Trả về:
```json
{
  "token": "<app-jwt>",
  "user": {
    "id": "u123",
    "name": "Nguyễn Văn A",
    "email": "a@gmail.com",
    "avatarUrl": "https://lh3.googleusercontent.com/..."
  }
}
```

Lỗi (token Google không hợp lệ/hết hạn) → trả `401` với body `{ "message": "..." }`.

## 2. `GET /api/auth/me`

Header: `Authorization: Bearer <app-jwt>`

Dùng để khôi phục phiên đăng nhập khi người dùng F5 trang. Trả về cùng shape `user`
như trên (không bọc trong `{ user: ... }`, trả thẳng object). `401` nếu token hết hạn/không hợp lệ.

## Các bước ráp vào project Spring Boot hiện có

1. Thêm dependency verify Google ID token:
   ```xml
   <dependency>
     <groupId>com.google.api-client</groupId>
     <artifactId>google-api-client</artifactId>
     <version>2.7.0</version>
   </dependency>
   ```
2. Copy 4 file trong thư mục này vào đúng package tương ứng trong project của bạn
   (đổi lại package name theo project thật):
   - `GoogleAuthController.java`
   - `GoogleAuthService.java`
   - `AuthDtos.java`
   - `application.yml.snippet` — thêm `google.client-id` vào config hiện có
3. Nếu backend đã có JWT filter/Spring Security sẵn (rất có thể bạn đã có, vì banking
   project của bạn thường dùng session/token filter) — dùng lại service tạo JWT hiện
   có thay vì phần `issueAppJwt` mẫu trong `GoogleAuthService.java`.
4. Bật CORS cho origin của frontend (Vite dev là `http://localhost:5173`, production
   là domain thật bạn deploy) trên riêng 2 endpoint `/api/auth/**` hoặc toàn bộ `/api/**`
   tùy cấu hình Security hiện có.
5. Đổi `VITE_GOOGLE_CLIENT_ID` trong `.env` của frontend và `google.client-id` trong
   `application.yml` của backend thành **cùng một** Client ID thật (lấy ở Google Cloud
   Console > APIs & Services > Credentials > OAuth 2.0 Client IDs > Web application).
   Client ID hiện tại trong `.env` chỉ là giá trị giả để dựng giao diện.

## Nếu backend chưa có JWT filter sẵn (tối thiểu)

Nếu project Spring Boot của bạn chưa có sẵn cơ chế đọc `Authorization: Bearer <token>`
để set `SecurityContext`, cần thêm 1 `OncePerRequestFilter` đơn giản: đọc header, verify
chữ ký JWT nội bộ (không phải Google token), set `Authentication` vào `SecurityContext`
nếu hợp lệ, cho request đi tiếp (không hợp lệ thì bỏ qua, để Spring Security tự trả 401
với các endpoint yêu cầu đăng nhập). Đăng ký filter này trước
`UsernamePasswordAuthenticationFilter` trong `SecurityFilterChain`.

## Tuỳ chọn: tránh CORS bằng reverse proxy Nginx (khuyên dùng khi deploy)

Ở bước Docker trước, frontend được Nginx phục vụ tĩnh trên port 8080. Bạn có thể cho
Nginx proxy luôn `/api/*` sang container backend, để frontend và backend dùng chung
origin — khỏi cần cấu hình CORS:

```nginx
location /api/ {
    proxy_pass http://phototrip-backend:8080/api/;   # tên container backend trên dev-network
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Khi đó set `VITE_API_BASE_URL=/api` (đường dẫn tương đối) thay vì URL đầy đủ, và thêm
service backend vào `docker-compose.yml`, cùng `dev-network` với `phototrip`.

