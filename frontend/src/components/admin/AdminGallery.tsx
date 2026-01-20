import React, { useEffect, useState } from "react";
import { Card } from "../Card";
import { Modal } from "../Modal";
import { galleryAPI, uploadAPI } from "../../utils/api";
import type { GalleryImage } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

export const AdminGallery: React.FC = () => {
  const { t } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const result = await uploadAPI.uploadImage(file);

      setFormData({
        ...formData,
        imageUrl: result.imageUrl,
        cloudinaryId: result.cloudinaryId,
      });
      setUploading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload image");
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.imageUrl || !formData.cloudinaryId) {
      setError("Please upload an image");
      return;
    }

    try {
      if (editingImage) {
        await galleryAPI.update(editingImage._id, formData);
      } else {
        await galleryAPI.upload(formData);
      }
      setIsModalOpen(false);
      setEditingImage(null);
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        cloudinaryId: "",
        familyMemberId: null,
      });
      fetchImages();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save gallery image");
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description,
      imageUrl: image.imageUrl,
      cloudinaryId: image.cloudinaryId,
      familyMemberId: image.familyMemberId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      await galleryAPI.delete(id);
      fetchImages();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete image");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await galleryAPI.approve(id);
      fetchImages();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve image");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await galleryAPI.reject(id);
      fetchImages();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject image");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="animate-pulse-soft text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black">
            {t("gallery.title")}
          </h2>
          <p className="text-gray-600 text-sm mt-1">Manage family photos</p>
        </div>
        <button
          onClick={() => {
            setEditingImage(null);
            setFormData({
              title: "",
              description: "",
              imageUrl: "",
              cloudinaryId: "",
              familyMemberId: null,
            });
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          + {t("gallery.upload")}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card key={image._id}>
            <div className="relative aspect-square mb-2">
              <img
                src={image.imageUrl}
                alt={image.title}
                className="w-full h-full object-cover rounded border border-black"
              />
              {image.status === "pending" && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  {t("gallery.pending")}
                </div>
              )}
              {image.status === "rejected" && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  {t("gallery.rejected")}
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold text-black mb-1 truncate">
              {image.title}
            </h3>
            <div className="space-y-2">
              {image.status === "pending" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(image._id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded transition-colors"
                  >
                  {t("gallery.approve")}
                  </button>
                  <button
                    onClick={() => handleReject(image._id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-colors"
                  >
                  {t("gallery.reject")}
                  </button>
                </div>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(image)}
                  className="text-accent-blue hover:underline text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(image._id)}
                  className="text-red-600 hover:underline text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          {t("gallery.noImages")}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingImage(null);
        }}
        title={
          editingImage ? t("common.edit") + " " + t("gallery.title") : t("gallery.upload")
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingImage && (
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                {t("gallery.upload")}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="input"
                required={!editingImage}
              />
              {uploading && (
                <p className="text-sm text-gray-600 mt-1">Uploading...</p>
              )}
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="mt-2 w-full h-48 object-cover rounded border border-black"
                />
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">
              {t("common.save")}
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-black rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">
              {t("common.edit")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-black rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">
              Family Member ID (optional)
            </label>
            <input
              type="number"
              value={formData.familyMemberId || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  familyMemberId: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              className="w-full px-3 py-2 border border-black rounded-md"
            />
          </div>

          {editingImage && (
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                "Image URL"
              </label>
              <input
                type="url"
                required
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                className="input"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingImage(null);
              }}
              className="btn-secondary"
            >
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn-primary">
              {editingImage ? t("common.save") : t("gallery.upload")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
