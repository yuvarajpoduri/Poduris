import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { galleryAPI } from '../utils/api';
import type { GalleryImage } from '../types';
import { format } from 'date-fns';

export const Gallery: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await galleryAPI.getAll();
        setImages(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load gallery images');
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-pulse-soft text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading gallery...</p>
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
        <div>
          <h1 className="mb-2">Gallery</h1>
          <p className="text-gray-600">Family memories and moments</p>
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
                  if (e.key === 'Enter' || e.key === ' ') {
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
                    <p className="text-white text-sm font-medium truncate">{image.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <span className="text-4xl mb-4 block">🖼️</span>
            <p className="text-gray-500 text-lg">No images in gallery</p>
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
                  <p className="text-gray-700 leading-relaxed">{selectedImage.description}</p>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
                <span>Uploaded by <span className="font-medium text-black">{selectedImage.uploadedBy.name}</span></span>
                <span>{format(new Date(selectedImage.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
