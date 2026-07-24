import { useEffect, useRef, useState, useCallback } from 'react';
import type { Photo } from '../types';
import { formatFileSize, formatDate } from '../utils';

interface Props {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const stripRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const photo = photos[index];

  const prev = useCallback(() => { setZoomed(false); setIndex((i) => Math.max(0, i - 1)); }, []);
  const next = useCallback(() => { setZoomed(false); setIndex((i) => Math.min(photos.length - 1, i + 1)); }, [photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
      else if (e.key === 'i') setShowInfo((v) => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <p className="text-white/90 text-sm font-medium truncate max-w-[200px]">{photo.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">{index + 1} / {photos.length}</span>
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
          <button
            onClick={() => setZoomed((v) => !v)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${zoomed ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Zoom"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              {zoomed
                ? <path d="m21 21-4.35-4.35M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                : <path d="m21 21-4.35-4.35M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              }
            </svg>
          </button>
          <a
            href={photo.url}
            download={photo.name}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tải xuống"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v13M8 12l4 4 4-4M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Main photo area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden min-h-0">
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
          className={`transition-all duration-300 max-w-full max-h-full ${zoomed ? 'cursor-zoom-out overflow-auto' : 'cursor-zoom-in'}`}
          onClick={() => setZoomed((v) => !v)}
          style={{ maxWidth: zoomed ? '100%' : '100%', maxHeight: '100%' }}
        >
          <img
            key={photo.id}
            src={photo.url}
            alt={photo.name}
            className={`max-w-full max-h-full object-contain transition-transform duration-300 ${zoomed ? 'scale-150' : 'scale-100'}`}
            style={{ maxHeight: 'calc(100vh - 220px)' }}
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

        {/* Info panel */}
        {showInfo && (
          <div className="absolute right-4 bottom-4 top-4 w-56 bg-black/70 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 slide-right overflow-y-auto no-scrollbar">
            <p className="text-white font-semibold text-sm">{photo.name}</p>
            <div className="space-y-2.5">
              {[
                { label: 'Kích thước', value: formatFileSize(photo.size) },
                { label: 'Độ phân giải', value: `${photo.width} × ${photo.height}` },
                { label: 'Ngày upload', value: formatDate(photo.uploadedAt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="text-white text-sm mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="flex-shrink-0 bg-black/60 backdrop-blur-sm px-4 py-3">
        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto no-scrollbar justify-center"
        >
          {photos.map((ph, i) => (
            <button
              key={ph.id}
              onClick={() => { setZoomed(false); setIndex(i); }}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                i === index ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img
                src={ph.url.replace('w=1920', 'w=120')}
                alt={ph.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
