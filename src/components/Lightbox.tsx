import { useEffect, useRef, useState, useCallback } from 'react';
import type { Photo } from '../types';
import { formatFileSize, formatDate } from '../utils';

interface Props {
  photos: Photo[];
  initialIndex: number;
  location?: string;
  photographerName?: string;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onClose: () => void;
}

const ZOOM_LEVELS = [1, 1.5, 2, 2.5];

export default function Lightbox({ photos, initialIndex, location, photographerName, selected, onToggleSelect, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [zoomStep, setZoomStep] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const stripRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const photo = photos[index];
  const isSelected = selected.has(photo.id);
  const zoomed = zoomStep > 0;

  const prev = useCallback(() => { setZoomStep(0); setIndex((i) => Math.max(0, i - 1)); }, []);
  const next = useCallback(() => { setZoomStep(0); setIndex((i) => Math.min(photos.length - 1, i + 1)); }, [photos.length]);
  const zoomIn = () => setZoomStep((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1));
  const zoomOut = () => setZoomStep((z) => Math.max(0, z - 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
      else if (e.key === 'i') setShowInfo((v) => !v);
      else if (e.key === '+' || e.key === '=') zoomIn();
      else if (e.key === '-') zoomOut();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prev, next, onClose]);

  // Scroll thumbnail strip to active thumb
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const thumb = strip.children[index] as HTMLElement;
    if (thumb) thumb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) dx > 0 ? next() : prev();
  };

  const infoItems = [
    { label: 'Kích thước', value: formatFileSize(photo.size) },
    { label: 'Ngày chụp', value: formatDate(photo.uploadedAt) },
    { label: 'Độ phân giải', value: `${photo.width} × ${photo.height}` },
    { label: 'Địa điểm', value: location || '—' },
    { label: 'Người chụp', value: photographerName || '—' },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4 px-4 sm:px-5 py-3.5 bg-black/60 backdrop-blur-sm flex-shrink-0">
        <div className="min-w-0">
          <button onClick={onClose} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-1 sm:hidden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <p className="text-white font-semibold text-base truncate max-w-[60vw]">{photo.name}</p>
          <p className="text-gray-400 text-xs mt-0.5">{index + 1} / {photos.length}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Select toggle */}
          <button
            onClick={() => onToggleSelect(photo.id)}
            className={`hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium transition-colors ${
              isSelected ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title={isSelected ? 'Bỏ chọn ảnh này' : 'Chọn ảnh này'}
          >
            {isSelected ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <div className="w-3.5 h-3.5 rounded-[3px] border-2 border-current" />
            )}
            {isSelected ? 'Đã chọn' : 'Chọn'}
          </button>

          <button
            onClick={() => setShowInfo((v) => !v)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${showInfo ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Thông tin ảnh (i)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="hidden sm:flex items-center">
            <button
              onClick={zoomOut}
              disabled={zoomStep === 0}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Thu nhỏ (-)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={zoomIn}
              disabled={zoomStep === ZOOM_LEVELS.length - 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Phóng to (+)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <a
            href={photo.url}
            download={photo.name}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            title="Tải xuống"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v13M8 12l4 4 4-4M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden sm:inline">Tải về</span>
          </a>

          <button onClick={onClose} className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main photo area */}
      <div className="flex-1 flex items-center justify-center relative overflow-auto min-h-0">
        {/* Prev */}
        {index > 0 && (
          <button
            onClick={prev}
            className="absolute left-3 z-10 w-11 h-11 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Photo */}
        <div
          className={`transition-all duration-300 ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => (zoomed ? setZoomStep(0) : zoomIn())}
        >
          <img
            key={photo.id}
            src={photo.url}
            alt={photo.name}
            className="max-w-full object-contain transition-transform duration-300"
            style={{
              maxHeight: 'calc(100vh - 220px)',
              transform: `scale(${ZOOM_LEVELS[zoomStep]})`,
            }}
            draggable={false}
          />
        </div>

        {/* Next */}
        {index < photos.length - 1 && (
          <button
            onClick={next}
            className="absolute right-3 z-10 w-11 h-11 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Bottom info bar */}
      {showInfo && (
        <div className="flex-shrink-0 bg-black/60 backdrop-blur-sm border-t border-white/10 px-4 sm:px-6 py-3 slide-up">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 max-w-screen-lg mx-auto justify-center sm:justify-start">
            {infoItems.map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <p className="text-gray-400 text-[11px]">{label}</p>
                <p className="text-white text-sm mt-0.5 truncate max-w-[160px]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thumbnail strip */}
      <div className="flex-shrink-0 bg-black/60 backdrop-blur-sm px-4 py-3">
        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto no-scrollbar justify-center"
        >
          {photos.map((ph, i) => (
            <button
              key={ph.id}
              onClick={() => { setZoomStep(0); setIndex(i); }}
              className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                i === index ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img
                src={ph.url.replace('w=1920', 'w=120')}
                alt={ph.name}
                className="w-full h-full object-cover"
              />
              {selected.has(ph.id) && (
                <div className="absolute top-1 left-1 w-3.5 h-3.5 rounded-[3px] bg-blue-600 flex items-center justify-center">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
