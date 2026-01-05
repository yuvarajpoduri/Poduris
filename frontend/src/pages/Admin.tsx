import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { AdminFamilyMembers } from '../components/admin/AdminFamilyMembers';
import { AdminAnnouncements } from '../components/admin/AdminAnnouncements';
import { AdminGallery } from '../components/admin/AdminGallery';
import { AdminUsers } from '../components/admin/AdminUsers';

type AdminTab = 'users' | 'family' | 'announcements' | 'gallery';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-black mb-8">Admin Panel</h1>

        <div className="mb-6 border-b border-black">
          <nav className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeTab === 'family'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Family Members
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeTab === 'announcements'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Gallery
            </button>
          </nav>
        </div>

        <div>
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'family' && <AdminFamilyMembers />}
          {activeTab === 'announcements' && <AdminAnnouncements />}
          {activeTab === 'gallery' && <AdminGallery />}
        </div>
      </div>
    </Layout>
  );
};

