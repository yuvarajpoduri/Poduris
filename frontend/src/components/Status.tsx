import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronLeft, ChevronRight, Trash2, Clock, Eye } from 'lucide-react';
import { statusAPI, uploadAPI } from '../utils/api';
import type { StatusUser } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatPoduriName } from '../utils/formatUtils';
import { formatDistanceToNow } from 'date-fns';

// --- STATUS RING (for dashboard) ---
export const StatusRing: React.FC<{
  statusUser: StatusUser;
  onClick: () => void;
  isOwn?: boolean;
}> = ({ statusUser, onClick, isOwn }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 group"
    >
      <div className="relative">
        {/* Gradient ring */}
        <div className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-full p-[3px] bg-gradient-to-tr from-orange-400 via-amber-500 to-yellow-400 shadow-lg shadow-orange-300/30 dark:shadow-orange-500/10 group-active:scale-95 transition-transform duration-200 ease-out">
          <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-gray-900">
            {statusUser.userAvatar && !imgErr ? (
              <img
                src={statusUser.userAvatar}
                alt={statusUser.userName}
                className="w-full h-full rounded-full object-cover"
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-300 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
                {formatPoduriName(statusUser.userName).charAt(0)}
              </div>
            )}
          </div>
        </div>
        {/* "Add" badge for own status */}
        {isOwn && statusUser.statuses.length === 0 && (
          <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 text-white shadow-md">
            <Plus className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 max-w-[72px] truncate">
        {isOwn ? 'You' : formatPoduriName(statusUser.userName).split(' ')[0]}
      </span>
    </button>
  );
};


// --- ADD STATUS BUTTON (for users who haven't posted) ---
export const AddStatusButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { user } = useAuth();
  const [imgErr, setImgErr] = useState(false);

  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 group"
    >
      <div className="relative">
        <div className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-full p-[3px] border-2 border-dashed border-orange-300 dark:border-orange-500/40 group-active:scale-95 transition-transform duration-200 ease-out">
          <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-gray-900">
            {user?.avatar && !imgErr ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover opacity-60"
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-400 font-bold text-lg">
                {user?.name ? formatPoduriName(user.name).charAt(0) : '?'}
              </div>
            )}
          </div>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 text-white shadow-md">
          <Plus className="w-3.5 h-3.5" />
        </div>
      </div>
      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
        Your Status
      </span>
    </button>
  );
};


// --- STATUS VIEWER (Fullscreen modal like WhatsApp/Instagram) ---
export const StatusViewer: React.FC<{
  allUsers: StatusUser[];
  initialUserIndex: number;
  onClose: () => void;
  onDeleted?: () => void;
}> = ({ allUsers, initialUserIndex, onClose, onDeleted }) => {
  const { user } = useAuth();
  const [currentUserIdx, setCurrentUserIdx] = useState(initialUserIndex);
  const [currentStatusIdx, setCurrentStatusIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<any>(null);
  const DURATION = 5000; // 5 seconds per status

  const currentUser = allUsers[currentUserIdx];
  const currentStatus = currentUser?.statuses[currentStatusIdx];
  const isOwnStatus = currentUser?.userId === user?.linkedFamilyMemberId?.toString() || currentUser?.userId === user?.id;

  // Mark as viewed
  useEffect(() => {
    if (currentStatus && !isOwnStatus) {
      statusAPI.markViewed(currentStatus._id).catch(() => {});
    }
  }, [currentStatus?._id]);

  // Auto-advance timer
  useEffect(() => {
    if (!currentStatus) return;

    setProgress(0);
    const startAt = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startAt;
      const pct = Math.min(100, (elapsed / DURATION) * 100);
      setProgress(pct);

      if (elapsed >= DURATION) {
        goNext();
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [currentUserIdx, currentStatusIdx]);

  const goNext = () => {
    clearInterval(timerRef.current);
    if (currentStatusIdx < currentUser.statuses.length - 1) {
      setCurrentStatusIdx(prev => prev + 1);
    } else if (currentUserIdx < allUsers.length - 1) {
      setCurrentUserIdx(prev => prev + 1);
      setCurrentStatusIdx(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    clearInterval(timerRef.current);
    if (currentStatusIdx > 0) {
      setCurrentStatusIdx(prev => prev - 1);
    } else if (currentUserIdx > 0) {
      setCurrentUserIdx(prev => prev - 1);
      setCurrentStatusIdx(allUsers[currentUserIdx - 1].statuses.length - 1);
    }
  };

  const handleDelete = async () => {
    if (!currentStatus) return;
    if (window.confirm('Delete this status?')) {
      try {
        await statusAPI.delete(currentStatus._id);
        onDeleted?.();
        if (currentUser.statuses.length <= 1) {
          onClose();
        } else {
          goNext();
        }
      } catch (error) {
        console.error('Delete failed', error);
      }
    }
  };

  if (!currentUser || !currentStatus) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
        onClick={onClose}
      >
        <div 
          className="relative w-full h-full max-w-lg mx-auto flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2 pt-4">
            {currentUser.statuses.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-[width] duration-75"
                  style={{
                    width: i < currentStatusIdx ? '100%' : i === currentStatusIdx ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-0 right-0 z-30 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {currentUser.userAvatar ? (
                <img src={currentUser.userAvatar} className="w-10 h-10 rounded-full object-cover border-2 border-white/30" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold">
                  {formatPoduriName(currentUser.userName).charAt(0)}
                </div>
              )}
              <div>
                <p className="text-white font-bold text-sm">{formatPoduriName(currentUser.userName)}</p>
                <p className="text-white/50 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(currentStatus.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwnStatus && (
                <>
                  <div className="text-white/50 text-xs flex items-center gap-1 mr-2">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{currentStatus.viewedBy?.length || 0}</span>
                  </div>
                  <button
                    onClick={handleDelete}
                    className="p-2 bg-white/10 hover:bg-red-500/30 rounded-full text-white transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-8">
            <motion.img
              key={currentStatus._id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              src={currentStatus.imageUrl}
              alt=""
              className="max-w-full max-h-full object-contain rounded-2xl select-none"
              draggable={false}
            />
          </div>

          {/* Tap zones for prev/next */}
          <div className="absolute inset-0 flex z-20" style={{ top: '80px', bottom: '40px' }}>
            <button className="flex-1 focus:outline-none" onClick={goPrev} aria-label="Previous" />
            <button className="flex-1 focus:outline-none" onClick={goNext} aria-label="Next" />
          </div>

          {/* Desktop arrows */}
          <button 
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white hidden sm:block"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white hidden sm:block"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};


// --- STATUS UPLOAD MODAL ---
export const StatusUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}> = ({ isOpen, onClose, onUploaded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.click();
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      onClose();
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Max 10MB.');
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      // 1. Upload to Cloudinary via existing upload API
      const { imageUrl, cloudinaryId } = await uploadAPI.uploadImage(selectedFile);
      // 2. Create status entry
      await statusAPI.create(imageUrl, cloudinaryId);
      onUploaded();
      handleClose();
    } catch (error: any) {
      console.error('Status upload failed:', error);
      alert(error.response?.data?.message || 'Failed to upload status');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {preview ? (
            <>
              {/* Preview */}
              <div className="relative bg-gray-900">
                <button onClick={handleClose} className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full max-h-[60vh] object-contain"
                />
              </div>

              {/* Actions */}
              <div className="p-4 flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-300/30 dark:shadow-orange-500/10 disabled:opacity-50 transition-all active:scale-95"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    'Share Status'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Select a photo to share as your status...</p>
              <button
                onClick={() => inputRef.current?.click()}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-bold text-sm shadow-lg"
              >
                Choose Photo
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
