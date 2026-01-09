import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { Modal } from "../components/Modal";
import { galleryAPI, uploadAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import type { GalleryImage } from "../types";
import { format } from "date-fns";

export const Gallery: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const [uploadFormData, setUploadFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    cloudinaryId: "",
    familyMemberId: null as number | null,
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const data = await galleryAPI.getAll();
      setImages(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load gallery images");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const result = await uploadAPI.uploadImage(file);
      setUploadFormData(prev => ({
        ...prev,
        imageUrl: result.imageUrl,
        cloudinaryId: result.cloudinaryId,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!uploadFormData.imageUrl || !uploadFormData.cloudinaryId) {
      setError("Please upload an image first");
      return;
    }

    try {
      await galleryAPI.upload(uploadFormData);
      setIsUploadModalOpen(false);
      setUploadFormData({
        title: "",
        description: "",
        imageUrl: "",
        cloudinaryId: "",
        familyMemberId: null,
      });
      fetchImages();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save image details");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600 font-medium">{t("gallery.loading")}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Permission Check: Admin or Approved Member
  const canUpload = user && (isAdmin() || user.status === "approved");

  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("gallery.title")}</h1>
            <p className="text-gray-600 dark:text-gray-400">Family memories and moments</p>
          </div>
          {canUpload && (
            <button onClick={() => setIsUploadModalOpen(true)} className="btn-primary">
              + {t("gallery.upload")}
            </button>
          )}
        </header>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <div
                key={image._id}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-gray-100 border border-transparent hover:border-accent-blue transition-all"
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p className="text-white text-xs font-semibold truncate">{image.title}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <span className="text-5xl mb-4">🖼️</span>
            <p className="text-gray-500 font-medium">{t("gallery.noImages")}</p>
          </div>
        )}

        {/* View Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedImage(null); }}
          title={selectedImage?.title}
          size="xl"
        >
          {selectedImage && (
            <div className="space-y-4">
              <img src={selectedImage.imageUrl} alt={selectedImage.title} className="w-full h-auto rounded-xl shadow-lg" />
              {selectedImage.description && (
                <p className="text-gray-700 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  {selectedImage.description}
                </p>
              )}
              <div className="flex justify-between text-xs text-gray-500 border-t pt-4">
                <span>By <span className="font-bold text-gray-900 dark:text-white">{selectedImage.uploadedBy.name}</span></span>
                <span>{format(new Date(selectedImage.createdAt), "PPP")}</span>
              </div>
            </div>
          )}
        </Modal>

        {/* Upload Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title={t("gallery.upload")}
          size="lg"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer block">
                {uploadFormData.imageUrl ? (
                  <img src={uploadFormData.imageUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-md" />
                ) : (
                  <div className="py-4">
                    <span className="text-3xl block mb-2">☁️</span>
                    <span className="text-sm font-medium text-accent-blue">Click to select a photo</span>
                  </div>
                )}
              </label>
              {uploading && <p className="text-xs animate-pulse mt-2 text-accent-blue">Uploading to Cloudinary...</p>}
            </div>

            <input
              type="text"
              placeholder="Photo Title *"
              required
              className="input w-full"
              value={uploadFormData.title}
              onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
            />

            <textarea
              placeholder="Add a description (optional)"
              className="input w-full min-h-[100px]"
              value={uploadFormData.description}
              onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
            />

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsUploadModalOpen(false)} className="btn-secondary flex-1">
                {t("common.cancel")}
              </button>
              <button type="submit" disabled={uploading || !uploadFormData.imageUrl} className="btn-primary flex-1">
                {t("common.save")}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};
