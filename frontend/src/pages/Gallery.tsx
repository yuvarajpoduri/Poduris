import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { Modal } from "../components/Modal";
import { galleryAPI, uploadAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import type { GalleryImage } from "../types";
import { format } from "date-fns";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, UploadCloud, CheckCircle, Plus, Search, Trash2, Play, Pause, X, MapPin, ChevronDown, Share2, ChevronLeft, ChevronRight } from "lucide-react";

export const Gallery: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'details' | 'uploading' | 'success'>('select');

  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [batchDetails, setBatchDetails] = useState({
    title: "",
    description: "",
    location: "",
    date: format(new Date(), "yyyy-MM-dd")
  });
  
  // Slideshow State
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isSlideshowPaused, setIsSlideshowPaused] = useState(false);

  // Batch Detail Navigation
  const [currentBatchImageIndex, setCurrentBatchImageIndex] = useState(0);

  // Memoized Display Items (Grouped by Batch)
  const displayItems = React.useMemo(() => {
    const items: GalleryImage[] = [];
    const seenBatches = new Set<string>();

    images.forEach(img => {
      if (!img.batchId) {
        items.push(img);
      } else if (!seenBatches.has(img.batchId)) {
        seenBatches.add(img.batchId);
        items.push(img);
      }
    });
    return items;
  }, [images]);

  // Find all images in the same batch as selectedImage
  const currentBatch = React.useMemo(() => {
    if (!selectedImage) return [];
    if (!selectedImage.batchId) return [selectedImage];
    return images.filter(img => img.batchId === selectedImage.batchId);
  }, [selectedImage, images]);

  // Sync index when selectedImage changes
  useEffect(() => {
    if (selectedImage && currentBatch.length > 0) {
      const idx = currentBatch.findIndex(img => img._id === selectedImage._id);
      setCurrentBatchImageIndex(idx >= 0 ? idx : 0);
    }
  }, [selectedImage, currentBatch]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params: any = { 
        search: searchQuery, 
        sort: sortBy
      };
      
      if (selectedMonth !== 0) params.month = selectedMonth;
      if (selectedYear !== 0) params.year = selectedYear;

      const data = await galleryAPI.getAll(params);
      setImages(data);
    } catch (err: any) {
      console.error(err);
      showToast("Failed to load memories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchImages();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, sortBy, selectedMonth, selectedYear]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 10);
      
      const newPreviews = selectedFiles.map(file => ({
        url: URL.createObjectURL(file),
        file
      }));

      setPreviews(newPreviews);
      setCurrentPreviewIndex(0);
      setBatchDetails({
        title: "",
        description: "",
        location: "",
        date: format(new Date(), "yyyy-MM-dd")
      });
      setUploadStep('details');
    }
  };



  const handleUpload = async () => {
    if (previews.length === 0) return;
    
    if (!batchDetails.title.trim()) {
      showToast("Please provide a title for these memories", "error");
      return;
    }

    setUploadStep('uploading');
    try {
      const uploadPromises = previews.map(async (preview) => {
        const uploadResult = await uploadAPI.uploadImage(preview.file);
        
        return {
          title: batchDetails.title,
          description: batchDetails.description,
          location: batchDetails.location,
          date: batchDetails.date,
          imageUrl: uploadResult.imageUrl,
          cloudinaryId: uploadResult.cloudinaryId,
        };
      });

      const results = await Promise.all(uploadPromises);
      
      await galleryAPI.upload({ 
        images: results,
        familyMemberId: user?.familyMemberId 
      });

      showToast(`Successfully preserved ${results.length} memories!`, "success");
      setUploadStep('success');
      
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStep('select');

        setPreviews([]);
        fetchImages();
      }, 1500);

    } catch (error: any) {
      console.error("Upload failed", error);
      showToast(error.response?.data?.message || "Upload failed", "error");
      setUploadStep('details');
    }
  };

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    if (previews.length === 1) {
      setUploadStep('select');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this memory?")) return;

    try {
      await galleryAPI.delete(id);
      showToast("Memory deleted", "success");
      fetchImages();
      if (selectedImage?._id === id) setSelectedImage(null);
    } catch (err: any) {
      showToast("Failed to delete memory", "error");
    }
  };

  // Slideshow Logic - Filtered to ONLY current month & year
  const activeSlideshowImages = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    return images.filter(img => {
      const d = new Date(img.date || img.createdAt);
      return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear;
    });
  }, [images]);

  const startSlideshow = () => {
    if (activeSlideshowImages.length === 0) {
      showToast("No memories found for this month yet", "error");
      return;
    }
    setIsSlideshowActive(true);
    setSlideshowIndex(0);
    setIsSlideshowPaused(false);
  };

  useEffect(() => {
    let interval: any;
    if (isSlideshowActive && !isSlideshowPaused && activeSlideshowImages.length > 0) {
      interval = setInterval(() => {
        setSlideshowIndex((prev) => (prev + 1) % activeSlideshowImages.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isSlideshowActive, isSlideshowPaused, activeSlideshowImages.length]);

  // Keyboard Support for Batch Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage || currentBatch.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        const prevIdx = (currentBatchImageIndex - 1 + currentBatch.length) % currentBatch.length;
        setSelectedImage(currentBatch[prevIdx]);
      } else if (e.key === 'ArrowRight') {
        const nextIdx = (currentBatchImageIndex + 1) % currentBatch.length;
        setSelectedImage(currentBatch[nextIdx]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentBatch, currentBatchImageIndex]);

  // Reset slideshow if images disappear or filter changes
  useEffect(() => {
    if (isSlideshowActive && images.length === 0) {
      setIsSlideshowActive(false);
    } else if (isSlideshowActive && slideshowIndex >= images.length) {
      setSlideshowIndex(0);
    }
  }, [images, isSlideshowActive, slideshowIndex]);

  const nextSlide = () => setSlideshowIndex((prev) => (prev + 1) % (images.length || 1));
  const prevSlide = () => setSlideshowIndex((prev) => (prev - 1 + images.length) % (images.length || 1));

  // Allow any authenticated user to upload
  const canUpload = !!user;

  // Scroll Lock for Slideshow
  useEffect(() => {
    if (isSlideshowActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isSlideshowActive]);

  // Touch Handlers for Swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);


  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    triggerControls();
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextSlide();
    if (isRightSwipe) prevSlide();
  };

  const [showControls, setShowControls] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<any>(null);

  const triggerControls = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => setShowControls(false), 2000); // Wait longer
    setControlsTimeout(timeout);
  };

  const togglePause = () => {
    setIsSlideshowPaused(!isSlideshowPaused);
    triggerControls();
  };

  return (
    <Layout>
      <div className="space-y-8 px-2 md:px-0">
        {/* Header Section - Premium & Polished */}
        <div className="flex flex-col gap-8 pb-8 border-b-2 border-gray-50 dark:border-gray-800/50">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  {t("gallery.title")}
                </h1>
                <p className="text-gray-400 dark:text-gray-500 text-sm md:text-xl font-medium tracking-tight">
                   Preserving our legacy, one frame at a time.
                </p>
              </motion.div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={startSlideshow}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1.25rem] font-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Slideshow</span>
                </button>

                {canUpload && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setUploadStep('select');
                        setPreviews([]);
                        setIsUploadModalOpen(true);
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 text-white rounded-[1.25rem] font-black shadow-2xl shadow-blue-500/30 text-sm uppercase tracking-widest"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Upload</span>
                  </motion.button>
                )}
              </div>
           </div>

            {/* Search and Filters - Glass Design */}
           <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Identify a memory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-12 py-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-blue-500/20 rounded-2xl focus:ring-0 text-sm font-medium transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <select 
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(Number(e.target.value))}
                     className="w-full pl-6 pr-12 py-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent rounded-2xl focus:ring-0 text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors appearance-none text-gray-500"
                  >
                     <option value={0}>All Months</option>
                     {Array.from({ length: 12 }, (_, i) => (
                       <option key={i + 1} value={i + 1}>
                         {format(new Date(2024, i, 1), 'MMMM')}
                       </option>
                     ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative flex-1 sm:flex-none">
                  <select 
                     value={selectedYear}
                     onChange={(e) => setSelectedYear(Number(e.target.value))}
                     className="w-full pl-6 pr-12 py-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent rounded-2xl focus:ring-0 text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors appearance-none text-gray-500"
                  >
                     <option value={0}>All Years</option>
                     {Array.from({ length: 10 }, (_, i) => {
                       const year = new Date().getFullYear() - i;
                       return <option key={year} value={year}>{year}</option>;
                     })}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative flex-1 sm:flex-none">
                  <select 
                     value={sortBy}
                     onChange={(e) => setSortBy(e.target.value as any)}
                     className="w-full pl-6 pr-12 py-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent rounded-2xl focus:ring-0 text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors appearance-none text-gray-500"
                  >
                     <option value="newest">Newest First</option>
                     <option value="oldest">Oldest First</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
           </div>
        </div>

        {/* Dense Masonry Gallery Grid */}
        {loading ? (
           <div className="flex flex-col items-center justify-center h-80 gap-4">
             <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
             <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Synching Memories</p>
           </div>
        ) : images.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-2 pb-20">
            <AnimatePresence>
              {displayItems.map((image, index) => {
                const batchCount = image.batchId ? images.filter(img => img.batchId === image.batchId).length : 1;
                
                return (
                  <motion.div
                    layoutId={`image-card-${image._id}`}
                    key={image._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedImage(image)}
                    className="break-inside-avoid relative group cursor-crosshair rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]"
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Batch Indicator */}
                    {batchCount > 1 && (
                      <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 flex items-center gap-2 z-10 transition-transform group-hover:scale-110">
                         <div className="flex -space-x-2">
                            <div className="w-4 h-4 rounded-md border-2 border-white bg-blue-500 shadow-lg" />
                            <div className="w-4 h-4 rounded-md border-2 border-white bg-blue-400 shadow-lg" />
                         </div>
                         <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none drop-shadow-md">
                           {batchCount} Photos
                         </span>
                      </div>
                    )}
                    
                    {/* Subtle info indicator for mobile */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                       <span className="block text-xs text-white font-heavy truncate mb-1">{image.title}</span>
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] text-white/70 font-medium">{format(new Date(image.date || image.createdAt), "MMM yyyy")}</span>
                          <div className="flex -space-x-1.5 items-center">
                             <div className="w-5 h-5 rounded-full border border-white/20 bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white uppercase overflow-hidden">
                                {image.uploadedBy?.avatar ? (
                                  <img src={image.uploadedBy.avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  image.uploadedBy?.name?.charAt(0)
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] flex items-center justify-center mb-6">
                <ImageIcon className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black mb-2">No memories synced</h3>
            <p className="text-gray-500 text-sm max-w-xs font-medium">Be the first to upload a moment to the family vault.</p>
          </div>
        )}

        {/* Modal - Mobile Optimized Detail View */}
        <AnimatePresence>
          {selectedImage && (
             <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} title="" size="2xl" noPadding>
               <div className="flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[80vh] overflow-hidden bg-white dark:bg-black">
                  <div className="flex-1 bg-black flex items-center justify-center p-2 relative group-modal">
                      <AnimatePresence mode="wait">
                        <motion.img 
                          key={selectedImage._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                          src={selectedImage.imageUrl} 
                          alt={selectedImage.title} 
                          className="max-w-full max-h-full object-contain" 
                        />
                      </AnimatePresence>

                      {/* Batch Navigation Controls */}
                      {currentBatch.length > 1 && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const prevIdx = (currentBatchImageIndex - 1 + currentBatch.length) % currentBatch.length;
                              setSelectedImage(currentBatch[prevIdx]);
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white transition-all z-20"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextIdx = (currentBatchImageIndex + 1) % currentBatch.length;
                              setSelectedImage(currentBatch[nextIdx]);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white transition-all z-20"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                          
                          {/* Batch Counter */}
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                             <span>Memory {currentBatchImageIndex + 1} of {currentBatch.length}</span>
                          </div>
                        </>
                      )}
                  </div>
                  <div className="w-full md:w-96 p-10 flex flex-col bg-white dark:bg-gray-950 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 overflow-y-auto">
                      <div className="mb-10">
                         <div className="bg-blue-500/10 text-blue-500 inline-block px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest mb-4">
                           {format(new Date(selectedImage.date || selectedImage.createdAt), "MMMM d, yyyy")}
                         </div>
                         <h3 className="text-4xl font-black leading-tight mb-4 tracking-tighter">{selectedImage.title}</h3>
                         {selectedImage.location && (
                           <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-8">
                             <MapPin className="w-4 h-4 text-blue-500" /> {selectedImage.location}
                           </div>
                         )}
                         <div className="h-0.5 w-12 bg-gray-100 dark:bg-gray-800 mb-8" />
                         <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed font-medium italic">
                            "{selectedImage.description || "Every picture has a story, this one is waiting to be told."}"
                         </p>
                      </div>
                      <div className="mt-auto pt-8 border-t border-gray-100 dark:border-gray-800">
                         <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                               <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-500/20">
                                  {selectedImage.uploadedBy?.avatar ? <img src={selectedImage.uploadedBy.avatar} className="w-full h-full rounded-2xl object-cover" /> : selectedImage.uploadedBy?.name?.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">Source</p>
                                  <p className="text-lg font-black tracking-tight">{selectedImage.uploadedBy?.name || 'Unknown User'}</p>
                               </div>
                            </div>
                            <button 
                              className="p-4 bg-gray-50 dark:bg-gray-900 hover:bg-blue-500 hover:text-white rounded-2xl transition-all group/share"
                              title="Share Memory"
                            >
                               <Share2 className="w-5 h-5 text-gray-400 group-hover/share:text-white" />
                            </button>
                         </div>
                         {(user?.role === 'admin' || (user?.familyMemberId && user?.familyMemberId === selectedImage.familyMemberId)) && (
                           <button
                             onClick={(e) => handleDelete(selectedImage._id, e)}
                             className="w-full mt-4 flex items-center justify-center gap-2 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-transparent hover:border-red-500/20"
                           >
                             <Trash2 className="w-4 h-4" />
                             <span>Delete this Photo</span>
                           </button>
                         )}
                      </div>
                  </div>
               </div>
             </Modal>
          )}
        </AnimatePresence>

        {/* Share Memory Modal - Premium Revamp */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => { if (uploadStep !== 'uploading') setIsUploadModalOpen(false); }}
          title="Archive a Moment"
          size="2xl"
        >
          <div className="min-h-[500px] flex flex-col">
            {uploadStep === 'select' && (
              <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-gray-100 dark:border-gray-800/50 rounded-[3rem] bg-gray-50/50 dark:bg-gray-900/10 p-12 relative cursor-pointer group transition-all hover:bg-blue-50/20 dark:hover:bg-blue-900/5">
                <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="w-24 h-24 bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                    <UploadCloud className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-4xl font-black mb-3 tracking-tighter text-gray-900 dark:text-white">Import Photos</h3>
                <p className="text-gray-400 text-sm text-center max-w-xs font-medium">Drag & drop or click to browse up to 10 memories for the batch upload.</p>
                <div className="mt-12 px-6 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    High-Res Enabled
                </div>
              </div>
            )}

            {uploadStep === 'details' && previews.length > 0 && (
              <div className="flex flex-col h-full lg:max-h-[85vh] overflow-y-auto lg:overflow-hidden custom-scrollbar">
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 h-full p-1">
                  
                  {/* Column 1: Image Slider */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h4 className="text-xl font-black tracking-tighter">Selected Memories</h4>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{previews.length} photos ready to sync</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setCurrentPreviewIndex(prev => (prev - 1 + previews.length) % previews.length)}
                          className="p-2 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setCurrentPreviewIndex(prev => (prev + 1) % previews.length)}
                          className="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative aspect-video lg:aspect-[4/3] rounded-3xl lg:rounded-[2.5rem] overflow-hidden bg-black shadow-xl ring-1 ring-gray-100 dark:ring-gray-800">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentPreviewIndex}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.05 }}
                          transition={{ duration: 0.4, ease: "circOut" }}
                          className="w-full h-full relative"
                        >
                          <img 
                            src={previews[currentPreviewIndex].url} 
                            alt="Preview" 
                            className="w-full h-full object-contain"
                          />
                          <button 
                            onClick={() => {
                              const newIndex = currentPreviewIndex === 0 ? 0 : currentPreviewIndex - 1;
                              removePreview(currentPreviewIndex);
                              setCurrentPreviewIndex(newIndex);
                              if (previews.length <= 1) setUploadStep('select');
                            }}
                            className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-red-500 text-white backdrop-blur-md rounded-xl transition-all shadow-xl"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      </AnimatePresence>

                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 p-1.5 bg-black/20 backdrop-blur-md rounded-full">
                        {previews.map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1 rounded-full transition-all duration-300 ${i === currentPreviewIndex ? 'w-4 bg-white' : 'w-1 bg-white/40'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Shared Form */}
                  <div className="flex flex-col bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl lg:rounded-[2.5rem] p-5 lg:p-8 border border-gray-100 dark:border-gray-800 h-full overflow-y-visible lg:overflow-y-auto custom-scrollbar">
                    <div className="space-y-5 lg:space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Event Title *</label>
                        <input 
                          type="text" 
                          value={batchDetails.title} 
                          onChange={(e) => setBatchDetails(prev => ({ ...prev, title: e.target.value }))} 
                          className="w-full px-5 lg:px-6 py-3 lg:py-4 bg-white dark:bg-gray-900 rounded-xl lg:rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-base lg:text-lg shadow-sm" 
                          placeholder="e.g. Summer Reunion 2024" 
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Location</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              type="text" 
                              value={batchDetails.location} 
                              onChange={(e) => setBatchDetails(prev => ({ ...prev, location: e.target.value }))} 
                              className="w-full pl-11 pr-5 lg:pl-12 lg:pr-6 py-3 lg:py-4 bg-white dark:bg-gray-900 rounded-xl lg:rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-medium shadow-sm" 
                              placeholder="Where?" 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                          <input 
                            type="date" 
                            value={batchDetails.date} 
                            onChange={(e) => setBatchDetails(prev => ({ ...prev, date: e.target.value }))} 
                            className="w-full px-5 lg:px-6 py-3 lg:py-4 bg-white dark:bg-gray-900 rounded-xl lg:rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-medium shadow-sm" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Batch Story</label>
                        <textarea 
                          value={batchDetails.description} 
                          onChange={(e) => setBatchDetails(prev => ({ ...prev, description: e.target.value }))} 
                          className="w-full px-5 lg:px-6 py-3 lg:py-4 bg-white dark:bg-gray-900 rounded-xl lg:rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-medium min-h-[100px] lg:min-h-[120px] resize-none shadow-sm" 
                          placeholder="The story..." 
                        />
                      </div>

                      <div className="pt-2 lg:pt-4">
                        <button 
                          onClick={handleUpload} 
                          className="w-full py-4 lg:py-5 bg-blue-600 text-white rounded-2xl lg:rounded-3xl font-black shadow-xl shadow-blue-500/20 text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
                        >
                          Sync {previews.length} Memories
                        </button>
                        <button 
                          onClick={() => { setUploadStep('select'); setPreviews([]); }} 
                          className="w-full mt-3 py-2 text-gray-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-colors"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {uploadStep === 'uploading' && (
               <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative mb-10">
                      <div className="w-24 h-24 border-8 border-blue-500/10 rounded-full" />
                      <div className="w-24 h-24 border-8 border-transparent border-t-blue-500 rounded-full animate-spin absolute inset-0" />
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter mb-2">Syncing with history...</h3>
                  <p className="text-gray-400 font-medium tracking-tight">Writing your moments into the family vault.</p>
               </div>
            )}

            {uploadStep === 'success' && (
               <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-green-500/30"
                  >
                     <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>
                  <h3 className="text-5xl font-black mb-3 tracking-tighter">Memories Secured.</h3>
                  <p className="text-gray-400 text-lg font-medium">Your legacy has been successfully preserved.</p>
               </div>
            )}
          </div>
        </Modal>

        {/* Cinematic Slideshow Overlay - ABSOLUTE FULLSCREEN REVAMP */}
        <AnimatePresence>
          {isSlideshowActive && activeSlideshowImages.length > 0 && (
           <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-[-5%] left-0 right-0 bottom-0 h-[103vh] w-full z-[99999] bg-black/80 backdrop-blur-3xl flex items-center justify-center touch-none overflow-hidden"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
            

              {/* Progress Bar */}
              <div className={`absolute top-0 left-0 w-full h-[4px] z-[1350] transition-opacity duration-1000 ${isSlideshowPaused ? 'opacity-100' : 'opacity-40'}`}>
                 <motion.div 
                   key={slideshowIndex + (isSlideshowPaused ? '-paused' : '-playing')}
                   initial={{ width: "0%" }}
                   animate={{ width: isSlideshowPaused ? "0%" : "100%" }}
                   transition={{ duration: isSlideshowPaused ? 0 : 5.5, ease: "linear" }}
                   className="h-full bg-blue-500 shadow-[0_0_25px_rgba(59,130,246,1)]"
                 />
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setIsSlideshowActive(false)}
                className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-3xl z-[1400] transition-all transform hover:rotate-90 active:scale-95 border border-white/10 shadow-2xl"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Interaction Layer & Controls */}
              <div 
                className="absolute inset-0 z-[1200] flex items-center justify-center"
                onClick={togglePause}
                onMouseMove={triggerControls}
              >
                  <AnimatePresence>
                    {showControls && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col gap-4 items-center pointer-events-none"
                      >
                         <div 
                           className="p-8 bg-transparent text-white pointer-events-none"
                         >
                           {isSlideshowPaused ? <Play className="w-16 h-16 fill-current opacity-40" /> : <Pause className="w-16 h-16 fill-current opacity-40" />}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>

              {/* Main Image Stage - Perfectly Centered */}
              <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 z-[1100]">
                 <AnimatePresence mode="wait">
                    <motion.div
                      key={slideshowIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                      className="relative w-full h-full flex items-center justify-center font-serif text-white/90"
                    >
                        <img
                          src={activeSlideshowImages[slideshowIndex].imageUrl}
                          className="max-w-full max-h-full object-contain shadow-[0_0_80px_rgba(0,0,0,0.5)]"
                          alt=""
                        />
                    </motion.div>
                 </AnimatePresence>
              </div>

              {/* Bottom Metadata */}
              <div className="absolute bottom-16 left-12 right-12 z-[1300] pointer-events-none max-w-4xl mr-auto">
                 <motion.div
                    key={slideshowIndex + '-title'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                 >
                    <h4 className="text-white font-heavy text-4xl md:text-7xl tracking-tighter drop-shadow-2xl mb-6 leading-tight">
                        {activeSlideshowImages[slideshowIndex].title}
                    </h4>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-1 pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-[10px] font-black text-white/80 overflow-hidden border border-white/10 backdrop-blur-md">
                                {activeSlideshowImages[slideshowIndex].uploadedBy?.avatar ? (
                                  <img src={activeSlideshowImages[slideshowIndex].uploadedBy.avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  activeSlideshowImages[slideshowIndex].uploadedBy?.name?.charAt(0)
                                )}
                            </div>
                            <p className="text-white/60 font-black text-xs uppercase tracking-[0.3em] drop-shadow-md">
                                {activeSlideshowImages[slideshowIndex].uploadedBy?.name || 'Unknown Source'}
                            </p>
                        </div>
                        <div className="px-1">
                            <p className="text-white/30 text-xs font-black uppercase tracking-[0.3em] drop-shadow-md">
                                {format(new Date(activeSlideshowImages[slideshowIndex].date || activeSlideshowImages[slideshowIndex].createdAt), "MMMM yyyy")}
                            </p>
                        </div>
                    </div>
                 </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};
