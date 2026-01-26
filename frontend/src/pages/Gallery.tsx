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
import { Image as ImageIcon, UploadCloud, CheckCircle, Loader2, Plus } from "lucide-react";

export const Gallery: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'details' | 'uploading' | 'success'>('select');
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await galleryAPI.getAll();
      setImages(data);
    } catch (err: any) {
      console.error(err);
      showToast("Failed to load memories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast("File size too large (max 10MB)", "error");
        return;
      }
      setFileToUpload(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadStep('details');
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload || !formData.title.trim()) return;

    setUploadStep('uploading');
    try {
      // 1. Upload to Cloudinary
      const uploadResult = await uploadAPI.uploadImage(fileToUpload);
      
      // 2. Save Metadata
      await galleryAPI.upload({
        title: formData.title,
        description: formData.description,
        imageUrl: uploadResult.imageUrl,
        cloudinaryId: uploadResult.cloudinaryId,
      });

      showToast("Memory preserved successfully!", "success");
      setUploadStep('success');
      
      // Reset after delay
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStep('select');
        setFileToUpload(null);
        setPreviewUrl("");
        setFormData({ title: "", description: "" });
        fetchImages(); // Refresh grid
      }, 1500);

    } catch (error: any) {
      console.error("Upload failed", error);
      showToast(error.response?.data?.message || "Upload failed", "error");
      setUploadStep('details'); // Go back to details
    }
  };

  // Allow any authenticated user to upload
  const canUpload = !!user;

  return (
    <Layout>
      <div className="space-y-12">
        {/* Cinematic Header */}
        {/* Clean Modern Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
           <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
                {t("gallery.title")}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl">
                 A visual history of our shared moments.
              </p>
           </div>
           
           {canUpload && (
             <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => setIsUploadModalOpen(true)}
               className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
             >
               <Plus className="w-5 h-5" />
               <span>{t("gallery.upload")}</span>
             </motion.button>
           )}
        </div>

        {/* Premium Gallery Grid */}
        {loading ? (
           <div className="flex flex-col items-center justify-center h-96 gap-4">
             <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
             <p className="text-gray-500 font-medium animate-pulse">Summoning memories...</p>
           </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence>
              {images.map((image, index) => (
                <motion.div
                  layoutId={`image-card-${image._id}`}
                  key={image._id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
                  onClick={() => setSelectedImage(image)}
                  className="group relative aspect-[4/5] cursor-pointer rounded-2xl overflow-hidden shadow-soft hover:shadow-2xl transition-all duration-500 bg-gray-100 dark:bg-gray-800"
                >
                  <motion.img
                    layoutId={`image-${image._id}`}
                    src={image.imageUrl}
                    alt={image.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Permanent Overlay for Mobile/All */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-5 pointer-events-none">
                    <div className="transform transition-transform duration-500">
                      <h3 className="text-white text-base sm:text-lg font-bold line-clamp-2 leading-tight mb-2 drop-shadow-md">
                        {image.title}
                      </h3>
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold ring-1 ring-white/30 backdrop-blur-sm uppercase">
                            {image.uploadedBy?.name?.charAt(0) || "U"}
                        </div>
                        <span className="font-medium shadow-black/50 drop-shadow-md text-xs sm:text-sm">{image.uploadedBy?.name || "Unknown"}</span>
                      </div>
                      <p className="text-white/60 text-[10px] mt-2 uppercase tracking-wider font-semibold">
                        {format(new Date(image.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 text-center">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-soft">
              <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("gallery.noImages")}</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">The archive is waiting for your stories. Be the first to preserve a moment in time.</p>
            {canUpload && (
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="btn-primary flex items-center gap-2 px-8 py-3"
              >
                <Plus className="w-5 h-5" />
                <span>Upload First Photo</span>
              </button>
            )}
          </div>
        )}

        {/* Immersive Image Detail Modal */}
        <AnimatePresence>
          {selectedImage && (
             <Modal
               isOpen={!!selectedImage}
               onClose={() => setSelectedImage(null)}
               title="" // Clean title
               size="2xl"
               noPadding // Custom content needs full width
             >
               <div className="relative bg-black group/modal">
                 <div className="relative w-full aspect-auto md:h-[85vh] bg-neutral-900/50 flex flex-col md:flex-row">
                    
                    {/* Image Section */}
                    <div className="flex-1 relative flex items-center justify-center p-4 md:p-12 overflow-hidden bg-black/40 backdrop-blur-sm">
                        <motion.img 
                            layoutId={`image-${selectedImage._id}`}
                            src={selectedImage.imageUrl} 
                            alt={selectedImage.title} 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        />
                    </div>

                    {/* Sidebar Info Section */}
                    <div className="w-full md:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-8 flex flex-col h-full overflow-y-auto">
                       <div className="mb-auto">
                           <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
                               {selectedImage.title}
                           </h3>
                           
                           {selectedImage.description && (
                             <div className="relative pl-4 border-l-2 border-accent-blue/50 mb-8">
                                <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed text-lg">
                                  "{selectedImage.description}"
                                </p>
                             </div>
                           )}
                           
                           <div className="flex items-center gap-4 py-6 border-t border-gray-100 dark:border-gray-800">
                               <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                   {selectedImage.uploadedBy?.name?.charAt(0)}
                               </div>
                               <div>
                                   <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Captured By</p>
                                   <p className="font-bold text-gray-900 dark:text-white">{selectedImage.uploadedBy?.name}</p>
                               </div>
                           </div>
                       </div>
                       
                       <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-400 font-mono">
                           <p>Preserved on {format(new Date(selectedImage.createdAt), "PPP")}</p>
                       </div>
                    </div>
                 </div>
               </div>
             </Modal>
          )}
        </AnimatePresence>

        {/* Polished Upload Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => { if (uploadStep !== 'uploading') setIsUploadModalOpen(false); }}
          title={t("gallery.upload")}
          size="lg"
        >
          <div className="min-h-[400px] flex flex-col p-2">
            {uploadStep === 'select' && (
              <div className="flex-1 flex flex-col items-center justify-center border-3 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-3xl bg-gray-50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 p-12 relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Drop memory here</h3>
                <p className="text-gray-500 text-center max-w-xs">Click or drag a photo to begin preserving it forever.</p>
                <div className="mt-8 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Max 10MB
                </div>
              </div>
            )}

            {uploadStep === 'details' && previewUrl && (
              <div className="flex flex-col h-full gap-6">
                 <div className="flex gap-6 items-start">
                    <div className="w-1/3 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 bg-black">
                       <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 space-y-6">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title of Memory *</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 font-medium text-lg"
                            placeholder="E.g., The Big Family Reunion"
                            autoFocus
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">The Story</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[120px]"
                            placeholder="Tell us what makes this moment special..."
                          />
                       </div>
                    </div>
                 </div>

                 <div className="mt-auto flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                   <button 
                     onClick={() => { setUploadStep('select'); setFileToUpload(null); }}
                     className="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 font-medium transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleUpload}
                     disabled={!formData.title.trim()}
                     className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                   >
                     Preserve Memory
                   </button>
                 </div>
              </div>
            )}

            {uploadStep === 'uploading' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-blue-100 dark:border-blue-900/30 rounded-full animate-ping absolute inset-0"></div>
                    <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center relative z-10">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Uploading...</h3>
                    <p className="text-gray-500">Writing this moment into history.</p>
                </div>
              </div>
            )}

            {uploadStep === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <div>
                   <h3 className="text-3xl font-black text-green-600 dark:text-green-500 mb-2">Perfect.</h3>
                   <p className="text-gray-600 dark:text-gray-300 text-lg">Your memory has been safely stored.</p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
