# PhotoTripManagement (TripAlbum)

Ứng dụng quản lý album ảnh du lịch — React 19 + Vite + Tailwind CSS v4 (frontend),
kết nối backend Spring Boot riêng qua Google Login.

## 1. Yêu cầu môi trường

- Node.js 20+
- npm (hoặc pnpm)
- Docker + Docker Compose (nếu muốn chạy bằng container)

## 2. Cài đặt & chạy dev

```bash
npm install
cp .env.example .env   # rồi sửa VITE_GOOGLE_CLIENT_ID / VITE_API_BASE_URL nếu cần
npm run dev
```

Mặc định chạy ở `http://localhost:5173`, tự mở ra ngoài mạng LAN nhờ `--host 0.0.0.0`.

### Biến môi trường (`.env`)

| Biến | Ý nghĩa | Mặc định |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID lấy từ Google Cloud Console | giá trị giả, cần thay trước khi dùng thật |
| `VITE_API_BASE_URL` | URL gốc backend Spring Boot | `http://localhost:8080/api` |

## 3. Chế độ sáng / tối (Dark mode)

- Bấm icon mặt trời/mặt trăng ở góc phải Header (đã đăng nhập) hoặc góc phải màn hình
  đăng nhập.
- Lựa chọn được lưu vào `localStorage` (`phototrip-theme`), lần đăng nhập sau vẫn giữ
  nguyên. Lần đầu mở app sẽ theo cấu hình sáng/tối của hệ điều hành.
- Cơ chế: class `dark` gắn trên thẻ `<html>`, dùng Tailwind v4 `@custom-variant dark`
  (xem `src/hooks/useTheme.ts` và `src/index.css`).

## 4. Đăng nhập bằng Google

- Nút "Tiếp tục với Google" ở màn hình Login dùng Google Identity Services (script load
  trong `index.html`), lấy ID token rồi gửi lên backend.
- Contract API backend cần cung cấp:
  - `POST /api/auth/google` — body `{ "idToken": "..." }` → trả `{ "token", "user" }`
  - `GET /api/auth/me` (kèm `Authorization: Bearer <token>`) → khôi phục phiên khi F5
- Token JWT nội bộ lưu ở `localStorage` (`phototrip-token`), tự động gắn vào mọi request
  qua `src/lib/apiClient.ts`.
- Code tham khảo để tích hợp vào backend Spring Boot hiện có: xem thư mục
  [`backend-reference/`](./backend-reference/README.md).

**Trước khi dùng thật:** đổi `VITE_GOOGLE_CLIENT_ID` trong `.env` (frontend) và
`google.client-id` trong `application.yml` (backend) thành cùng một Client ID thật lấy
từ Google Cloud Console (Client ID hiện tại trong `.env.example` chỉ để dựng giao diện).

## 5. Build production

```bash
npm run build      # ra thư mục dist/
npm run preview    # xem thử bản build
```

## 6. Chạy bằng Docker

```bash
docker network create dev-network 2>/dev/null || true
docker compose up -d --build
```

- App chạy ở `http://localhost:8080` (Nginx phục vụ file tĩnh đã build).
- Xem log: `docker compose logs -f phototrip`
- Dừng: `docker compose down`

Chi tiết cấu hình: `Dockerfile` (build 2 giai đoạn Node → Nginx), `nginx.conf` (SPA
fallback về `index.html`), `docker-compose.yml` (network `dev-network`).

### Kết nối với backend khi deploy bằng Docker

Có 2 cách:

1. **CORS**: backend cho phép origin của frontend, `VITE_API_BASE_URL` trỏ thẳng URL
   backend (vd `http://100.102.72.31:9000/api`).
2. **Reverse proxy qua Nginx** (khuyên dùng, khỏi lo CORS): thêm `location /api/` proxy
   sang container backend trong `nginx.conf`, set `VITE_API_BASE_URL=/api`. Xem ví dụ
   trong `backend-reference/README.md`.

## 7. Cấu trúc thư mục chính

```
src/
  components/       # UI: Header, Dashboard, LoginPage, AlbumPage, Lightbox, ...
  hooks/            # useTheme (dark mode), useGoogleSignInButton
  lib/              # apiClient.ts (gọi API + JWT), authApi.ts (đăng nhập/đăng xuất)
  types.ts          # Kiểu dữ liệu dùng chung (User, Photo, TravelEvent, ...)
  mockData.ts       # Dữ liệu mẫu cho events/photos (chưa nối backend cho phần album)
backend-reference/  # Code Java tham khảo để ráp Google Login vào backend Spring Boot
Dockerfile, nginx.conf, docker-compose.yml   # Deploy bằng Docker
```

## 8. Trạng thái tích hợp backend

| Tính năng | Trạng thái |
|---|---|
| Đăng nhập Google | Đã nối API thật (`/api/auth/google`, `/api/auth/me`) |
| Sự kiện / Album / Ảnh | Vẫn dùng `mockData.ts`, **chưa** gọi backend |

Khi bạn xây tiếp API cho events/album/upload ảnh ở backend, làm tương tự cách đã làm
với auth: thêm hàm gọi API trong `src/lib/`, thay các `setEvents`/`setUser` mock trong
`App.tsx` bằng gọi API thật qua `apiFetch`.
