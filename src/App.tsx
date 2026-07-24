import { useState, useCallback } from 'react';
import type { AppView, TravelEvent, ToastItem, Photo } from './types';
import { mockUser, mockEvents } from './mockData';
import { generateId } from './utils';
import { useTheme } from './hooks/useTheme';

import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CreateEventModal from './components/CreateEventModal';
import AlbumPage from './components/AlbumPage';
import Lightbox from './components/Lightbox';
import UploadModal from './components/UploadModal';
import Toast from './components/Toast';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<typeof mockUser | null>(null);
  const [view, setView] = useState<AppView>('login');
  const [events, setEvents] = useState<TravelEvent[]>(mockEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const addToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleLogin = () => {
    setUser(mockUser);
    setView('dashboard');
    addToast('success', `Xin chào, ${mockUser.name}! Đăng nhập thành công.`);
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    setSelectedEventId(null);
    setSearchQuery('');
  };

  const handleOpenEvent = (id: string) => {
    setSelectedEventId(id);
    setView('album');
    setSearchQuery('');
  };

  const handleGoHome = () => {
    setView('dashboard');
    setSelectedEventId(null);
    setSearchQuery('');
  };

  const handleCreateEvent = (event: TravelEvent) => {
    setEvents((prev) => [event, ...prev]);
    setShowCreateModal(false);
    addToast('success', `Sự kiện "${event.name}" đã được tạo thành công!`);
  };

  const handleUploaded = (photos: Photo[]) => {
    if (!selectedEventId) return;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEventId ? { ...e, photos: [...e.photos, ...photos] } : e
      )
    );
    addToast('success', `Đã tải lên ${photos.length} ảnh thành công!`);
    setShowUploadModal(false);
  };

  const handleDeletePhotos = (ids: string[]) => {
    if (!selectedEventId) return;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEventId
          ? { ...e, photos: e.photos.filter((p) => !ids.includes(p.id)) }
          : e
      )
    );
    addToast('success', `Đã xóa ${ids.length} ảnh.`);
  };

  const selectedEvent = selectedEventId ? events.find((e) => e.id === selectedEventId) : null;

  // Lightbox data
  const lightboxPhotos = selectedEvent?.photos ?? [];
  const lightboxIndex = lightboxPhotoId
    ? lightboxPhotos.findIndex((p) => p.id === lightboxPhotoId)
    : -1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Login page has its own layout */}
      {view === 'login' ? (
        <LoginPage onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />
      ) : (
        <>
          <Header
            user={user}
            onLogout={handleLogout}
            onGoHome={handleGoHome}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showSearch={view === 'dashboard' || view === 'album'}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          {view === 'dashboard' && (
            <Dashboard
              user={user!}
              events={events}
              searchQuery={searchQuery}
              onOpenEvent={handleOpenEvent}
              onCreateEvent={() => setShowCreateModal(true)}
            />
          )}

          {view === 'album' && selectedEvent && (
            <AlbumPage
              event={selectedEvent}
              user={user}
              searchQuery={searchQuery}
              onBack={handleGoHome}
              onOpenPhoto={(photoId) => setLightboxPhotoId(photoId)}
              onUpload={() => {
                if (!user) { addToast('warning', 'Vui lòng đăng nhập để tải ảnh lên.'); return; }
                setShowUploadModal(true);
              }}
              onDeletePhotos={handleDeletePhotos}
            />
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateEventModal
          existingNames={events.map((e) => e.name)}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateEvent}
        />
      )}

      {showUploadModal && selectedEvent && (
        <UploadModal
          existingPhotoNames={selectedEvent.photos.map((p) => p.name)}
          onClose={() => setShowUploadModal(false)}
          onUploaded={handleUploaded}
        />
      )}

      {lightboxPhotoId && lightboxIndex >= 0 && (
        <Lightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxPhotoId(null)}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
