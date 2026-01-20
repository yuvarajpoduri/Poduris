import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { CalendarCell } from "../components/CalendarCell";
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
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../components/Card";

const calculateAge = (birthDate: string, eventDate: string) => {
  const birth = new Date(birthDate);
  const event = new Date(eventDate);

  let age = event.getFullYear() - birth.getFullYear();
  const hasHadBirthday =
    event.getMonth() > birth.getMonth() ||
    (event.getMonth() === birth.getMonth() &&
      event.getDate() >= birth.getDate());

  if (!hasHadBirthday) age -= 1;
  return age;
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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const data = await calendarAPI.getEvents(month, year, true, true);
        setEvents(data);

        // Check for eventId param to open modal
        const params = new URLSearchParams(window.location.search);
        const eventId = params.get("eventId");
        if (eventId && data.length > 0) {
            // Find the event - assume eventId could be _id or memberId for now, but usually _id
            // My previous change in controller passed `_id` as `eventId`.
            // Let's filter by _id.
            const foundEvent = data.find(e => e._id === eventId);
            if (foundEvent) {
                // If found, open the date modal primarily
                const eventDate = new Date(foundEvent.date);
                setSelectedDate(eventDate);
                // Also scroll/focus? For now just opening the modal is good.
                // Clean up URL
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-accent-blue animate-spin" />
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Birthdays & anniversaries
          </p>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                <CalendarIcon className="text-accent-blue" />
              </div>
              <h2 className="text-2xl font-bold">
                {format(currentDate, "MMMM yyyy")}
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() - 1,
                      1
                    )
                  )
                }
                className="px-3 py-2 rounded-xl border"
              >
                <ChevronLeft />
              </button>

              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 rounded-xl bg-accent-blue text-white"
              >
                Today
              </button>

              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() + 1,
                      1
                    )
                  )
                }
                className="px-3 py-2 rounded-xl border"
              >
                <ChevronRight />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {days.map((day) => (
              <CalendarCell
                key={day.toISOString()}
                date={day}
                isToday={isToday(day)}
                // FIX: Ensure this is strictly a boolean
                isSelected={
                  !!(selectedDate &&
                  format(day, "yyyy-MM-dd") ===
                    format(selectedDate, "yyyy-MM-dd"))
                }
                events={getEventsForDate(day)}
                onClick={() => setSelectedDate(day)}
              />
            ))}
          </div>
        </Card>

        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
            >
              <motion.div
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                exit={{ y: 80 }}
                className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {format(selectedDate, "dd MMMM yyyy")}
                  </h3>
                  <button onClick={() => setSelectedDate(null)}>
                    <X />
                  </button>
                </div>

                {selectedEvents.length === 0 && (
                  <p className="text-gray-500">No events</p>
                )}

                <div className="space-y-3">
                  {selectedEvents.map((event, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
                    >
                      {event.type === "birthday" ? (
                        <Cake className="text-accent-orange" />
                      ) : event.type === "anniversary" ? (
                        <Heart className="text-accent-yellow" />
                      ) : (
                        <CalendarIcon className={`
                          ${event.type === 'holiday' ? 'text-green-500' : ''}
                          ${event.type === 'event' ? 'text-blue-500' : ''}
                          ${event.type === 'other' ? 'text-gray-500' : ''}
                        `} />
                      )}

                      <span className="flex-1">
                        {event.title ||
                          event.memberName ||
                          `${event.member1Name} & ${event.member2Name}`}
                      </span>

                      {event.memberId && (
                        <button
                          onClick={() => setPreviewMember(event)}
                          className="p-2 rounded-lg text-accent-blue hover:bg-accent-blue/10"
                        >
                          <Eye />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {previewMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm"
              >
                <div className="flex flex-col items-center text-center">
                  <img
                    src={previewMember.avatar}
                    alt={previewMember.memberName || "Member"}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />

                  <h3 className="text-xl font-semibold">
                    {previewMember.memberName}
                  </h3>

                  {previewMember.birthDate && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Turns{" "}
                      <span className="font-semibold text-accent-blue">
                        {calculateAge(
                          previewMember.birthDate,
                          previewMember.date
                        )}
                      </span>{" "}
                      years
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setPreviewMember(null)}
                  className="mt-6 w-full py-2 rounded-xl bg-accent-blue text-white"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};
