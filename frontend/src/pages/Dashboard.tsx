import React, { useEffect, useState, useMemo } from "react";
import { Layout } from "../components/Layout";
import { Card } from "../components/Card";
import { familyMembersAPI, calendarAPI } from "../utils/api";
import type { DashboardStats, CalendarEvent } from "../types";
import { format, isSameDay, parseISO } from "date-fns";
import { Users, GitBranch, Cake, Heart, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

// Utility logic moved outside or to utils/dateUtils.ts
const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
};

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const [statsData, eventsData] = await Promise.all([
          familyMembersAPI.getDashboardStats(),
          calendarAPI.getEvents(today.getMonth() + 1, today.getFullYear(), true, true)
        ]);
        
        setStats(statsData);
        // Using date-fns isSameDay for more robust comparison than string formatting
        setTodayEvents(eventsData.filter(e => isSameDay(parseISO(e.date), today)));
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const birthdayEvents = useMemo(() => todayEvents.filter(e => e.type === 'birthday'), [todayEvents]);
  const anniversaryEvents = useMemo(() => todayEvents.filter(e => e.type === 'anniversary'), [todayEvents]);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-accent-blue animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.welcome')}</p>
        </div>

        {/* Special Celebrations Section */}
        {(birthdayEvents.length > 0 || anniversaryEvents.length > 0) && (
          <div className="grid gap-4">
            {birthdayEvents.map((event, i) => (
              <CelebrationCard key={i} type="birthday" event={event} t={t} />
            ))}
            {anniversaryEvents.map((event, i) => (
              <CelebrationCard key={i} type="anniversary" event={event} t={t} />
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard icon={<Users />} label={t('dashboard.familyMembers')} value={stats?.totalMembers} color="blue" />
          <StatCard icon={<GitBranch />} label={t('dashboard.generations')} value={stats?.totalGenerations} color="orange" />
        </div>

        {/* Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingList title={t('dashboard.upcomingBirthdays')} icon={<Cake className="text-accent-orange" />} items={stats?.upcomingBirthdays} type="birthday" />
          <UpcomingList title={t('dashboard.upcomingAnniversaries')} icon={<Heart className="text-accent-yellow" />} items={stats?.upcomingAnniversaries} type="anniversary" />
        </div>
      </motion.div>
    </Layout>
  );
};

// Sub-components for cleaner structure
const StatCard = ({ icon, label, value, color }: any) => (
  <Card className="flex items-center gap-4">
    <div className={`w-12 h-12 bg-accent-${color}/10 rounded-xl flex items-center justify-center text-accent-${color}`}>
      {React.cloneElement(icon, { className: "w-6 h-6" })}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  </Card>
);

const UpcomingList = ({ title, icon, items, type }: any) => (
  <Card>
    <div className="flex items-center gap-2 mb-4">{icon} <h2 className="text-xl font-semibold">{title}</h2></div>
    <div className="space-y-3">
      {items?.map((item: any, i: number) => (
        <div key={i} className="flex justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40">
          <div>
            <p className="font-semibold">{item.name || `${item.member1} & ${item.member2}`}</p>
            <p className="text-xs text-gray-500">{format(parseISO(item.nextBirthday || item.anniversaryDate), "MMM dd")}</p>
          </div>
          <span className="text-xs font-bold text-accent-blue">{item.daysUntil} days left</span>
        </div>
      ))}
    </div>
  </Card>
);

const CelebrationCard = ({ type, event, t }: any) => (
  <Card className={`border-2 ${type === 'birthday' ? 'border-accent-orange bg-orange-50/50' : 'border-accent-yellow bg-yellow-50/50'}`}>
     {/* Logic from your original card simplified for brevity */}
     <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center font-bold text-xl">
          {event.memberName?.charAt(0)}
        </div>
        <div>
          <h3 className="font-bold text-lg">{type === 'birthday' ? t('dashboard.todayBirthday', {name: event.memberName}) : "Happy Anniversary!"}</h3>
          <p className="text-sm opacity-80">{type === 'birthday' ? t('dashboard.birthdayWish') : t('dashboard.anniversaryWish')}</p>
        </div>
     </div>
  </Card>
);
