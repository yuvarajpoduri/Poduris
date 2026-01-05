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
    const fetchImages = async () => {
      try {
        const data = await galleryAPI.getAll();
        setImages(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load gallery images"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

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
      setUploadFormData({
        ...uploadFormData,
        imageUrl: result.imageUrl,
        cloudinaryId: result.cloudinaryId,
      });
      setUploading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload image");
      setUploading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!uploadFormData.imageUrl || !uploadFormData.cloudinaryId) {
      setError("Please upload an image");
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
      // Refresh images
      const data = await galleryAPI.getAll();
      setImages(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload image");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-pulse-soft text-4xl mb-4">⏳</div>
            <p className="text-gray-600">{t("gallery.loading")}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700 text-center">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="mb-2">{t("gallery.title")}</h1>
            <p className="text-gray-600">
              Family memories and moments
            </p>
          </div>
          {user && (user.status === "approved" || isAdmin()) && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary"
            >
              + {t("gallery.upload")}
            </button>
          )}
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {images.map((image) => (
              <div
                key={image._id}
                className="relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 border-gray-200 hover:border-accent-blue transition-all duration-200 group"
                onClick={() => handleImageClick(image)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleImageClick(image);
                  }
                }}
              >
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium truncate">
                      {image.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <span className="text-4xl mb-4 block">🖼️</span>
            <p className="text-gray-500 text-lg">
              {t("gallery.noImages")}
            </p>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedImage(null);
          }}
          title={selectedImage?.title}
          size="xl"
        >
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title}
                  className="w-full h-auto"
                />
              </div>
              {selectedImage.description && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">
                    {selectedImage.description}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
                <span>
                  Uploaded by{" "}
                  <span className="font-medium text-black">
                    {selectedImage.uploadedBy.name}
                  </span>
                </span>
                <span>
                  {format(new Date(selectedImage.createdAt), "MMM dd, yyyy")}
                </span>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setUploadFormData({
              title: "",
              description: "",
              imageUrl: "",
              cloudinaryId: "",
              familyMemberId: null,
            });
          }}
          title={t("gallery.upload")}
          size="lg"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                {t("gallery.upload")}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="input"
                required
              />
              {uploading && (
                <p className="text-sm text-gray-600 mt-1">Uploading...</p>
              )}
              {uploadFormData.imageUrl && (
                <img
                  src={uploadFormData.imageUrl}
                  alt="Preview"
                  className="mt-2 w-full h-48 object-cover rounded border border-gray-200"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                {t("common.save")} *
              </label>
              <input
                type="text"
                required
                value={uploadFormData.title}
                onChange={(e) =>
                  setUploadFormData({
                    ...uploadFormData,
                    title: e.target.value,
                  })
                }
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                Description
              </label>
              <textarea
                value={uploadFormData.description}
                onChange={(e) =>
                  setUploadFormData({
                    ...uploadFormData,
                    description: e.target.value,
                  })
                }
                rows={4}
                className="input"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFormData({
                    title: "",
                    description: "",
                    imageUrl: "",
                    cloudinaryId: "",
                    familyMemberId: null,
                  });
                }}
                className="btn-secondary"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={uploading || !uploadFormData.imageUrl}
              >
                {t("gallery.upload")}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {t("gallery.uploadHint")}
            </p>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};
