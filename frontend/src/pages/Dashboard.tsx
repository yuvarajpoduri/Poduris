import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { familyMembersAPI } from "../utils/api";
import type { DashboardStats } from "../types";
import { format } from "date-fns";
import { 
  Users, 
  GitBranch, 
  Calendar as CalendarIcon, 
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { formatPoduriName } from "../utils/formatUtils";
import { BirthdayBalloons } from "../components/BirthdayBalloons";
import { LoadingScreen } from "../components/LoadingScreen";


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
            <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden border-2 border-white dark:border-white/10 shadow-sm shrink-0`}>
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
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-white dark:border-white/10 shadow-sm shrink-0`}>
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
            className="h-full p-6 rounded-[2rem] bg-white dark:bg-black border border-gray-100 dark:border-white/10 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-300 relative overflow-hidden active:scale-95"
        >
            {/* Background Splash - Always visible now */}
            <div className={`absolute top-0 right-0 w-48 h-48 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 ${colorClass}`}></div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg ${colorClass}`}>
                    <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1 leading-relaxed">
                    {desc}
                </p>
                
                <div className="flex items-center text-sm font-bold text-gray-900 dark:text-white mt-auto">
                    <span>Open</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                </div>
            </div>
        </motion.div>
    </Link>
);

const EventRow = ({ title, date, daysUntil, type, avatar }: any) => (
    <div className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-transparent hover:border-gray-200 dark:hover:border-white/5 transition-all duration-300 group cursor-pointer">
        <AvatarDisplay url={avatar} name={title} size="md" />
        
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg">{title}</h4>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mt-0.5">
               <span className={`uppercase tracking-wider ${
                   type === 'birthday' ? 'text-orange-500' : 'text-pink-500'
               }`}>{type}</span>
               <span className="text-gray-300 dark:text-gray-600">•</span>
               <span className="text-gray-400">{format(new Date(date), "MMM d")}</span>
            </div>
        </div>
        
        <div className="text-right shrink-0">
             <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide ${
                 daysUntil === 0 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-100 dark:border-white/10'
             }`}>
                 {daysUntil === 0 ? 'Today' : `${daysUntil}d`}
             </span>
        </div>
    </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalGenerations: 0,
    upcomingBirthdays: [],
    upcomingAnniversaries: []
  });
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

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

  // Combine and sort events
  const allUpcoming = [
      ...stats.upcomingBirthdays.map(b => ({ ...b, type: 'birthday' as const, date: b.nextBirthday, title: formatPoduriName(b.name), avatar: (b as any).avatar })),
      ...stats.upcomingAnniversaries.map(a => ({ ...a, type: 'anniversary' as const, date: a.anniversaryDate, title: `${formatPoduriName(a.member1)} & ${formatPoduriName(a.member2)}`, avatar: undefined as string | undefined }))
  ].filter(e => e.daysUntil >= 0)
   .sort((a, b) => a.daysUntil - b.daysUntil)
   .slice(0, 5); // Just show top 5

  const birthdayPeople = allUpcoming.filter(e => e.type === 'birthday' && e.daysUntil === 0);

  useEffect(() => {
    if (birthdayPeople.length > 0) {
      const today = new Date().toDateString();
      const lastShown = localStorage.getItem('balloons_shown_date');
      
      if (lastShown !== today) {
        setShowCelebration(true);
        localStorage.setItem('balloons_shown_date', today);
      }
    }
  }, [birthdayPeople.length]);

  const [minLoading, setMinLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || minLoading) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <BirthdayBalloons active={showCelebration} />
      
      <div className="space-y-8 pb-12">
        


        
        {/* HERO SECTION - Premium Deep Dark Theme */}
        <div className="relative rounded-[2rem] overflow-hidden bg-black dark:bg-black text-white shadow-2xl ring-1 ring-white/10">
            {/* Sophisticated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-black z-0"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
            
            {/* Grid Pattern overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            <div className="relative z-10 p-8 sm:p-12 lg:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
                <div className="space-y-6 max-w-2xl relative">
                     <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-bold tracking-widest uppercase text-indigo-300 shadow-lg"
                     >
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span>Family Hub</span>
                     </motion.div>
                     
                     <div className="space-y-2">
                         <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-none"
                         >
                            {greeting},
                         </motion.h1>
                         <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-thin tracking-tight text-white/60"
                         >
                            {user?.name ? formatPoduriName(user.name).split(' ')[0] : 'Friend'}.
                         </motion.h2>
                     </div>
                     
                     <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg text-gray-400 font-medium max-w-lg leading-relaxed pl-1 border-l-4 border-indigo-500/50"
                     >
                        Your family legacy spans <span className="text-white font-bold">{stats.totalGenerations} generations</span> with <span className="text-white font-bold">{stats.totalMembers} members</span> preserving your history.
                     </motion.p>
                </div>

                {/* Quick Action / Highlight Card */}
                {allUpcoming.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="w-full md:w-80"
                    >
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-colors duration-300">
                             <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Up Next</span>
                                <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-300">
                                    <CalendarIcon className="w-4 h-4" />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-5">
                                <AvatarDisplay url={allUpcoming[0].avatar} name={allUpcoming[0].title} size="md" />
                                <div>
                                    <p className="font-bold text-xl leading-none mb-1">{allUpcoming[0].title}</p>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                                        allUpcoming[0].type === 'birthday' ? 'bg-orange-500/20 text-orange-300' : 'bg-pink-500/20 text-pink-300'
                                    }`}>
                                        {allUpcoming[0].type}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-stretch gap-2">
                                <div className="flex-1 bg-black/20 rounded-xl p-3 text-center border border-white/5">
                                    <p className="text-xl font-black text-white">
                                        {allUpcoming[0].daysUntil === 0 ? "NOW" : allUpcoming[0].daysUntil}
                                    </p>
                                    <p className="text-[10px] text-white/40 font-bold uppercase">
                                        {allUpcoming[0].daysUntil === 0 ? "Happy!" : "Days Left"}
                                    </p>
                                </div>
                                <div className="flex-1 bg-black/20 rounded-xl p-3 text-center border border-white/5 flex flex-col justify-center">
                                    <p className="text-xs font-bold text-white/80">
                                        {format(new Date(allUpcoming[0].date), "MMM d")}
                                    </p>
                                    <p className="text-[10px] text-white/40 font-bold uppercase">Date</p>
                                </div>
                            </div>
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
                title="Lineage"
                desc="Visualize your roots."
                colorClass="bg-emerald-500" // Cleaner, solid accent color logic for hover
                delay={0.5}
            />
            <QuickLinkCard 
                to="/gallery"
                icon={ImageIcon}
                title="Memories"
                desc="Cherished moments."
                colorClass="bg-blue-500"
                delay={0.6}
            />
            <QuickLinkCard 
                to="/calendar"
                icon={CalendarIcon}
                title="Events"
                desc="Upcoming celebrations."
                colorClass="bg-orange-500"
                delay={0.7}
            />
        </div>

        {/* UPCOMING EVENTS LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="lg:col-span-2 bg-white dark:bg-black rounded-[2rem] p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-white/10"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>Celebrations</span>
                    </h3>
                    <Link to="/calendar" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </Link>
                </div>
                
                <div className="space-y-4">
                    {allUpcoming.length > 0 ? (
                        allUpcoming.map((event, i) => (
                            <EventRow 
                                key={i}
                                title={event.title}
                                date={event.date}
                                daysUntil={event.daysUntil}
                                type={event.type}
                                avatar={event.avatar} 
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 dark:text-gray-600">
                            <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-medium">No upcoming events found.</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* QUICK STATS / INFO */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="bg-black text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden flex flex-col"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-8 relative z-10">Snapshot</h3>
                
                <div className="space-y-8 flex-1 relative z-10">
                    <div>
                         <p className="text-6xl font-black tracking-tighter mb-2">{stats.totalMembers}</p>
                         <div className="flex items-center gap-2 text-indigo-300">
                             <Users className="w-4 h-4" />
                             <span className="font-bold text-sm uppercase tracking-wide">Family Members</span>
                         </div>
                    </div>
                    
                    <div className="h-px bg-white/10"></div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <p className="text-3xl font-bold text-white">{stats.totalGenerations}</p>
                             <p className="text-gray-500 text-xs font-bold uppercase mt-1">Generations</p>
                        </div>
                        <div>
                             <p className="text-3xl font-bold text-white">{stats.upcomingBirthdays.length}</p>
                             <p className="text-gray-500 text-xs font-bold uppercase mt-1">Birthdays</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                    <p className="text-xs text-center text-gray-500">
                        Poduris Family Legacy &bull; {new Date().getFullYear()}
                    </p>
                </div>
            </motion.div>
        </div>

      </div>
    </Layout>
  );
};
