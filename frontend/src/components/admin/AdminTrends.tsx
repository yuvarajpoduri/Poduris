import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Activity, MapPin, MousePointer2, RefreshCw, 
  MessageCircle, Image as ImageIcon, Database, Server,
  PieChart as PieChartIcon, BarChart3, Globe, Eye, EyeOff, Clock
} from 'lucide-react';
import api from '../../utils/api';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface ActiveUser {
  _id: string;
  name: string;
  nickname: string;
  avatar: string;
  currentPath: string;
  lastActive: string;
}

interface RegisteredUser {
  _id: string;
  name: string;
  nickname: string;
  email: string;
  avatar: string;
  type: 'admin' | 'member';
}

interface UsageUser {
  _id: string;
  name: string;
  nickname?: string;
  avatar: string;
  sessionTimeToday: number;
  sessionTimeMonthly: number;
  sessionTimeYearly: number;
}

interface StatsData {
  totalUsers: number;
  activeUsersCount: number;
  activeUsers: ActiveUser[];
  registeredUsers: RegisteredUser[];
  dailyUsage: UsageUser[];
  monthlyUsage: UsageUser[];
  yearlyUsage: UsageUser[];
  topPages: { path: string; count: number }[];
  roleStats: { name: string; value: number }[];
  genderStats: { name: string; value: number }[];
  generationStats: { name: string; value: number }[];
  recentActivity: {
    messages24h: number;
    uploads24h: number;
    pendingUploads: number;
  };
  growthStats: { date: string; users: number }[];
  systemInfo: {
    uptime: number;
    memory: number;
    platform: string;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const cleanName = (name: string) => {
  if (!name) return '';
  const cleaned = name.replace(/Poduri/gi, '').trim();
  return cleaned || 'Poduri';
};

const formatTime = (seconds: number) => {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 0) return `${hours}h ${remainingMins}m`;
  return `${mins}m`;
};

const safeDate = (dateVal: any) => {
  if (!dateVal) return new Date();
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const AdminTrends: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [usageType, setUsageType] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchStats = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get('/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = () => {
    setIsLive(true);
    fetchStats(true);
  };

  const handleResetPassword = async (user: RegisteredUser) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const endpoint = user.type === 'admin' 
        ? `/users/${user._id}/reset-password`
        : `/family-members/${user._id}/reset-password`;
      
      await api.put(endpoint, { password: newPassword });
      alert('Password reset successfully');
      setResettingPassword(null);
      setNewPassword('');
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Failed to reset password');
    }
  };

  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => fetchStats(false), 10000); // Poll every 10s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  if (!isLive) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-large border border-gray-100 dark:border-gray-700 text-center max-w-md w-full">
           <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-accent-blue mx-auto mb-6">
              <Activity className="w-10 h-10" />
           </div>
           <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Live Statistics Paused</h2>
           <p className="text-gray-500 font-medium mb-8 leading-relaxed">
             Fetching real-time data is disabled to optimize performance. Click below to start live tracking.
           </p>
           <button 
             onClick={handleGoLive}
             className="w-full bg-accent-blue text-white py-4 rounded-2xl font-black text-lg shadow-medium hover:shadow-large hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
           >
             <TrendingUp className="w-6 h-6" />
             Show Live Statistics
           </button>
           <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-6 font-bold">100% Accurate Data Stream</p>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/50">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const filteredUsers = stats.registeredUsers.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.nickname && u.nickname.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-accent-blue">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Users</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalUsers}</div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Registered family members</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-2xl text-accent-green">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Now</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.activeUsersCount}</div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Users online in last 5m</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl text-purple-600">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chat Activity</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.recentActivity.messages24h}</div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Messages in last 24h</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-2xl text-accent-orange">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gallery</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.recentActivity.uploads24h}</div>
          <p className="text-xs text-gray-500 mt-2 font-medium">{stats.recentActivity.pendingUploads} pending approval</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Growth Chart */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent-blue" /> User Growth
                </h3>
                <p className="text-sm text-gray-500 font-medium">New registrations over the last 7 days</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Live Updates</span>
              </div>
            </div>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.growthStats}>
                  <defs>
                    <linearGradient id="colorUsersMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    tick={{ fill: '#9CA3AF' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      return date.toLocaleDateString(undefined, { weekday: 'short' });
                    }}
                  />
                  <YAxis fontSize={12} tick={{ fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '16px', 
                      color: '#fff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorUsersMain)" 
                    strokeWidth={4}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Generations Chart */}
             <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent-orange" /> Generations
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.generationStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24}>
                        {stats.generationStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Gender Dist */}
             <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-accent-green" /> Gender Distribution
                </h3>
                <div className="h-[250px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.genderStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.genderStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="text-2xl font-black text-gray-300 dark:text-gray-600">🚻</span>
                  </div>
                </div>
             </div>
          </div>

          {/* User Management Box */}
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700">
             <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
                <div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-accent-blue" /> User Management
                   </h3>
                   <p className="text-sm text-gray-500 font-medium">Search and manage registered user accounts</p>
                </div>
                <div className="relative w-full xl:w-64">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-gray-400" />
                   </div>
                   <input
                     type="text"
                     placeholder="Search users..."
                     value={userSearch}
                     onChange={(e) => setUserSearch(e.target.value)}
                     className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-900 text-sm focus:ring-accent-blue focus:border-accent-blue transition-colors"
                   />
                </div>
             </div>

             <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2 -mr-2">
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                   {filteredUsers.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 font-medium italic">No users matching your search</div>
                   ) : (
                      filteredUsers.map(user => (
                        <div key={user._id} className="py-5 first:pt-0 last:pb-0">
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                 <div className="relative flex-shrink-0">
                                   {user.avatar ? (
                                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700" />
                                   ) : (
                                      <div className="w-12 h-12 rounded-full bg-accent-blue/10 flex items-center justify-center text-sm font-bold text-accent-blue border-2 border-accent-blue/20">
                                         {(user.nickname || user.name).charAt(0)}
                                      </div>
                                   )}
                                   <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${user.type === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-0.5">
                                       <h4 className="text-sm font-black text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                                          {cleanName(user.name)}
                                       </h4>
                                       {user.nickname && (
                                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded-md truncate max-w-[80px]">
                                             {user.nickname}
                                          </span>
                                       )}
                                       <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${
                                          user.type === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                       }`}>
                                          {user.type}
                                       </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium truncate opacity-80">{user.email}</p>
                                 </div>
                              </div>
                              <button 
                                onClick={() => {
                                   setResettingPassword(resettingPassword === user._id ? null : user._id);
                                   setNewPassword('');
                                   if (resettingPassword !== user._id) {
                                      setShowPasswords(prev => ({ ...prev, [user._id]: false }));
                                   }
                                }}
                                className="sm:w-auto w-full px-5 py-2.5 text-xs font-black text-accent-blue bg-accent-blue/5 hover:bg-accent-blue/10 rounded-xl transition-all border border-accent-blue/20 uppercase tracking-widest active:scale-95"
                              >
                                {resettingPassword === user._id ? 'Close' : 'Reset password'}
                              </button>
                           </div>
                           
                           {resettingPassword === user._id && (
                             <motion.div 
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               className="mt-4 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800/80"
                             >
                                <div className="flex flex-col lg:flex-row gap-3">
                                   <div className="relative flex-1">
                                      <input 
                                        type={showPasswords[user._id] ? 'text' : 'password'}
                                        placeholder="New pass (6+ chars)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-11 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all outline-none"
                                      />
                                      <button 
                                        type="button"
                                        onClick={() => togglePasswordVisibility(user._id)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-accent-blue transition-colors"
                                      >
                                         {showPasswords[user._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                   </div>
                                   <button 
                                     onClick={() => handleResetPassword(user)}
                                     className="bg-accent-blue text-white px-8 py-3 rounded-xl font-black text-sm shadow-medium hover:shadow-large transition-all uppercase tracking-widest active:scale-95 whitespace-nowrap"
                                   >
                                     Update
                                   </button>
                                </div>
                             </motion.div>
                           )}
                        </div>
                      ))
                   )}
                 </div>
              </div>
           </div>

           {/* Top Pages List */}
           <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                 <Globe className="w-5 h-5 text-accent-blue" /> Popular Pages
              </h3>
              <div className="space-y-4">
                 {stats.topPages.map((page, idx) => (
                   <div key={page.path} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-transparent dark:border-gray-700/50">
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center font-bold text-accent-blue shadow-sm border border-gray-100 dark:border-gray-700">
                            {idx + 1}
                         </div>
                         <span className="font-mono text-sm text-gray-700 dark:text-gray-200">{page.path}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className="h-full bg-accent-blue" 
                              style={{ width: `${(page.count / Math.max(...stats.topPages.map(p => p.count))) * 100}%` }} 
                            />
                         </div>
                         <span className="text-sm font-bold text-gray-900 dark:text-white">{page.count} visits</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Sidebar: Real-time Users + System Info */}
        <div className="space-y-8">
           {/* Active Users */}
           <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                 <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-widest text-xs">
                    <MousePointer2 className="w-4 h-4 text-accent-blue" /> Live Activity
                 </h3>
                 <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="space-y-5">
                  {stats.activeUsers.length === 0 ? (
                    <div className="text-sm text-gray-500 py-8 text-center italic">No active users found</div>
                  ) : (
                    stats.activeUsers.map(u => (
                      <div key={u._id} className="flex items-start gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full border-2 border-accent-blue object-cover shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-sm font-bold text-accent-blue border-2 border-accent-blue">
                            {(u.nickname || cleanName(u.name)).charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-none mb-1">{u.nickname || cleanName(u.name)}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate lowercase font-medium">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{u.currentPath}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">
                            {formatDistanceToNow(safeDate(u.lastActive), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
           </div>

           {/* Usage Analysis List */}
           <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
                 <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-widest text-xs">
                       <Clock className="w-4 h-4 text-accent-orange" /> Usage Analysis
                    </h3>
                    <span className="text-[10px] font-black text-gray-400">SESSION TIME</span>
                 </div>
                 
                 <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl">
                    {(['daily', 'monthly', 'yearly'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setUsageType(type)}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                          usageType === type 
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                 </div>
              </div>
              
              <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  {(!stats[usageType === 'daily' ? 'dailyUsage' : usageType === 'monthly' ? 'monthlyUsage' : 'yearlyUsage'] || 
                   stats[usageType === 'daily' ? 'dailyUsage' : usageType === 'monthly' ? 'monthlyUsage' : 'yearlyUsage'].length === 0) ? (
                    <div className="text-xs text-gray-500 py-4 text-center italic">No usage logged for this period</div>
                  ) : (
                    stats[usageType === 'daily' ? 'dailyUsage' : usageType === 'monthly' ? 'monthlyUsage' : 'yearlyUsage'].map(u => (
                      <div key={u._id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-accent-orange/10 flex items-center justify-center text-xs font-bold text-accent-orange">
                              {(u.nickname || cleanName(u.name)).charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{u.nickname || cleanName(u.name)}</p>
                            <p className="text-[10px] text-gray-500 font-medium capitalize">{usageType} activity</p>
                          </div>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-xl border border-transparent group-hover:border-accent-orange/20 transition-all">
                          <span className="text-xs font-black text-accent-orange">
                            {formatTime(usageType === 'daily' ? u.sessionTimeToday : usageType === 'monthly' ? u.sessionTimeMonthly : u.sessionTimeYearly)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
           </div>

           {/* System Tech Stats */}
           <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 shadow-large text-white space-y-6">
              <h3 className="font-bold flex items-center gap-2 uppercase tracking-widest text-[10px] text-gray-400">
                 <Server className="w-4 h-4" /> System Health
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-xs mb-2">
                       <span className="font-medium text-gray-400">Memory Usage</span>
                       <span className="font-bold">{(stats.systemInfo.memory / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: '45%' }}
                         className="h-full bg-accent-blue rounded-full" 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                       <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Uptime</p>
                       <p className="text-sm font-black">{(stats.systemInfo.uptime / 3600).toFixed(1)} hrs</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                       <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Platform</p>
                       <p className="text-sm font-black capitalize">{stats.systemInfo.platform}</p>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-accent-blue/20 rounded-xl text-accent-blue">
                          <Database className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-xs font-bold leading-none mb-1">Database</p>
                          <p className="text-[10px] text-gray-500 font-medium">Synced & Healthy</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
