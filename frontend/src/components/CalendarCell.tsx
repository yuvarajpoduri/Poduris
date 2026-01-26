import React from "react";
import type { CalendarEvent } from "../types";
import { Cake, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  onClick: () => void;
}

export const CalendarCell: React.FC<Props> = ({
  date,
  isToday,
  isSelected,
  events,
  onClick,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  
  const hasBirthday = events.some((e) => e.type === "birthday");
  const hasAnniversary = events.some((e) => e.type === "anniversary");
  const hasEvent = events.some((e) => e.type === "event");
  const hasHoliday = events.some((e) => e.type === "holiday");
  const hasOther = events.some((e) => e.type === "other");

  const hasAnyEvent = events.length > 0;

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className={`relative h-14 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all group
          ${isToday ? "border-2 border-accent-blue" : "border border-gray-200"}
          ${isSelected ? "bg-accent-blue/10" : "bg-white dark:bg-gray-800"}
        `}
      >
        <div
          className={`text-sm font-semibold ${
            isToday ? "text-accent-blue" : "text-black dark:text-white"
          }`}
        >
          {date.getDate()}
        </div>

        <div className="flex gap-1 justify-center flex-wrap px-1">
          {hasBirthday && <Cake className="w-3 h-3 sm:w-4 sm:h-4 text-accent-orange" />}
          {hasAnniversary && <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-accent-yellow" />}
          {(hasEvent || hasHoliday || hasOther) && (
              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                  hasHoliday ? 'bg-green-500' : hasEvent ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
          )}
        </div>

        {/* Eye Icon for Preview */}
        {hasAnyEvent && (
          <div className="absolute top-1 right-1 transition-opacity">
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(true);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
             >
                 <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-gray-500"
                 >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                 </svg>
             </button>
          </div>
        )}
      </motion.div>

      {/* Event Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
             onClick={() => setShowDetails(false)}
        >
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             onClick={(e) => e.stopPropagation()}
             className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-700"
          >
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                 Events on {date.toLocaleDateString()}
               </h3>
               <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                  X
               </button>
             </div>
             
             <div className="space-y-4 max-h-[60vh] overflow-y-auto">
               {events.map((event, i) => (
                 <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="mt-1">
                        {event.type === 'birthday' && <Cake className="w-5 h-5 text-accent-orange" />}
                        {event.type === 'anniversary' && <Heart className="w-5 h-5 text-accent-yellow" />}
                        {event.type === 'event' && <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5" />}
                        {event.type === 'holiday' && <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                            {event.title || event.memberName || 'Event'}
                        </p>
                        {event.memberName && event.type === 'birthday' && (
                             <p className="text-sm text-gray-500">Birthday</p>
                        )}
                         {event.member1Name && event.type === 'anniversary' && (
                             <p className="text-sm text-gray-500">Anniversary of {event.member1Name} & {event.member2Name}</p>
                        )}
                    </div>
                 </div>
               ))}
             </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
