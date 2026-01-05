import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { announcementsAPI } from '../utils/api';
import type { Announcement } from '../types';
import { format } from 'date-fns';

export const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    fetchAnnouncements();
  }, []);

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, { emoji: string; className: string }> = {
      birthday: { emoji: '🎂', className: 'badge badge-orange' },
      anniversary: { emoji: '💍', className: 'badge badge-yellow' },
      event: { emoji: '📅', className: 'badge badge-blue' },
      news: { emoji: '📰', className: 'badge badge-gray' },
      other: { emoji: '📢', className: 'badge badge-gray' }
    };
    return badges[category] || badges.other;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-pulse-soft text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading announcements...</p>
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
          <h1 className="mb-2">Announcements</h1>
          <p className="text-gray-600">Stay updated with family news and events</p>
        </div>

        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const badge = getCategoryBadge(announcement.category);
              return (
                <Card key={announcement._id}>
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl sm:text-4xl flex-shrink-0">{badge.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <h3 className="text-xl sm:text-2xl font-bold text-black">{announcement.title}</h3>
                        <span className={`${badge.className} self-start sm:self-auto`}>
                          {announcement.category}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">{announcement.content}</p>
                      <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-200">
                        <span>By <span className="font-medium text-black">{announcement.createdBy.name}</span></span>
                        <span>{format(new Date(announcement.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-12">
            <span className="text-4xl mb-4 block">📢</span>
            <p className="text-gray-500 text-lg">No announcements available</p>
          </div>
        )}
      </div>
    </Layout>
  );
};
