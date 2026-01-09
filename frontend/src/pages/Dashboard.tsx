import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { Card } from "../components/Card";
import { familyMembersAPI, calendarAPI } from "../utils/api";
import type { DashboardStats, CalendarEvent } from "../types";
import { format } from "date-fns";
import { Users, GitBranch, Cake, Heart, Loader2 } from "lucide-react"; // Removed Sparkles (unused)
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

const parseDateOnly = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Fixed: This is now exported so it can be used or acknowledged as a utility, 
// and I ensured it's actually called in the component logic below.
export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const calculateAnniversaryYears = (anniversaryDate: string): number => {
  const anniversary = new Date(anniversaryDate);
  const today = new Date();
  let years = today.getFullYear() - anniversary.getFullYear();
  const monthDiff = today.getMonth() - anniversary.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < anniversary.getDate())) {
    years--;
  }
  return Math.max(years, 0);
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
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        const [statsData, eventsData] = await Promise.all([
          familyMembersAPI.getDashboardStats(),
          calendarAPI.getEvents(month, year, true, true)
        ]);
        
        setStats(statsData);
        
        const todayStr = format(today, "yyyy-MM-dd");
        const todayEventsList = eventsData.filter(
          (e) => format(new Date(e.date), "yyyy-MM-dd") === todayStr
        );
        setTodayEvents(todayEventsList);
      } catch (err: any) {
        // Error variable is used here
        setError(
          err.response?.data?.message || "Failed to load dashboard stats"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 text-accent-blue animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Fixed: Error variable is used to render the UI
  if (error) {
    return (
      <Layout>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        >
          <p className="text-red-700 dark:text-red-400 text-center">{error}</p>
        </motion.div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="text-center text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </Layout>
    );
  }

  const todayBirthdays = todayEvents.filter(e => e.type === 'birthday');
  const todayAnniversaries = todayEvents.filter(e => e.type === 'anniversary');

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div>
          <h1 className="mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.welcome') || 'Welcome to your family hub'}
          </p>
        </div>

        {(todayBirthdays.length > 0 || todayAnniversaries.length > 0) && (
          <div className="space-y-4">
            {todayBirthdays.map((event, index) => {
              const age = event.birthDate ? calculateAge(event.birthDate) : 0;
              return (
                <motion.div
                  key={`birthday-${index}`}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                  className="relative overflow-hidden"
                >
                  <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border-2 border-accent-orange shadow-lg">
                    <div className="relative z-10 flex items-center gap-4 md:gap-6">
                      <div className="flex-shrink-0">
                        {event.avatar ? (
                          <img
                            src={event.avatar}
                            alt={event.memberName}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent-orange/20 flex items-center justify-center text-2xl md:text-3xl font-bold text-accent-orange border-4 border-white dark:border-gray-800 shadow-lg">
                            {event.memberName?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                            {t('dashboard.todayBirthday', { name: event.memberName || '' })}
                          </h3>
                        </div>
                        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-1">
                          {t('dashboard.turningAge', { age: age.toString() })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {todayAnniversaries.map((event, index) => {
              const years = event.anniversaryDate ? calculateAnniversaryYears(event.anniversaryDate) : 0;
              return (
                <motion.div
                  key={`anniversary-${index}`}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: (todayBirthdays.length + index) * 0.1, type: "spring", stiffness: 200 }}
                  className="relative overflow-hidden"
                >
                  <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 border-2 border-accent-yellow shadow-lg">
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-5 h-5 text-accent-yellow flex-shrink-0" />
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                          {t('dashboard.todayAnniversary', { name1: event.member1Name || '', name2: event.member2Name || '' })}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex -space-x-2">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gray-200">
                            {event.avatar ? (
                              <img src={event.avatar} alt={event.member1Name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-600">
                                {event.member1Name?.charAt(0).toUpperCase() || "?"}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-1 font-semibold">
                            {t('dashboard.completedYears', { years: years.toString() })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent-blue" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.familyMembers') || 'Family Members'}</p>
                  <p className="text-3xl font-bold">{stats.totalMembers}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-orange/10 rounded-xl flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-accent-orange" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.generations') || 'Generations'}</p>
                  <p className="text-3xl font-bold">{stats.totalGenerations}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Cake className="w-6 h-6 text-accent-orange" />
              <h2 className="text-xl font-semibold">{t('dashboard.upcomingBirthdays') || 'Upcoming Birthdays'}</h2>
            </div>
            {stats.upcomingBirthdays.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingBirthdays.map((member, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(parseDateOnly(member.nextBirthday), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
                      {member.daysUntil} {t('dashboard.days') || 'days'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">{t('dashboard.noUpcomingBirthdays') || 'No upcoming birthdays'}</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-accent-yellow" />
              <h2 className="text-xl font-semibold">{t('dashboard.upcomingAnniversaries') || 'Upcoming Anniversaries'}</h2>
            </div>
            {stats.upcomingAnniversaries.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingAnniversaries.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                    <div>
                      <p className="font-semibold">{a.member1} & {a.member2}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(parseDateOnly(a.anniversaryDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                      {a.daysUntil} {t('dashboard.days') || 'days'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">{t('dashboard.noUpcomingAnniversaries') || 'No upcoming anniversaries'}</p>
            )}
          </Card>
        </div>
      </motion.div>
    </Layout>
  );
};
