import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { AdminFamilyMembers } from '../components/admin/AdminFamilyMembers';
import { AdminEvents } from '../components/admin/AdminEvents';
import { AdminGallery } from '../components/admin/AdminGallery';
import { AdminTrends } from '../components/admin/AdminTrends';
import { TrendingUp, Users, Calendar, Image as ImageIcon } from 'lucide-react';

type AdminTab = 'trends' | 'family' | 'events' | 'gallery';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('trends');

  const tabs = [
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'family', label: 'Family Members', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Admin Control Center</h1>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-700">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             Live Updates Active
          </div>
        </div>

        <div className="mb-10 bg-gray-100/50 dark:bg-gray-800/50 p-2 rounded-3xl inline-flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${
                  active
                    ? 'bg-white dark:bg-gray-900 text-accent-blue shadow-medium scale-105'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-accent-blue' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div>
          {activeTab === 'trends' && <AdminTrends />}
          {activeTab === 'family' && <AdminFamilyMembers />}
          {activeTab === 'events' && <AdminEvents />}
          {activeTab === 'gallery' && <AdminGallery />}
        </div>
      </div>
    </Layout>
  );
};

