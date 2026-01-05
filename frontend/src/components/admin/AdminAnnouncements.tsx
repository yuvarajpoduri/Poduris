import React, { useEffect, useState } from 'react';
import { Card } from '../Card';
import { Modal } from '../Modal';
import { announcementsAPI } from '../../utils/api';
import type { Announcement } from '../../types';

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other' as Announcement['category']
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await announcementsAPI.getAll();
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingAnnouncement) {
        await announcementsAPI.update(editingAnnouncement._id, formData);
      } else {
        await announcementsAPI.create(formData);
      }
      setIsModalOpen(false);
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        category: 'other'
      });
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save announcement');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await announcementsAPI.delete(id);
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete announcement');
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
          <h2 className="text-2xl font-bold text-black">Announcements</h2>
          <p className="text-gray-600 text-sm mt-1">Share news with your family</p>
        </div>
        <button
          onClick={() => {
            setEditingAnnouncement(null);
            setFormData({
              title: '',
              content: '',
              category: 'other'
            });
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          + Add Announcement
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement._id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-black">{announcement.title}</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {announcement.category}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{announcement.content}</p>
                <p className="text-sm text-gray-500">
                  By {announcement.createdBy.name} on{' '}
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(announcement)}
                  className="text-accent-blue hover:underline text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(announcement._id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="text-center text-gray-500 mt-8">No announcements available</div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAnnouncement(null);
        }}
        title={editingAnnouncement ? 'Edit Announcement' : 'Add Announcement'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Announcement['category'] })}
                className="input"
            >
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="event">Event</option>
              <option value="news">News</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Content</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
                className="input"
            />
          </div>

          <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingAnnouncement ? 'Update' : 'Create'}
              </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

