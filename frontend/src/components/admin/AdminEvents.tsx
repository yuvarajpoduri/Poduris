import React, { useEffect, useState } from 'react';
import { Card } from '../Card';
import { Modal } from '../Modal';
import { eventsAPI } from '../../utils/api';
import type { Event } from '../../types';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import { formatPoduriName } from '../../utils/formatUtils';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    eventType: 'event' as Event['eventType']
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await eventsAPI.getAll();
      setEvents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Create partial event object from form data
      const eventData: Partial<Event> = {
          ...formData,
          description: formData.description || undefined,
          location: formData.location || undefined
      };

      if (editingEvent) {
        await eventsAPI.update(editingEvent._id, eventData);
        showToast('Event updated successfully', 'success');
      } else {
        await eventsAPI.create(eventData);
        showToast('Event created successfully', 'success');
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        location: '',
        eventType: 'event'
      });
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save event');
      showToast('Failed to save event', 'error');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date ? format(new Date(event.date), 'yyyy-MM-dd') : '',
      location: event.location || '',
      eventType: event.eventType
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await eventsAPI.delete(id);
      showToast('Event deleted successfully', 'success');
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete event');
      showToast('Failed to delete event', 'error');
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
          <h2 className="text-2xl font-bold text-black dark:text-white">Events</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage family events</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setFormData({
              title: '',
              description: '',
              date: '',
              location: '',
              eventType: 'event'
            });
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          + Add Event
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event._id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-black dark:text-white">{formatPoduriName(event.title)}</h3>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                      event.eventType === 'holiday' ? 'bg-green-100 text-green-800' :
                      event.eventType === 'event' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                    {event.eventType.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2 space-y-1">
                    <p>📅 {event.date ? format(new Date(event.date), 'MMMM dd, yyyy') : 'No date set'}</p>
                    {event.location && <p>📍 {event.location}</p>}
                </div>
                {event.description && <p className="text-gray-700 dark:text-gray-300 mb-2">{event.description}</p>}
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(event)}
                  className="text-accent-blue hover:underline text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event._id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center text-gray-500 mt-8">No events available</div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        title={editingEvent ? 'Edit Event' : 'Add Event'}
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
                placeholder="Event Title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Type</label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value as Event['eventType'] })}
                className="input"
            >
              <option value="event">Event</option>
              <option value="holiday">Holiday</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                placeholder="Optional location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
                className="input"
                placeholder="Optional description"
            />
          </div>

          <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingEvent(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingEvent ? 'Update' : 'Create'}
              </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
