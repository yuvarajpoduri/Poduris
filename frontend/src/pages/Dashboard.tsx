import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { Card } from "../components/Card";
import { familyMembersAPI } from "../utils/api";
import type { DashboardStats } from "../types";
import { format } from "date-fns";
import { Users, GitBranch, Cake, Heart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const parseDateOnly = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await familyMembersAPI.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load dashboard stats"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div>
          <h1 className="mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your family hub
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent-blue" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Family Members
                  </p>
                  <p className="text-3xl font-bold">{stats.totalMembers}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-orange/10 rounded-xl flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-accent-orange" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generations
                  </p>
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
              <h2 className="text-xl font-semibold">Upcoming Birthdays</h2>
            </div>

            {stats.upcomingBirthdays.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingBirthdays.map((member, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20"
                  >
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(
                          parseDateOnly(member.nextBirthday),
                          "MMM dd, yyyy"
                        )}
                      </p>
                    </div>
                    <span className="badge badge-orange">
                      {member.daysUntil} days
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No upcoming birthdays</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-accent-yellow" />
              <h2 className="text-xl font-semibold">Upcoming Anniversaries</h2>
            </div>

            {stats.upcomingAnniversaries.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingAnniversaries.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20"
                  >
                    <div>
                      <p className="font-semibold">
                        {a.member1} & {a.member2}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(
                          parseDateOnly(a.anniversaryDate),
                          "MMM dd, yyyy"
                        )}
                      </p>
                    </div>
                    <span className="badge badge-yellow">
                      {a.daysUntil} days
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No upcoming anniversaries
              </p>
            )}
          </Card>
        </div>
      </motion.div>
    </Layout>
  );
};
