import { apiFetch, setToken, clearToken } from './apiClient';
import type { User } from '../types';

interface GoogleLoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  };
}

function mapUser(u: GoogleLoginResponse['user']): User {
  return { id: u.id, name: u.name, email: u.email, avatar: u.avatarUrl };
}

/**
 * Gửi Google ID token (JWT lấy từ Google Identity Services ở FE) lên backend.
 * Backend chịu trách nhiệm verify token với Google, tạo/cập nhật user,
 * rồi trả về JWT nội bộ của hệ thống + thông tin user.
 *
 * Contract kỳ vọng ở backend:
 *   POST {API_BASE_URL}/auth/google
 *   Body:    { "idToken": "<google id_token>" }
 *   200 OK:  { "token": "<app jwt>", "user": { "id", "name", "email", "avatarUrl" } }
 *   401:     { "message": "..." }  -> token Google không hợp lệ/hết hạn
 */
export async function loginWithGoogle(idToken: string): Promise<User> {
  const data = await apiFetch<GoogleLoginResponse>('/auth/google', {
    method: 'POST',
    body: { idToken },
    auth: false,
  });
  setToken(data.token);
  return mapUser(data.user);
}

/**
 * Khôi phục phiên đăng nhập khi tải lại trang, dựa trên token đã lưu.
 * Contract kỳ vọng: GET {API_BASE_URL}/auth/me (Bearer token) -> user hiện tại.
 */
export async function fetchCurrentUser(): Promise<User> {
  const u = await apiFetch<GoogleLoginResponse['user']>('/auth/me', { method: 'GET' });
  return mapUser(u);
}

export function logout(): void {
  clearToken();
}
