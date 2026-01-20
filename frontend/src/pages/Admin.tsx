import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { AdminFamilyMembers } from '../components/admin/AdminFamilyMembers';
import { AdminEvents } from '../components/admin/AdminEvents';
import { AdminGallery } from '../components/admin/AdminGallery';

type AdminTab = 'family' | 'events' | 'gallery';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('family');

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-black mb-8">Admin Panel</h1>

        <div className="mb-6 border-b border-black">
          <nav className="flex space-x-1 overflow-x-auto">
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
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeTab === 'events'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Events
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
          {activeTab === 'family' && <AdminFamilyMembers />}
          {activeTab === 'events' && <AdminEvents />}
          {activeTab === 'gallery' && <AdminGallery />}
        </div>
      </div>
    </Layout>
  );
};

