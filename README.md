# Tích hợp Google Login vào backend Spring Boot

> ## ⚠️ ĐÃ LỖI THỜI — KHÔNG DÙNG PHẦN GOOGLE LOGIN NỮA
> Repo backend thật của bạn (`travelPhoto-API`) đã tự implement Google Login theo
> đúng chuẩn **Spring Security OAuth2 Client** (redirect flow qua
> `CustomOAuth2UserService`/`OAuth2SuccessHandler`) — tốt hơn và bảo mật hơn cách
> mẫu ở dưới (verify ID token thủ công). Frontend đã được viết lại để khớp với
> flow OAuth2 redirect thật này (xem `src/lib/authApi.ts`, `LoginPage.tsx`, `App.tsx`).
>
> Có thể **xóa 3 file `GoogleAuthController.java`, `GoogleAuthService.java`,
> `AuthDtos.java`** trong thư mục này — không còn liên quan tới backend thật.
> Phần **VNPay** (`VnpayController.java`, `VnpayService.java`) bên dưới vẫn còn
> giá trị tham khảo vì backend thật CHƯA implement thanh toán.

---

## (Lỗi thời) Google ID token — chỉ còn giá trị lịch sử, xem cảnh báo ở trên

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
4. Bật CORS cho origin của frontend (Vite dev là `http://localhost:8443`, production
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
    proxy_pass http://travelPhoto-backend:8080/api/;   # tên container backend trên dev-network
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Khi đó set `VITE_API_BASE_URL=/api` (đường dẫn tương đối) thay vì URL đầy đủ, và thêm
service backend vào `docker-compose.yml`, cùng `dev-network` với `travel-photo`.

---

# Tích hợp thanh toán VNPay (nâng cấp dung lượng)

Frontend hiện có 2 chế độ, đổi bằng `VITE_PAYMENT_MODE` trong `.env`:
- `mock` (mặc định): mô phỏng toàn bộ màn hình VNPay ngay trong trình duyệt, KHÔNG gọi
  backend — dùng để dựng UI khi chưa có tài khoản merchant VNPay thật.
- `real`: gọi backend theo contract bên dưới, chuyển hướng (redirect) toàn trang sang
  VNPay thật.

## Đăng ký tài khoản merchant VNPay

1. Đăng ký tài khoản thử nghiệm (sandbox) tại https://sandbox.vnpayment.vn/devreg/
2. Lấy `vnp_TmnCode` (mã website) và `vnp_HashSecret` (secret key) — điền vào
   `application.yml` (xem `application.yml.snippet`).
3. Merchant thật (production) cần đăng ký chính thức với VNPay, có hợp đồng.

## 3 endpoint cần thêm vào backend

### 1. `POST /api/payments/vnpay/create-payment`
Request: `{ "planId": "plan-6m" }`
Response: `{ "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...", "orderId": "PT..." }`

Backend tạo `orderId`, lưu đơn hàng trạng thái `PENDING` vào DB, dùng
`VnpayService.createPaymentUrl(...)` để build URL có chữ ký HMAC-SHA512 (bắt buộc làm
ở backend vì cần `hash-secret`, không được lộ ra frontend). Frontend nhận `paymentUrl`
rồi `window.location.href = paymentUrl` — theo đúng yêu cầu kỹ thuật của VNPay (không
dùng iframe/popup).

### 2. `GET /api/payments/vnpay/return?vnp_...`
VNPay redirect trình duyệt người dùng về `vnp.return-url` (đã khai báo lúc tạo link)
kèm theo query string. Trang FE tại route đó gọi nguyên văn endpoint này (forward cả
query string) để lấy kết quả hiển thị cho người dùng ngay. Chỉ dùng để HIỂN THỊ —
không phải nguồn xác nhận cuối cùng để cộng dung lượng (xem mục IPN bên dưới).

### 3. `GET /api/payments/vnpay/ipn?vnp_...` (quan trọng nhất)
Khai báo URL này trong hồ sơ merchant trên cổng VNPay ("Instant Payment Notification").
VNPay gọi **trực tiếp server-to-server**, độc lập với trình duyệt người dùng — kể cả
khi người dùng tắt trình duyệt giữa chừng, đơn hàng vẫn được xác nhận đúng. Đây là nơi
DUY NHẤT nên thực sự cộng dung lượng lưu trữ cho user (nhớ xử lý idempotent — kiểm tra
đơn hàng đã xử lý hay chưa trước khi cộng, tránh cộng trùng nếu VNPay gọi lại nhiều lần).

**Lưu ý khi dev:** endpoint IPN phải public ra internet được — dùng ngrok hoặc
Cloudflare Tunnel (bạn đã có sẵn cách dùng Cloudflare Tunnel từ trước) để VNPay gọi được
vào máy dev/server nhà bạn.

## Ráp vào project

Copy `VnpayService.java`, `VnpayController.java` vào package thật, nối
`OrderRepository`/`PlanPricingService` (2 interface placeholder trong file) với bảng
đơn hàng + gói cước thật trong Oracle DB của bạn. Thêm cấu hình `vnpay.*` vào
`application.yml`.

Khi FE ở chế độ `real`, cần thêm 1 route/trang tại đúng path đã khai báo trong
`vnp.return-url` (vd `/payment/vnpay-return`) để đọc query string và gọi
`verifyVnpayReturn()` từ `src/lib/paymentApi.ts` — hiện App.tsx đã xử lý sẵn logic này
ở mức gốc (`window.location.search`), bạn chỉ cần đảm bảo `return-url` trỏ đúng về
domain frontend deploy thật.

