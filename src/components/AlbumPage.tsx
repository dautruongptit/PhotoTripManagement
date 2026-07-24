import { useState, useMemo, useRef } from 'react';
import type { TravelEvent, User, Photo, SortOption } from '../types';
import { formatFileSize, formatDate, formatDateRange } from '../utils';

interface Props {
  event: TravelEvent;
  user: User | null;
  searchQuery: string;
  onBack: () => void;
  onOpenPhoto: (photoId: string) => void;
  onUpload: () => void;
  onDeletePhotos: (ids: string[]) => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Mới nhất',
  oldest: 'Cũ nhất',
  'name-az': 'Tên A–Z',
  'name-za': 'Tên Z–A',
};

export default function AlbumPage({ event, user, searchQuery, onBack, onOpenPhoto, onUpload, onDeletePhotos }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortOption>('newest');
  const [filterQuery, setFilterQuery] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const q = filterQuery || searchQuery;

  const photos = useMemo(() => {
    let list = [...event.photos];
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    list.sort((a, b) => {
      switch (sort) {
        case 'newest': return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'oldest': return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case 'name-az': return a.name.localeCompare(b.name);
        case 'name-za': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });
    return list;
  }, [event.photos, q, sort]);

  const totalSize = event.photos.reduce((s, p) => s + p.size, 0);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(photos.map((p) => p.id)));
  const clearSelect = () => setSelected(new Set());

  const handleDelete = () => {
    onDeletePhotos(Array.from(selected));
    clearSelect();
    setShowDeleteConfirm(false);
  };

  return (
    <main className="min-h-screen">
      {/* Breadcrumb + event header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <button onClick={onBack} className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Trang chủ
            </button>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">{event.name}</span>
          </div>

          {/* Event info */}
          <div className="flex items-start gap-5">
            <div className="hidden sm:block w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
              <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{event.name}</h1>
              {event.description && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2 max-w-xl">{event.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity=".3"/>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  {event.location}
                </span>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  {formatDateRange(event.startDate, event.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {event.photos.length} ảnh · {formatFileSize(totalSize)}
                </span>
              </div>
            </div>
            {user && (
              <button
                onClick={onUpload}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm shadow-sm hover:shadow-lg hover:shadow-blue-200 flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <polyline points="17 8 12 3 7 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="hidden sm:inline">Tải ảnh lên</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Tìm tên ảnh…"
              className="w-full h-9 pl-9 pr-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all"
            />
            {filterQuery && (
              <button onClick={() => setFilterQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-base leading-none">×</button>
            )}
          </div>

          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setShowSortMenu((v) => !v)}
              className="flex items-center gap-1.5 h-9 px-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:border-blue-300 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {SORT_LABELS[sort]}
            </button>
            {showSortMenu && (
              <div className="slide-up absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-1 z-20">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSort(s); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${sort === s ? 'text-blue-600 font-medium bg-blue-50 dark:bg-blue-950/40' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    {SORT_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {photos.length > 0 && (
            <button
              onClick={selected.size === photos.length ? clearSelect : selectAll}
              className="h-9 px-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:border-blue-300 transition-colors"
            >
              {selected.size === photos.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          )}
        </div>

        {/* Empty state */}
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#D1D5DB" strokeWidth="1.5"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="#D1D5DB"/>
                <path d="M21 15l-5-5L5 21" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {q ? 'Không tìm thấy ảnh' : 'Chưa có ảnh nào'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {q ? `Không có ảnh nào khớp với "${q}".` : 'Tải ảnh lên để bắt đầu lưu giữ kỷ niệm chuyến đi này.'}
            </p>
            {user && !q && (
              <button
                onClick={onUpload}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Tải ảnh lên ngay
              </button>
            )}
          </div>
        ) : (
          <div className="photo-masonry">
            {photos.map((photo) => (
              <PhotoItem
                key={photo.id}
                photo={photo}
                selected={selected.has(photo.id)}
                onSelect={() => toggleSelect(photo.id)}
                onClick={() => onOpenPhoto(photo.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating selection toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl slide-up">
          <span className="text-sm font-medium">
            Đã chọn: <strong>{selected.size} ảnh</strong>
          </span>
          <div className="w-px h-5 bg-white/20" />
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
            title="Tải xuống đã chọn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v13M8 12l4 4 4-4M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Tải xuống
          </a>
          {user && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Xóa
            </button>
          )}
          <button
            onClick={clearSelect}
            className="text-sm text-white/60 hover:text-white transition-colors ml-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="slide-up relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-5">
              Bạn có chắc muốn xóa <strong>{selected.size} ảnh</strong> đã chọn? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Hủy
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors">
                Xóa {selected.size} ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

interface PhotoItemProps {
  photo: Photo;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

function PhotoItem({ photo, selected, onSelect, onClick }: PhotoItemProps) {
  return (
    <div
      className={`photo-item relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      onClick={onClick}
    >
      <img
        src={photo.url.replace('w=1920', 'w=600')}
        alt={photo.name}
        className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-300"
        loading="lazy"
      />
      {/* Hover overlay */}
      <div className={`absolute inset-0 transition-all duration-200 ${selected ? 'bg-blue-600/20' : 'bg-black/0 group-hover:bg-black/30'}`}>
        {/* Checkbox */}
        <div
          className={`absolute top-2 left-2 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-blue-600 border-blue-600' : 'bg-white/80 border-white'}`}>
            {selected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>

        {/* Eye icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="white" strokeWidth="2"/>
              <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-white text-xs font-medium truncate">{photo.name}</p>
          <p className="text-white/70 text-[10px]">{formatFileSize(photo.size)} · {formatDate(photo.uploadedAt)}</p>
        </div>
      </div>
    </div>
  );
}
