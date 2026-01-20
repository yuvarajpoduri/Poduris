import FamilyMember from "../models/FamilyMember.js";
import Event from "../models/Event.js";
import { getAnniversaryDate } from "../utils/familyRelations.js";

const formatDateOnly = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getCalendarEvents = async (req, res, next) => {
  try {
    const { month, year, includeBirthdays, includeAnniversaries } = req.query;

    const targetMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const showBirthdays = includeBirthdays !== "false";
    const showAnniversaries = includeAnniversaries !== "false";

    const members = await FamilyMember.find().lean();
    const events = [];

    if (showBirthdays) {
      for (const member of members) {
        if (!member.birthDate || member.deathDate) continue;

        const birth = new Date(member.birthDate);
        if (birth.getMonth() !== targetMonth) continue;

        const eventDate = new Date(targetYear, targetMonth, birth.getDate());

        events.push({
          type: "birthday",
          date: formatDateOnly(eventDate),
          title: `${member.name}'s Birthday`,
          _id: member._id,
          memberId: member.id,
          memberName: member.name,
          avatar: member.avatar,
          birthDate: member.birthDate,
          email: member.email,
        });
      }
    }

    if (showAnniversaries) {
      const processedPairs = new Set();

      for (const member of members) {
        if (!member.spouseId) continue;

        const pairKey = [member.id, member.spouseId].sort().join("-");
        if (processedPairs.has(pairKey)) continue;

        const spouse = members.find((m) => m.id === member.spouseId);
        if (!spouse) continue;

        processedPairs.add(pairKey);

        // Use anniversaryDate field if it exists, otherwise fall back to calculated date
        let anniversary = member.anniversaryDate || getAnniversaryDate(members, member.id);
        if (!anniversary) continue;

        const ann = new Date(anniversary);
        if (ann.getMonth() !== targetMonth) continue;

        const eventDate = new Date(targetYear, targetMonth, ann.getDate());

        events.push({
          type: "anniversary",
          date: formatDateOnly(eventDate),
          title: `${member.name} & ${spouse.name}'s Anniversary`,
          member1Id: member.id,
          member2Id: spouse.id,
          member1Name: member.name,
          member2Name: spouse.name,
          anniversaryDate: anniversary,
        });
      }
    }

    // Fetch Admin Events
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    const adminEvents = await Event.find({
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    for (const event of adminEvents) {
      events.push({
        type: event.eventType || "event", // Default to 'event' if type is missing
        date: formatDateOnly(new Date(event.date)),
        title: event.title,
        description: event.description,
        location: event.location,
        // Add any other properties needed by CalendarEvent interface
      });
    }

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      month: targetMonth + 1,
      year: targetYear,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};
