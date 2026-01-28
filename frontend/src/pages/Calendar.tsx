import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { calendarAPI } from "../utils/api";
import type { CalendarEvent } from "../types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Cake,
  Heart,
  Eye,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { formatPoduriName } from "../utils/formatUtils";

const calculateAgeDisplay = (birthDate: string, eventDate: string) => {
  const birth = new Date(birthDate);
  const event = new Date(eventDate);

  // Basic age calculation based on years
  let age = event.getFullYear() - birth.getFullYear();
  return age;
};

const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const EventCard = ({ event }: { event: CalendarEvent }) => {
    // Determine the start date for age/years calculation
    const startDate = event.type === 'anniversary' ? event.anniversaryDate : event.birthDate;
    const years = startDate ? calculateAgeDisplay(startDate, event.date) : 0;
    
    return (
        <div className="relative pt-8 pb-4 px-4 text-center mx-auto w-full max-w-md">
             {/* Vibrant Background Gradient (Mobile Optimized) */}
             <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-48 opacity-10 blur-3xl rounded-full scale-125
                ${event.type === 'birthday' ? 'bg-orange-500' : ''}
                ${event.type === 'anniversary' ? 'bg-pink-500' : 'bg-blue-500'}
             `}></div>
             
             <div className="relative mb-6">
                {/* Clean Avatar Display */}
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-2xl relative z-10"
                >
                  {event.avatar ? (
                      <img 
                          src={event.avatar} 
                          alt="avatar" 
                          className="w-32 h-32 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-sm"
                      />
                  ) : (
                      <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 border-white dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-center shadow-sm">
                         {event.type === 'birthday' ? <Cake className="w-12 h-12 sm:w-16 sm:h-16 text-orange-400 opacity-80"/> : 
                          event.type === 'anniversary' ? <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-pink-400 opacity-80"/> :
                          <CalendarIcon className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 opacity-80"/>}
                      </div>
                  )}
                </motion.div>
             </div>
             
             <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
             >
                 <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                    {formatPoduriName(event.title || event.memberName || '')}
                 </h2>
                 <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide
                    ${event.type === 'birthday' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : ''}
                    ${event.type === 'anniversary' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' : ''}
                    ${!['birthday', 'anniversary'].includes(event.type) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}
                 `}>
                    {event.type} Celebration
                 </div>
             </motion.div>
             
             {event.description && (
                 <p className="mt-4 text-gray-600 dark:text-gray-300 italic text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
                     "{event.description}"
                 </p>
             )}
             
             <div className="mt-8">
                 {startDate ? (
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm mx-auto items-stretch h-24 sm:h-28">
                       {/* Box 1: Status / Prefix */}
                       <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 w-full h-full flex items-center justify-center">
                            <p className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                              {event.type === 'anniversary' ? 'Together' : (new Date(event.date) < new Date() ? 'Turned' : 'Turns')}
                            </p>
                       </div>
                       
                       {/* Box 2: Age / Ordinal */}
                       <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-2 border-2 border-transparent relative z-20 w-full h-full flex items-center justify-center overflow-hidden">
                           <div className={`absolute inset-0 rounded-2xl opacity-20
                                ${event.type === 'birthday' ? 'bg-orange-500' : ''}
                                ${event.type === 'anniversary' ? 'bg-pink-500' : 'bg-blue-500'}
                           `}></div>
                           <p className={`font-black text-transparent bg-clip-text bg-gradient-to-br flex items-center justify-center h-full w-full
                                ${event.type === 'birthday' ? 'from-orange-500 to-red-500 text-4xl sm:text-5xl' : ''}
                                ${event.type === 'anniversary' ? 'from-pink-500 to-purple-500 text-3xl sm:text-4xl' : 'from-blue-500 to-indigo-500 text-4xl sm:text-5xl'} 
                           `}>
                               {event.type === 'anniversary' ? getOrdinal(years) : years}
                           </p>
                       </div>
                       
                       {/* Box 3: Date / Suffix */}
                       <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 w-full h-full flex flex-col items-center justify-center">
                          {event.type === 'anniversary' ? (
                              <p className="text-xs sm:text-sm font-black text-pink-500 dark:text-pink-400 uppercase tracking-widest">
                                Anniv.
                              </p>
                          ) : (
                              <>
                                <p className="text-[10px] text-gray-400 uppercase font-black mb-1 tracking-wider">On</p>
                                <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">
                                    {format(new Date(event.date), "MMM d")}
                                </p>
                              </>
                          )}
                       </div>
                    </div>
                 ) : (
                    <div className="inline-flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 px-8 py-4 rounded-3xl border border-gray-100 dark:border-gray-700">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                           <CalendarIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Event Date</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            {format(new Date(event.date), "MMMM d, yyyy")}
                          </p>
                        </div>
                    </div>
                 )}
             </div>
        </div>
    );
};


// Helper to dedup events based on memberId + type
const getUniqueEvents = (events: CalendarEvent[]) => {
  const unique = new Map();
  events.forEach(event => {
    // efficient key: memberId-type-date
    const key = `${event.memberId || event._id}-${event.type}-${event.date}`;
    if (!unique.has(key)) {
      unique.set(key, event);
    }
  });
  return Array.from(unique.values());
};

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [previewMember, setPreviewMember] = useState<CalendarEvent | null>(
    null
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);

  // Reset slide index when date changes
  useEffect(() => {
    setSlideIndex(0);
  }, [selectedDate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const data = await calendarAPI.getEvents(month, year, true, true);
        
        // Use full data, dedup only for grid view if needed
        setEvents(data);

        const params = new URLSearchParams(window.location.search);
        const eventId = params.get("eventId");
        if (eventId && data.length > 0) {
            const foundEvent = data.find(e => e._id === eventId);
            if (foundEvent) {
                const eventDate = new Date(foundEvent.date);
                setSelectedDate(eventDate);
                 window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [currentDate]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getEventsForDate = (date: Date) =>
    events.filter(
      (e) =>
        format(new Date(e.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    const newDate = new Date(currentDate.getFullYear(), newMonth, 1);
    setCurrentDate(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newYear = parseInt(e.target.value);
      const newDate = new Date(newYear, currentDate.getMonth(), 1);
      setCurrentDate(newDate);
  };

  // Generate years for dropdown (current year - 5 to + 5 is simple enough, or specific range)
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 10}, (_, i) => currentYear - 5 + i);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Card className="text-red-600 text-center">{error}</Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 pb-12"
      >
        {/* Header Section */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 sm:p-10 text-white dark:from-violet-900 dark:to-indigo-950">
           {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl sm:text-4xl font-black tracking-tight mb-2 drop-shadow-sm"
              >
                Calendar
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-indigo-100 text-sm sm:text-base font-medium max-w-lg"
              >
                Celebrating the moments that matter.
              </motion.p>
            </div>
            
            {/* Custom Month/Year Controls */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/20 shadow-lg justify-between w-full md:w-auto"
            >
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-white/20 rounded-xl transition-all text-white active:scale-95 focus:outline-none focus:ring-0 active:outline-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Clean Custom Select Trigger */}
              <div className="flex items-center gap-1 mx-2 relative group">
                  <div className="flex items-center gap-2 font-bold text-lg cursor-pointer px-4 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                     <span>{format(currentDate, "MMMM yyyy")}</span>
                     <CalendarIcon className="w-4 h-4 opacity-70" />
                  </div>

                  {/* Hidden Native Selects for Functionality */}
                  <div className="absolute inset-0 flex opacity-0 cursor-pointer">
                      <select 
                        value={currentDate.getMonth()} 
                        onChange={handleMonthChange}
                        className="flex-1 cursor-pointer appearance-none"
                      >
                          {Array.from({length: 12}, (_, i) => (
                              <option key={i} value={i}>{format(new Date(2000, i, 1), "MMMM")}</option>
                          ))}
                      </select>
                       <select 
                        value={currentDate.getFullYear()} 
                        onChange={handleYearChange}
                        className="flex-1 cursor-pointer appearance-none"
                      >
                          {years.map(y => (
                              <option key={y} value={y}>{y}</option>
                          ))}
                      </select>
                  </div>
              </div>

              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 hover:bg-white/20 rounded-xl transition-all text-white active:scale-95 focus:outline-none focus:ring-0 active:outline-none"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
           {/* Days Header */}
           <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                 <div key={day} className="py-3 text-center">
                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${i === 0 || i === 6 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {day}
                    </span>
                 </div>
             ))}
           </div>

           <div className="grid grid-cols-7 bg-white dark:bg-gray-900 border-l border-t border-gray-100 dark:border-gray-700/50">
             {days.map((day, index) => {
               const dayEvents = getEventsForDate(day);
               // Dedup events JUST for grid display to avoid clutter
               const uniqueDayEvents = getUniqueEvents(dayEvents);

               const isSelected = selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
               const isTodayDate = isToday(day);
               const isCurrentMonth = format(day, 'MM') === format(currentDate, 'MM');

               return (
                 <motion.div 
                   key={day.toISOString()}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: index * 0.002 }}
                   className={`
                     aspect-square relative p-1 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-0 tap-highlight-transparent
                     border-r border-b border-gray-100 dark:border-gray-800/50
                     ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/30 text-gray-400' : 'bg-white dark:bg-gray-900'} 
                     hover:bg-blue-50 dark:hover:bg-blue-900/10
                     ${isSelected ? 'ring-2 ring-inset ring-violet-500 z-10 bg-violet-50 dark:bg-violet-900/20' : ''}
                   `}
                   onClick={() => setSelectedDate(day)}
                 >
                    <div className="flex justify-between items-start">
                       <span className={`
                         text-[10px] sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full
                         ${isTodayDate ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : ''}
                       `}>
                         {format(day, "d")}
                       </span>
                       
                       {/* Event Count Dot - Show total raw count */}
                       {dayEvents.length > 0 && (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[8px] sm:text-[10px] font-bold shadow-sm md:mr-1 md:mt-1">
                            {dayEvents.length}
                          </div>
                       )}
                    </div>

                    <div className="mt-1 space-y-0.5">
                       {/* Render max 1 event text based on Unique events */}
                       <div className="hidden sm:block">
                           {uniqueDayEvents.slice(0, 1).map((event, i) => (
                             <div 
                               key={i}
                               className={`
                                 text-[9px] truncate px-1 py-0.5 rounded font-medium border leading-tight
                                 ${event.type === 'birthday' ? 'bg-orange-50 border-orange-100 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300' : ''}
                                 ${event.type === 'anniversary' ? 'bg-pink-50 border-pink-100 text-pink-700 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-300' : ''}
                                 ${!['birthday', 'anniversary'].includes(event.type) ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : ''}
                               `}
                             >
                                {event.title ? formatPoduriName(event.title) : (event.memberName ? formatPoduriName(event.memberName).split(' ')[0] : '')}
                             </div>
                           ))}
                           {dayEvents.length > 1 && (
                             <div className="text-[8px] text-gray-400 pl-0.5 font-medium">
                               +{dayEvents.length - 1}
                             </div>
                           )}
                       </div>
                    </div>
                 </motion.div>
               );
             })}
           </div>
        </div>

        {/* Today's Events Ticker */}
        <div className="pt-4">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 px-1">
               <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
               Today's Celebrations
            </h3>
            
            {events.filter(e => isToday(new Date(e.date))).length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                   {events.filter(e => isToday(new Date(e.date))).map((event, i) => (
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: i * 0.1 }}
                         key={i}
                         className="min-w-[280px] snap-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg flex items-center gap-4 cursor-pointer hover:border-orange-200 transition-colors"
                         onClick={() => setPreviewMember(event)}
                       >
                          <div className={`
                             w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white shadow-md font-bold text-lg
                             ${event.type === 'birthday' ? 'bg-orange-500' : ''}
                             ${event.type === 'anniversary' ? 'bg-pink-500' : 'bg-blue-500'}
                          `}>
                             {event.avatar ? (
                                <img src={event.avatar} alt="" className="w-full h-full rounded-full object-cover border-2 border-white" />
                             ) : (
                                <span>{event.title?.[0] || event.memberName?.[0] || '?'}</span>
                             )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                             <h4 className="font-bold text-gray-900 dark:text-white truncate text-base">
                                {formatPoduriName(event.title || event.memberName || '')}
                             </h4>
                             <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {event.type}
                             </p>
                          </div>
                          
                          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                                <Eye className="w-4 h-4" />
                          </div>
                       </motion.div>
                   ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 text-center border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 font-medium">No celebrations scheduled for today.</p>
                </div>
            )}
        </div>

        {/* Selected Date Modal */}
        <AnimatePresence>
          {selectedDate && (
            <Modal
              isOpen={!!selectedDate}
              onClose={() => setSelectedDate(null)}
              title=""
              size="md"
              noPadding
            >
                <div className="relative overflow-hidden bg-white dark:bg-gray-800">
                   {/* Modal Header */}
                   <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 pt-8 text-white relative">
                      <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                      <div className="relative z-10 pr-10">
                        <h2 className="text-3xl font-black mb-1">{format(selectedDate, "MMM do")}</h2>
                        <p className="text-indigo-100 font-medium text-lg">{format(selectedDate, "EEEE, yyyy")}</p>
                      </div>
                   </div>
                   
                   <div className="p-0">
                      {selectedEvents.length === 0 ? (
                          <div className="py-12 text-center opacity-60">
                             <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 grayscale" />
                             <p className="text-gray-500 font-medium">No events for this day</p>
                          </div>
                      ) : (
                          <div className="relative overflow-hidden w-full">
                             {/* Carousel Container */}
                             <motion.div 
                                className="flex"
                                animate={{ x: `-${slideIndex * 100}%` }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, { offset, velocity }) => {
                                  const swipe = offset.x;
                                  if (swipe < -50 && slideIndex < selectedEvents.length - 1) {
                                    setSlideIndex(prev => prev + 1);
                                  } else if (swipe > 50 && slideIndex > 0) {
                                    setSlideIndex(prev => prev - 1);
                                  }
                                }}
                             >
                                {selectedEvents.map((event, i) => (
                                  <div key={i} className="min-w-full pb-8">
                                     <EventCard event={event} />
                                  </div>
                                ))}
                             </motion.div>

                             {/* Dots Navigation */}
                             {selectedEvents.length > 1 && (
                               <div className="flex justify-center gap-2 pb-6">
                                 {selectedEvents.map((_, i) => (
                                   <button
                                     key={i}
                                     onClick={() => setSlideIndex(i)}
                                     className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                       i === slideIndex 
                                         ? 'bg-violet-600 w-6' 
                                         : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                                     }`}
                                   />
                                 ))}
                               </div>
                             )}

                             {/* Arrow Buttons (Desktop) */}
                             {selectedEvents.length > 1 && (
                               <>
                                 <button 
                                   onClick={() => setSlideIndex(prev => Math.max(0, prev - 1))}
                                   disabled={slideIndex === 0}
                                   className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg text-gray-800 dark:text-white disabled:opacity-0 transition-opacity hover:bg-white hidden sm:block"
                                 >
                                   <ChevronLeft className="w-6 h-6" />
                                 </button>
                                 <button 
                                   onClick={() => setSlideIndex(prev => Math.min(selectedEvents.length - 1, prev + 1))}
                                   disabled={slideIndex === selectedEvents.length - 1}
                                   className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg text-gray-800 dark:text-white disabled:opacity-0 transition-opacity hover:bg-white hidden sm:block"
                                 >
                                   <ChevronRight className="w-6 h-6" />
                                 </button>
                               </>
                             )}
                          </div>
                      )}
                   </div>
                </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* Profile Card Modal */}
        <AnimatePresence>
          {previewMember && (
            <Modal
              isOpen={!!previewMember}
              onClose={() => setPreviewMember(null)}
              title=""
              size="sm"
            >
                <EventCard event={previewMember} />
            </Modal>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
};
