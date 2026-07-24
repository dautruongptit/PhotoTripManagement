import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppView, StoragePlan, TravelEvent, ToastItem, Photo, User } from './types';
import { mockUser,mockEvents } from './mockData';
import { generateId, formatTotalSize, FREE_STORAGE_BYTES } from './utils';
import { useTheme } from './hooks/useTheme';
import { useHistoryNavigation } from './hooks/useHistoryNavigation';
import { getToken } from './lib/apiClient';
import { fetchCurrentUser, logout as apiLogout } from './lib/authApi';

import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CreateEventModal from './components/CreateEventModal';
import AlbumPage from './components/AlbumPage';
import HelpPage from './components/HelpPage';
import Lightbox from './components/Lightbox';
import UploadModal from './components/UploadModal';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import UpgradeModal from './components/UpgradeModal';
import Footer from './components/Footer';
import Toast from './components/Toast';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [view, setView] = useState<AppView>('login');
  const [events, setEvents] = useState<TravelEvent[]>(mockEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [storageLimitBytes, setStorageLimitBytes] = useState(FREE_STORAGE_BYTES);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const storageUsedBytes = useMemo(
    () => events.reduce((sum, e) => sum + e.photos.reduce((s, p) => s + p.size, 0), 0),
    [events]
  );

  const addToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Đồng bộ Dashboard/Album/Login với nút Back-Forward của trình duyệt
  const { push, replace } = useHistoryNavigation({
    onNavigate: (state) => {
      if (state.view === 'album') {
        setSelectedEventId(state.eventId);
        setView('album');
      } else if (state.view === 'dashboard') {
        setSelectedEventId(null);
        setView('dashboard');
      } else if (state.view === 'help') {
        setView('help');
      } else {
        setSelectedEventId(null);
        setView('login');
      }
      setSearchQuery('');
    },
  });

  // Khôi phục phiên đăng nhập nếu đã có token hợp lệ từ lần trước (F5, mở lại tab)
  useEffect(() => {
    const token = getToken();
    if (!token) {
      replace({ view: 'login' });
      setCheckingSession(false);
      return;
    }
    fetchCurrentUser()
      .then((restoredUser) => {
        setUser(restoredUser);
        setView('dashboard');
        replace({ view: 'dashboard' });
      })
      .catch(() => {
        // token hết hạn / không hợp lệ -> coi như chưa đăng nhập
        replace({ view: 'login' });
      })
      .finally(() => setCheckingSession(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleLogin = () => {
    setUser(mockUser);
    setView('dashboard');
    //replace({ view: 'dashboard' }); // ghi đè entry "login", back sẽ không quay lại màn login
    addToast('success', `Xin chào, ${mockUser.name}! Đăng nhập thành công.`);
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    setView('login');
    setSelectedEventId(null);
    setSearchQuery('');
    replace({ view: 'login' });
  };

  const handleOpenEvent = (id: string) => {
    setSelectedEventId(id);
    setView('album');
    setSearchQuery('');
    push({ view: 'album', eventId: id }); // tạo entry mới -> Back sẽ quay về Dashboard
  };

  const handleGoHome = () => {
    setView('dashboard');
    setSelectedEventId(null);
    setSearchQuery('');
    push({ view: 'dashboard' });
  };

  const handleOpenHelp = () => {
    setView('help');
    push({ view: 'help' });
  };

  const handleSaveProfileName = (name: string) => {
    setUser((prev) => (prev ? { ...prev, name } : prev));
    addToast('success', 'Đã cập nhật tên hiển thị.');
  };

  const handleSelectPlan = (plan: StoragePlan) => {
    setStorageLimitBytes(plan.storageGB * 1024 * 1024 * 1024);
    setShowUpgradeModal(false);
    addToast('success', `Đã nâng cấp gói ${plan.label} — ${plan.storageGB}GB lưu trữ!`);
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

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
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
            usedBytes={storageUsedBytes}
            limitBytes={storageLimitBytes}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenHelp={handleOpenHelp}
            onOpenUpgrade={() => setShowUpgradeModal(true)}
          />

          <div className="flex-1">
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
                  if (storageUsedBytes >= storageLimitBytes) {
                    addToast('warning', `Đã đầy dung lượng lưu trữ (${formatTotalSize(storageLimitBytes)}). Vui lòng nâng cấp để tiếp tục.`);
                    setShowUpgradeModal(true);
                    return;
                  }
                  setShowUploadModal(true);
                }}
                onDeletePhotos={handleDeletePhotos}
              />
            )}

            {view === 'help' && <HelpPage onBack={handleGoHome} />}
          </div>

          <Footer onOpenHelp={handleOpenHelp} />
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

      {showProfileModal && user && (
        <ProfileModal
          user={user}
          events={events}
          usedBytes={storageUsedBytes}
          limitBytes={storageLimitBytes}
          onClose={() => setShowProfileModal(false)}
          onSave={handleSaveProfileName}
          onOpenUpgrade={() => setShowUpgradeModal(true)}
        />
      )}

      {showSettingsModal && user && (
        <SettingsModal
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onClose={() => setShowSettingsModal(false)}
          onLogout={handleLogout}
          onToast={addToast}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          usedBytes={storageUsedBytes}
          limitBytes={storageLimitBytes}
          onClose={() => setShowUpgradeModal(false)}
          onSelectPlan={handleSelectPlan}
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
