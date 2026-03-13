import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { familyMembersAPI, announcementsAPI, statusAPI } from "../utils/api";
import type { DashboardStats, Announcement } from "../types";
import type { StatusUser } from "../utils/api";
import { format } from "date-fns";
import { 
  Users, 
  GitBranch, 
  Calendar as CalendarIcon, 
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Cake,
  Heart,
  Megaphone,
  Video,
  TreePine,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { formatPoduriName } from "../utils/formatUtils";
import { LoadingScreen } from "../components/LoadingScreen";
import { Confetti } from "../components/Confetti";
import { BirthdayCard } from "../components/BirthdayCard";
import { StatusRing, AddStatusButton, StatusViewer, StatusUploadModal } from "../components/Status";


// --- Smooth stagger container ---
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
};

// --- Helper Components ---

const AvatarDisplay = ({ url, name, size = "md" }: { url?: string, name: string, size?: "sm" | "md" | "lg" | "xl" }) => {
    const [error, setError] = useState(false);
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-12 h-12 text-base",
        lg: "w-16 h-16 text-lg",
        xl: "w-24 h-24 text-2xl"
    };

    if (url && !error) {
        return (
            <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm shrink-0`}>
                <img src={url} alt={name} className="w-full h-full object-cover" onError={() => setError(true)} />
            </div>
        );
    }
    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-white font-bold border-2 border-white dark:border-gray-800 shadow-sm shrink-0`}>
            {name?.charAt(0)?.toUpperCase() || "?"}
        </div>
    );
};

// Stat Card
const StatCard = ({ icon: Icon, value, label, accent }: any) => (
    <motion.div variants={fadeUp} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
    </motion.div>
);

// Quick Link Card
const QuickLinkCard = ({ to, icon: Icon, title, desc, accent, id }: any) => (
    <motion.div variants={fadeUp}>
        <Link to={to} className="block group" id={id}>
            <div className="h-full p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden active:scale-[0.98]">
                <div className="relative z-10 flex flex-col h-full">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white shadow-md ${accent}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-3 flex-1 leading-relaxed">{desc}</p>
                    <div className="flex items-center text-sm font-semibold text-orange-500 dark:text-orange-400 mt-auto group-hover:translate-x-1 transition-transform duration-300">
                        <span>Explore</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </div>
        </Link>
    </motion.div>
);

// Event Row
const EventRow = ({ title, date, daysUntil, type, avatar, index }: any) => (
    <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
        className="flex items-center gap-4 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group cursor-pointer"
    >
        <AvatarDisplay url={avatar} name={title} size="md" />
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 dark:text-white truncate">{title}</h4>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">
               <span className={`uppercase tracking-wider font-semibold ${type === 'birthday' ? 'text-orange-500' : 'text-pink-500'}`}>
                   {type === 'birthday' ? '🎂 Birthday' : '💍 Anniversary'}
               </span>
               <span>•</span>
               <span>{format(new Date(date), "MMM d")}</span>
            </div>
        </div>
        <div className="text-right shrink-0">
             <span className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors duration-200 ${
                 daysUntil === 0 
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
             }`}>
                 {daysUntil === 0 ? '🎉 Today!' : `${daysUntil}d`}
             </span>
        </div>
    </motion.div>
);

// Announcement card
const AnnouncementCard = ({ announcement, index }: { announcement: Announcement, index: number }) => {
    const categoryEmoji: Record<string, string> = {
        birthday: '🎂', anniversary: '💍', event: '📅', news: '📰', other: '📢'
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        >
            <span className="text-xl shrink-0 mt-0.5">{categoryEmoji[announcement.category] || '📢'}</span>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm">{announcement.title}</h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mt-0.5">{announcement.content}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                    <span className="font-medium">{formatPoduriName(announcement.createdBy.name)}</span>
                    <span>•</span>
                    <span>{format(new Date(announcement.createdAt), "MMM d")}</span>
                </div>
            </div>
        </motion.div>
    );
};


export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0, totalGenerations: 0, upcomingBirthdays: [], upcomingAnniversaries: []
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [statuses, setStatuses] = useState<StatusUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [showStatusUpload, setShowStatusUpload] = useState(false);
  const [viewingStatusIdx, setViewingStatusIdx] = useState<number | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const greetingEmoji = hour < 12 ? "☀️" : hour < 18 ? "🌤️" : "🌙";

  const fetchStatuses = async () => {
    try { setStatuses(await statusAPI.getAll()); } catch (err) { console.error("Failed to fetch statuses:", err); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, announcementsData] = await Promise.all([
          familyMembersAPI.getDashboardStats(),
          announcementsAPI.getAll().catch(() => [])
        ]);
        setStats(statsData);
        setAnnouncements(announcementsData);
      } catch (error) { console.error("Failed to fetch dashboard data", error); }
      finally { setLoading(false); }
    };
    fetchData();
    fetchStatuses();
  }, []);

  // Listen for status uploads from anywhere
  useEffect(() => {
    const handler = () => fetchStatuses();
    window.addEventListener('status-uploaded', handler);
    return () => window.removeEventListener('status-uploaded', handler);
  }, []);

  const allUpcoming = [
      ...stats.upcomingBirthdays.map(b => ({ ...b, type: 'birthday' as const, date: b.nextBirthday, title: formatPoduriName(b.name), avatar: (b as any).avatar })),
      ...stats.upcomingAnniversaries.map(a => ({ ...a, type: 'anniversary' as const, date: a.anniversaryDate, title: `${formatPoduriName(a.member1)} & ${formatPoduriName(a.member2)}`, avatar: undefined as string | undefined }))
  ].filter(e => e.daysUntil >= 0).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 6);

  const birthdayPeople = allUpcoming.filter(e => e.type === 'birthday' && e.daysUntil === 0);

  useEffect(() => {
    if (birthdayPeople.length > 0) {
      const today = new Date().toDateString();
      if (localStorage.getItem('balloons_shown_date') !== today) {
        setConfettiTrigger(prev => prev + 1);
        localStorage.setItem('balloons_shown_date', today);
      }
    }
  }, [birthdayPeople.length]);

  const [minLoading, setMinLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setMinLoading(false), 2000); return () => clearTimeout(t); }, []);

  const currentUserId = user?.linkedFamilyMemberId?.toString() || user?.id;
  const ownStatusExists = statuses.some(s => s.userId === currentUserId);

  if (loading || minLoading) {
    return <Layout><LoadingScreen inline /></Layout>;
  }

  return (
    <Layout>
      <Confetti trigger={confettiTrigger} count={100} />
      <motion.div 
        initial="hidden" 
        animate="show" 
        variants={stagger} 
        className="space-y-6 pb-12"
      >
        
        {/* HERO GREETING */}
        <motion.div 
            variants={fadeUp}
            className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6 sm:p-8"
            id="hero-section"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{greetingEmoji}</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-500 dark:text-orange-400">Family Hub</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                        {greeting}, {user?.name ? formatPoduriName(user.name).split(' ')[0] : 'Friend'}!
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-lg">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.totalMembers} members</span> across <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.totalGenerations} generations</span> — your family story continues.
                    </p>
                </div>
                <motion.button
                    id="celebrate-btn"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setConfettiTrigger(prev => prev + 1)}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-bold transition-colors duration-200 shadow-md shadow-orange-200/50 dark:shadow-orange-900/20 self-start sm:self-center"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>Celebrate 🎉</span>
                </motion.button>
            </div>
        </motion.div>

        {/* STATUS STORIES ROW */}
        {(statuses.length > 0 || !ownStatusExists) && (
            <motion.div variants={fadeUp} className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Stories</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    {!ownStatusExists && (
                        <AddStatusButton onClick={() => setShowStatusUpload(true)} />
                    )}
                    {statuses.map((su, idx) => (
                        <StatusRing
                            key={su.userId}
                            statusUser={su}
                            isOwn={su.userId === currentUserId}
                            onClick={() => {
                                if (su.userId === currentUserId && su.statuses.length === 0) {
                                    setShowStatusUpload(true);
                                } else {
                                    setViewingStatusIdx(idx);
                                }
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        )}

        {/* TODAY'S BIRTHDAY */}
        <AnimatePresence>
            {birthdayPeople.length > 0 && (
                <motion.div 
                    variants={fadeUp}
                    initial="hidden" animate="show" exit="hidden"
                    className="space-y-3"
                >
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1 flex items-center gap-2">
                        <Cake className="w-4 h-4 text-orange-400" /> Today's Birthday
                    </h3>
                    <div className="space-y-4">
                        {birthdayPeople.map((person, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }}>
                                <BirthdayCard 
                                    memberName={person.title}
                                    avatar={person.avatar}
                                    isCurrentUser={user?.linkedFamilyMemberId === (person as any).id}
                                    recipientId={(person as any).id}
                                />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* STATS ROW */}
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users} value={stats.totalMembers} label="Members" accent="bg-orange-500" />
            <StatCard icon={GitBranch} value={stats.totalGenerations} label="Generations" accent="bg-amber-500" />
            <StatCard icon={Cake} value={stats.upcomingBirthdays.length} label="Birthdays" accent="bg-rose-500" />
            <StatCard icon={Heart} value={stats.upcomingAnniversaries.length} label="Anniversaries" accent="bg-pink-500" />
        </motion.div>

        {/* QUICK NAVIGATION */}
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickLinkCard id="link-lineage" to="/family" icon={TreePine} title="Family Tree" desc="Your ancestral roots." accent="bg-orange-500" />
            <QuickLinkCard id="link-memories" to="/gallery" icon={ImageIcon} title="Gallery" desc="Cherished moments." accent="bg-rose-500" />
            <QuickLinkCard id="link-events" to="/calendar" icon={CalendarIcon} title="Calendar" desc="Celebrations ahead." accent="bg-amber-500" />
            <QuickLinkCard id="link-call" to="/call" icon={Video} title="Video Call" desc="Connect with family." accent="bg-teal-500" />
        </motion.div>

        {/* CELEBRATIONS & ANNOUNCEMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Celebrations */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-40px" }}
               transition={{ duration: 0.5, ease: "easeOut" }}
               className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-orange-500" />
                        Upcoming Celebrations
                    </h3>
                    <Link to="/calendar" className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400 transition-colors duration-200">
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                <div className="space-y-2">
                    {allUpcoming.length > 0 ? (
                        allUpcoming.map((event, i) => (
                            <EventRow 
                                key={i} index={i}
                                title={event.title} date={event.date}
                                daysUntil={event.daysUntil} type={event.type}
                                avatar={event.avatar} 
                            />
                        ))
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center py-10 text-center text-gray-400 dark:text-gray-600">
                            <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium text-sm">No upcoming events</p>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Sidebar */}
            <div className="space-y-4">
                {/* Family Snapshot */}
                <motion.div 
                   id="family-snapshot"
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true, margin: "-40px" }}
                   transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                   className="bg-gray-900 dark:bg-gray-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden border border-gray-800"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5 flex items-center gap-2">
                            <TreePine className="w-4 h-4 text-orange-500" /> Family Snapshot
                        </h3>
                        <div className="space-y-4">
                            <div>
                                 <p className="text-4xl font-black tracking-tighter">{stats.totalMembers}</p>
                                 <p className="text-sm font-medium text-gray-400">Family Members</p>
                            </div>
                            <div className="h-px bg-white/10"></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                     <p className="text-xl font-bold">{stats.totalGenerations}</p>
                                     <p className="text-gray-500 text-[10px] font-bold uppercase">Generations</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                     <p className="text-xl font-bold">{stats.upcomingBirthdays.length}</p>
                                     <p className="text-gray-500 text-[10px] font-bold uppercase">Birthdays</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10">
                            <p className="text-[10px] text-center text-gray-600 font-medium">Poduri's Family • {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Announcements */}
                {announcements.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Megaphone className="w-4 h-4 text-orange-500" /> News
                            </h3>
                            <Link to="/announcements" className="text-[10px] font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400 uppercase tracking-wide transition-colors duration-200">See All</Link>
                        </div>
                        <div className="space-y-2">
                            {announcements.slice(0, 3).map((ann, i) => (
                                <AnnouncementCard key={ann._id} announcement={ann} index={i} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>

        {/* FOOTER DATE */}
        <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-4"
        >
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-600">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
            </div>
        </motion.div>

      </motion.div>

      {/* Status Upload Modal */}
      <StatusUploadModal
        isOpen={showStatusUpload}
        onClose={() => setShowStatusUpload(false)}
        onUploaded={() => { setShowStatusUpload(false); fetchStatuses(); }}
      />

      {/* Status Viewer */}
      <AnimatePresence>
          {viewingStatusIdx !== null && (
              <StatusViewer
                allUsers={statuses}
                initialUserIndex={viewingStatusIdx}
                onClose={() => setViewingStatusIdx(null)}
                onDeleted={fetchStatuses}
              />
          )}
      </AnimatePresence>
    </Layout>
  );
};
