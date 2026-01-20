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
  const { user, isAdmin } = useAuth();
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
      showToast("Failed to load gallery", "error");
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

      showToast("Photo uploaded successfully!", "success");
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

  const canUpload = user && (isAdmin() || user.status === "active");

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 mb-2">
              {t("gallery.title")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg">
              Capture and share precious moments with your family. 
              Only approved members can add to this collection.
            </p>
          </div>
          
          {canUpload && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsUploadModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 font-bold hover:shadow-blue-500/50 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>{t("gallery.upload")}</span>
            </motion.button>
          )}
        </div>

        {/* Gallery Grid */}
        {loading ? (
           <div className="flex justify-center items-center h-64">
             <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
           </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {images.map((image, index) => (
                <motion.div
                  layoutId={`image-${image._id}`}
                  key={image._id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedImage(image)}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-md hover:shadow-xl transition-all"
                >
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-white font-bold truncate text-sm">{image.title}</p>
                    <p className="text-white/80 text-xs truncate">by {image.uploadedBy?.name}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("gallery.noImages")}</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">Start building your family album by uploading some photos!</p>
            {canUpload && (
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="text-blue-600 font-semibold hover:underline"
              >
                Upload a Photo
              </button>
            )}
          </div>
        )}

        {/* Image Detail Modal */}
        <Modal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          title={selectedImage?.title || ""}
          size="xl"
        >
          {selectedImage && (
            <div className="space-y-4">
              <div className="bg-black/5 rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center">
                <img src={selectedImage.imageUrl} alt={selectedImage.title} className="max-w-full max-h-full object-contain" />
              </div>
              
              <div className="flex justify-between items-start gap-4">
                <div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{selectedImage.title}</h3>
                   {selectedImage.description && (
                     <p className="text-gray-600 dark:text-gray-300">{selectedImage.description}</p>
                   )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Uploaded by <span className="font-semibold text-gray-900 dark:text-white">{selectedImage.uploadedBy?.name}</span></p>
                  <p>{format(new Date(selectedImage.createdAt), "PPP")}</p>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Upload Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => { if (uploadStep !== 'uploading') setIsUploadModalOpen(false); }}
          title={t("gallery.upload")}
          size="lg"
        >
          <div className="min-h-[300px] flex flex-col">
            {uploadStep === 'select' && (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors p-8 relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-16 h-16 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Click to upload photo</h3>
                <p className="text-sm text-gray-500 mt-2">Maximum file size 10MB</p>
              </div>
            )}

            {uploadStep === 'details' && previewUrl && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-1/3 aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="input w-full"
                        placeholder="E.g., Summer Vacation 2024"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="input w-full resize-none"
                        rows={3}
                        placeholder="Add some details..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                  <button 
                    onClick={() => { setUploadStep('select'); setFileToUpload(null); }}
                    className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!formData.title.trim()}
                    className="btn-primary"
                  >
                    Upload Photo
                  </button>
                </div>
              </div>
            )}

            {uploadStep === 'uploading' && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold">Uploading...</h3>
                <p className="text-gray-500">Please wait while we save your memory.</p>
              </div>
            )}

            {uploadStep === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Success!</h3>
                <p className="text-gray-600">Your photo has been added to the gallery.</p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
