import { useState, useRef, useCallback } from 'react';
import type { Photo } from '../types';
import { generateId, formatFileSize, ACCEPTED_TYPES, MAX_FILE_SIZE } from '../utils';

interface FileEntry {
  file: File;
  id: string;
  preview: string;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'skipped';
  progress: number;
  error?: string;
  duplicateAction?: 'skip' | 'rename' | 'replace';
  isDuplicate?: boolean;
  newName?: string;
}

interface Props {
  existingPhotoNames: string[];
  onClose: () => void;
  onUploaded: (photos: Photo[]) => void;
}

const ACCEPTED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

export default function UploadModal({ existingPhotoNames, onClose, onUploaded }: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newEntries: FileEntry[] = arr.map((f) => {
      const id = generateId();
      let error: string | undefined;
      let isDuplicate = false;

      if (!ACCEPTED_TYPES.includes(f.type) && !ACCEPTED_EXT.some(ext => f.name.toLowerCase().endsWith(ext))) {
        error = 'Định dạng không được hỗ trợ.';
      } else if (f.size > MAX_FILE_SIZE) {
        error = `Ảnh vượt quá 10MB.`;
      } else if (existingPhotoNames.includes(f.name)) {
        isDuplicate = true;
      }

      return {
        id,
        file: f,
        preview: URL.createObjectURL(f),
        status: error ? 'error' : 'pending',
        progress: 0,
        error,
        isDuplicate,
      };
    });

    setEntries((prev) => {
      // check for duplicate names within the new batch
      const allNames = [...existingPhotoNames, ...prev.map((e) => e.file.name)];
      return [...prev, ...newEntries.map((e) => ({
        ...e,
        isDuplicate: !e.error && allNames.includes(e.file.name),
      }))];
    });
  }, [existingPhotoNames]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const setAction = (id: string, action: 'skip' | 'rename' | 'replace', newName?: string) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, duplicateAction: action, newName } : e));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const pendingCount = entries.filter((e) => e.status === 'pending' && !e.isDuplicate).length;
  const duplicateCount = entries.filter((e) => e.isDuplicate && !e.duplicateAction).length;
  const canUpload = pendingCount + entries.filter((e) => e.isDuplicate && e.duplicateAction && e.duplicateAction !== 'skip').length > 0 && !duplicateCount;

  const startUpload = async () => {
    if (!canUpload) return;
    setIsUploading(true);

    const uploadable = entries.filter((e) =>
      (e.status === 'pending' && !e.isDuplicate) ||
      (e.isDuplicate && e.duplicateAction === 'rename') ||
      (e.isDuplicate && e.duplicateAction === 'replace')
    );

    const uploaded: Photo[] = [];

    for (const entry of uploadable) {
      // Simulate progress
      for (let pct = 0; pct <= 100; pct += 25) {
        await new Promise((r) => setTimeout(r, 120));
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: 'uploading', progress: pct } : e));
      }

      const finalName = entry.isDuplicate && entry.duplicateAction === 'rename'
        ? (entry.newName || `${entry.file.name.replace(/(\.[^.]+)$/, '')}_copy$1`)
        : entry.file.name;

      uploaded.push({
        id: generateId(),
        name: finalName,
        url: entry.preview,
        size: entry.file.size,
        width: 1920,
        height: 1080,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'user-1',
      });

      setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: 'done', progress: 100 } : e));
    }

    // Mark skipped
    setEntries((prev) => prev.map((e) => (e.isDuplicate && e.duplicateAction === 'skip') || e.status === 'error' ? { ...e, status: 'skipped' } : e));

    setIsUploading(false);
    setDone(true);
    if (uploaded.length) onUploaded(uploaded);
  };

  const statusIcon = (e: FileEntry) => {
    if (e.status === 'done') return <span className="text-green-500 text-lg">✓</span>;
    if (e.status === 'error' || e.status === 'skipped') return <span className="text-gray-400 dark:text-gray-500 text-lg">–</span>;
    if (e.status === 'uploading') return (
      <svg className="animate-spin text-blue-500" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 60"/>
      </svg>
    );
    return null;
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isUploading ? onClose : undefined} />
      <div className="slide-up relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Tải ảnh lên</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">JPG, PNG, WEBP, HEIC · Tối đa 10MB/ảnh</p>
            </div>
            {!isUploading && (
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xl">×</button>
            )}
          </div>
        </div>

        {/* Drop zone */}
        {!done && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileRef.current?.click()}
            className={`mx-6 mt-4 flex-shrink-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 py-7 ${
              isDragging ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
              <polyline points="17 8 12 3 7 8" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">Kéo thả ảnh vào đây</p>
            <span className="text-sm text-blue-600 font-medium">hoặc chọn nhiều ảnh</span>
            <input ref={fileRef} type="file" multiple accept="image/*,.heic" hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
          </div>
        )}

        {/* File list */}
        {entries.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 min-h-0">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
                {/* Thumb */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  <img src={entry.preview} alt={entry.file.name} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{entry.file.name}</p>
                    {!isUploading && !done && (
                      <button onClick={() => removeEntry(entry.id)} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 flex-shrink-0 text-base leading-none">×</button>
                    )}
                    {statusIcon(entry)}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatFileSize(entry.file.size)}</p>

                  {/* Error */}
                  {entry.error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {entry.error}</p>}

                  {/* Duplicate warning */}
                  {entry.isDuplicate && !entry.duplicateAction && (
                    <div className="mt-2">
                      <p className="text-xs text-yellow-600 font-medium mb-1.5">⚠ Tên ảnh đã tồn tại trong sự kiện.</p>
                      <div className="flex gap-1.5">
                        {(['skip', 'rename', 'replace'] as const).map((action) => (
                          <button
                            key={action}
                            onClick={() => {
                              if (action === 'rename') {
                                const base = entry.file.name.replace(/(\.[^.]+)$/, '');
                                const ext  = entry.file.name.match(/(\.[^.]+)$/)?.[1] || '';
                                setAction(entry.id, 'rename', `${base}_copy${ext}`);
                              } else {
                                setAction(entry.id, action);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600"
                          >
                            {action === 'skip' ? 'Bỏ qua' : action === 'rename' ? 'Đổi tên' : 'Ghi đè'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.isDuplicate && entry.duplicateAction === 'rename' && entry.newName && (
                    <p className="text-xs text-blue-600 mt-1">→ {entry.newName}</p>
                  )}
                  {entry.isDuplicate && entry.duplicateAction && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {entry.duplicateAction === 'skip' ? 'Sẽ bỏ qua' : entry.duplicateAction === 'rename' ? 'Sẽ đổi tên' : 'Sẽ ghi đè'}
                    </p>
                  )}

                  {/* Progress */}
                  {entry.status === 'uploading' && (
                    <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-200"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Done state */}
        {done && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-2xl flex items-center justify-center">
              <span className="text-green-500 text-3xl">✓</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Tải lên hoàn tất!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {entries.filter(e => e.status === 'done').length} ảnh đã được tải lên thành công.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {entries.filter(e => e.status === 'pending' || e.status === 'uploading' || e.status === 'done').length} ảnh đã chọn
          </span>
          <div className="flex gap-3">
            {done ? (
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors">
                Xong
              </button>
            ) : (
              <>
                <button onClick={onClose} disabled={isUploading} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40">
                  Hủy
                </button>
                <button
                  onClick={startUpload}
                  disabled={!canUpload || isUploading || entries.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md hover:shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Đang tải…' : `Tải lên ${entries.filter(e => e.status === 'pending' && !e.isDuplicate).length + entries.filter(e => e.isDuplicate && e.duplicateAction && e.duplicateAction !== 'skip').length} ảnh`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
