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

export type AppView = 'login' | 'dashboard' | 'album';
export type SortOption = 'newest' | 'oldest' | 'name-az' | 'name-za';
