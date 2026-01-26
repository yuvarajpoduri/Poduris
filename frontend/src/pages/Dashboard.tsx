import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { familyMembersAPI, calendarAPI } from "../utils/api";
import type { DashboardStats, CalendarEvent } from "../types";
import { format } from "date-fns";
import { 
  Users, 
  GitBranch, 
  Cake, 
  Heart, 
  Loader2, 
  Calendar as CalendarIcon, 
  Image as ImageIcon,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

// --- Helper Components for the new Moody Look ---

const AvatarDisplay = ({ url, name, size = "md" }: { url?: string, name: string, size?: "sm" | "md" | "lg" | "xl" }) => {
    const [error, setError] = useState(false);
    
    // Size maps
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-12 h-12 text-base",
        lg: "w-16 h-16 text-lg",
        xl: "w-24 h-24 text-2xl"
    };

    if (url && !error) {
        return (
            <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm shrink-0`}>
                <img 
                    src={url} 
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setError(true)}
                />
            </div>
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-white dark:border-gray-700 shadow-sm shrink-0`}>
            {name?.charAt(0)?.toUpperCase() || "?"}
        </div>
    );
};

const QuickLinkCard = ({ to, icon: Icon, title, desc, colorClass, delay }: any) => (
    <Link to={to} className="block group">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="h-full p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl transition-all duration-300 relative overflow-hidden group-hover:-translate-y-1"
        >
            {/* Hover Background Splash */}
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl -mr-16 -mt-16 transition-opacity group-hover:opacity-20 ${colorClass}`}></div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg ${colorClass}`}>
                    <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 leading-relaxed">
                    {desc}
                </p>
                
                <div className="flex items-center text-sm font-bold text-gray-900 dark:text-white group-hover:gap-2 transition-all">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </motion.div>
    </Link>
);

const EventRow = ({ title, date, daysUntil, type, avatar }: any) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 group">
        <AvatarDisplay url={avatar} name={title} size="md" />
        
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 dark:text-white truncate">{title}</h4>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-0.5">
               <span className={`uppercase tracking-wider ${
                   type === 'birthday' ? 'text-orange-500' : 'text-pink-500'
               }`}>{type}</span>
               <span>•</span>
               <span>{format(new Date(date), "MMM d, yyyy")}</span>
            </div>
        </div>
        
        <div className="text-right shrink-0">
             <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                 daysUntil === 0 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse' 
                    : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 shadow-sm'
             }`}>
                 {daysUntil === 0 ? 'Today!' : `${daysUntil} days`}
             </span>
        </div>
    </div>
);

// --- Main Dashboard Component ---

const parseDateOnly = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalGenerations: 0,
    upcomingBirthdays: [],
    upcomingAnniversaries: []
  });
  const [loading, setLoading] = useState(true);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statsData = await familyMembersAPI.getDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-indigo-900/50 dark:text-indigo-200/50 font-medium animate-pulse">
                Preparing your personal hub...
            </p>
        </div>
      </Layout>
    );
  }

  // Combine and sort events
  const allUpcoming = [
      ...stats.upcomingBirthdays.map(b => ({ ...b, type: 'birthday', date: b.nextBirthday, title: b.name })),
      ...stats.upcomingAnniversaries.map(a => ({ ...a, type: 'anniversary', date: a.anniversaryDate, title: `${a.member1} & ${a.member2}` }))
  ].filter(e => e.daysUntil >= 0)
   .sort((a, b) => a.daysUntil - b.daysUntil)
   .slice(0, 5); // Just show top 5

  return (
    <Layout>
      <div className="space-y-10 pb-12">
        
        {/* HERO SECTION */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gray-900 text-white shadow-2xl">
            {/* Atmospheric Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black z-0"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none mix-blend-screen"></div>

            <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="space-y-4 max-w-2xl">
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold tracking-wider uppercase text-indigo-200"
                     >
                        <Sparkles className="w-3 h-3" />
                        <span>Family Hub</span>
                     </motion.div>
                     
                     <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
                     >
                        {greeting}, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200">
                            {user?.name?.split(' ')[0] || 'Friend'}
                        </span>.
                     </motion.h1>
                     
                     <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-indigo-200/80 font-medium max-w-lg leading-relaxed"
                     >
                        Your family legacy is growing. You have <span className="text-white font-bold">{stats.totalMembers} family members</span> across <span className="text-white font-bold">{stats.totalGenerations} generations</span>.
                     </motion.p>
                </div>

                {/* Quick Action / Highlight Card */}
                {allUpcoming.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="w-full md:w-80 bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Up Next</span>
                            <CalendarIcon className="w-4 h-4 text-indigo-200" />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                            <AvatarDisplay url={allUpcoming[0].avatar} name={allUpcoming[0].title} size="md" />
                            <div>
                                <p className="font-bold text-lg leading-tight">{allUpcoming[0].title}</p>
                                <p className="text-xs text-indigo-200 mt-0.5 uppercase font-medium">{allUpcoming[0].type}</p>
                            </div>
                        </div>
                        
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <p className="text-sm font-medium">
                                {allUpcoming[0].daysUntil === 0 ? "Happening Today!" : `In ${allUpcoming[0].daysUntil} Days`}
                            </p>
                            <p className="text-xs text-indigo-300 opacity-70">
                                {format(new Date(allUpcoming[0].date), "EEEE, MMM d")}
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>

        {/* NAVIGATION & STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickLinkCard 
                to="/family-tree"
                icon={GitBranch}
                title="Family Tree"
                desc="Explore the lineage and connections of your ancestors and descendants in an interactive tree."
                colorClass="bg-gradient-to-br from-emerald-400 to-teal-600"
                delay={0.4}
            />
            <QuickLinkCard 
                to="/gallery"
                icon={ImageIcon}
                title="Gallery"
                desc="A visual archive of cherished memories. Upload and browse high-quality family photos."
                colorClass="bg-gradient-to-br from-blue-400 to-indigo-600"
                delay={0.5}
            />
            <QuickLinkCard 
                to="/calendar"
                icon={CalendarIcon}
                title="Calendar"
                desc="Never miss a birthday or anniversary. sync with celebrations and plan ahead."
                colorClass="bg-gradient-to-br from-orange-400 to-rose-600"
                delay={0.6}
            />
        </div>

        {/* UPCOMING EVENTS LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-gray-700"
            >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Upcoming Celebrations
                </h3>
                
                <div className="space-y-3">
                    {allUpcoming.length > 0 ? (
                        allUpcoming.map((event, i) => (
                            <EventRow 
                                key={i}
                                title={event.title}
                                date={event.date}
                                daysUntil={event.daysUntil}
                                type={event.type}
                                avatar={event.avatar} // Ensure your API returns this in stats! If not, fallback works.
                            />
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No upcoming events soon.</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                    <Link to="/calendar" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        View Full Calendar <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </motion.div>

            {/* QUICK STATS / INFO */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="bg-gray-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-center"
            >
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                
                <div className="relative z-10 text-center space-y-8">
                    <div>
                         <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                             <Users className="w-8 h-8 text-indigo-300" />
                         </div>
                         <h3 className="text-4xl font-black mb-2">{stats.totalMembers}</h3>
                         <p className="text-indigo-300 font-medium uppercase tracking-widest text-xs">Family Members</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                        <div>
                             <p className="text-2xl font-bold">{stats.totalGenerations}</p>
                             <p className="text-indigo-300 text-xs">Generations</p>
                        </div>
                        <div>
                             <p className="text-2xl font-bold">{stats.upcomingBirthdays.length + stats.upcomingAnniversaries.length}</p>
                             <p className="text-indigo-300 text-xs">Events this Year</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

      </div>
    </Layout>
  );
};
