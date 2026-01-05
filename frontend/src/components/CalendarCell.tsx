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
  const hasBirthday = events.some((e) => e.type === "birthday");
  const hasAnniversary = events.some((e) => e.type === "anniversary");

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`h-14 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all
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

      <div className="flex gap-1">
        {hasBirthday && <Cake className="w-4 h-4 text-accent-orange" />}
        {hasAnniversary && <Heart className="w-4 h-4 text-accent-yellow" />}
      </div>
    </motion.div>
  );
};
