export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Photo {
  id: string;
  name: string;
  url: string;
  size: number;
  width: number;
  height: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TravelEvent {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  coverImage: string;
  photos: Photo[];
  createdBy: string;
  createdAt: string;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface StoragePlan {
  id: string;
  durationMonths: 1 | 3 | 6 | 12;
  label: string;
  storageGB: number;
  pricePerMonth: number; // VNĐ/tháng đã áp ưu đãi
  originalPricePerMonth: number; // VNĐ/tháng gốc (chưa giảm)
  totalPrice: number; // VNĐ, thanh toán 1 lần cho cả kỳ
  discountPercent: number;
  badge?: string;
}

export type AppView = 'login' | 'dashboard' | 'album' | 'help';
export type SortOption = 'newest' | 'oldest' | 'name-az' | 'name-za';
