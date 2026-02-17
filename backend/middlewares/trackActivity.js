import User from '../models/User.js';
import FamilyMember from '../models/FamilyMember.js';

export const trackActivity = async (req, res, next) => {
  if (req.session && req.session.familyMemberId) {
    try {
      const path = req.headers['x-current-path'] || req.path;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      // Update once every 30 seconds to capture usage more accurately
      if (!req.session.lastActivityUpdate || (now - new Date(req.session.lastActivityUpdate)) > 30000) {
        let member;
        if (req.session.familyMemberId === 'admin') {
          member = await User.findOne({ role: 'admin' });
        } else {
          member = await FamilyMember.findById(req.session.familyMemberId);
        }

        if (member) {
          const lastActive = member.lastActive ? new Date(member.lastActive) : now;
          const lastActiveStr = lastActive.toISOString().split('T')[0];
          const lastActiveMonth = lastActive.getMonth();
          const lastActiveYear = lastActive.getFullYear();
          
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          let newSessionTimeToday = member.sessionTimeToday || 0;
          let newSessionTimeMonthly = member.sessionTimeMonthly || 0;
          let newSessionTimeYearly = member.sessionTimeYearly || 0;
          
          // Reset if it's a new day
          if (todayStr !== lastActiveStr) {
            newSessionTimeToday = 0;
          }
          
          // Reset if it's a new month
          if (currentMonth !== lastActiveMonth || currentYear !== lastActiveYear) {
            newSessionTimeMonthly = 0;
          }
          
          // Reset if it's a new year
          if (currentYear !== lastActiveYear) {
            newSessionTimeYearly = 0;
          }

          // Calculate diff since last activity
          const diffMs = now - lastActive;
          // Only add if last activity was within the last 15 minutes (to avoid adding huge gaps)
          if (diffMs > 0 && diffMs < 15 * 60 * 1000) {
            const addedSeconds = Math.floor(diffMs / 1000);
            newSessionTimeToday += addedSeconds;
            newSessionTimeMonthly += addedSeconds;
            newSessionTimeYearly += addedSeconds;
          }

          member.lastActive = now;
          member.currentPath = path;
          member.sessionTimeToday = newSessionTimeToday;
          member.sessionTimeMonthly = newSessionTimeMonthly;
          member.sessionTimeYearly = newSessionTimeYearly;
          await member.save();
        }
        
        req.session.lastActivityUpdate = now;
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }
  next();
};
