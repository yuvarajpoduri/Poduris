import User from '../models/User.js';
import FamilyMember from '../models/FamilyMember.js';
import Chat from '../models/Chat.js';
import Gallery from '../models/Gallery.js';

export const getStats = async (req, res, next) => {
  try {
    const totalFamilyMembers = await FamilyMember.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get active family members
    const activeMembers = await FamilyMember.find({
      lastActive: { $gte: fiveMinutesAgo }
    }).select('name nickname avatar currentPath lastActive');

    // Get active admins from User model
    const activeAdmins = await User.find({
      role: 'admin',
      lastActive: { $gte: fiveMinutesAgo }
    }).select('name nickname avatar currentPath lastActive');

    const activeUsersList = [...activeAdmins, ...activeMembers];

    // Most popular pages (Top 5)
    // We can aggregate this from FamilyMember and User currentPath
    const topPages = await FamilyMember.aggregate([
      { $match: { currentPath: { $ne: null } } },
      { $group: { _id: '$currentPath', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Role distribution
    const roleStats = [
      { name: 'Admins', value: await User.countDocuments({ role: 'admin' }) },
      { name: 'Family Members', value: totalFamilyMembers }
    ];

    // Gender Distribution
    const genderStats = await FamilyMember.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Generation Distribution
    const generationStats = await FamilyMember.aggregate([
      { $group: { _id: '$generation', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Recent Activity Counts (24h)
    const recentMessages = await Chat.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const recentUploads = await Gallery.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const pendingUploads = await Gallery.countDocuments({ status: 'pending' });

    // Growth Chart (Last 7 Days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const growthStats = await FamilyMember.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Daily Usage Stats (Users active today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyActiveMembers = await FamilyMember.find({ 
      sessionTimeToday: { $gt: 0 },
      lastActive: { $gte: today }
    }).select('name nickname avatar sessionTimeToday lastActive');

    const dailyActiveAdmins = await User.find({ 
      role: 'admin',
      sessionTimeToday: { $gt: 0 },
      lastActive: { $gte: today }
    }).select('name email avatar sessionTimeToday lastActive');

    const dailyUsage = [
      ...dailyActiveAdmins.map(a => ({ ...a.toObject(), type: 'admin' })),
      ...dailyActiveMembers.map(m => ({ ...m.toObject(), type: 'member' }))
    ].sort((a, b) => b.sessionTimeToday - a.sessionTimeToday);

    // Registered Users List (Members with passwords or Admin accounts)
    const registeredMembersList = await FamilyMember.find({ 
      password: { $exists: true, $ne: null } 
    }).select('name nickname email avatar');

    const adminAccounts = await User.find({ role: 'admin' }).select('name email avatar');
    
    // Merge and remove duplicates (admins might be in both if linked)
    const registeredUsers = [
      ...adminAccounts.map(a => ({ ...a.toObject(), type: 'admin' })),
      ...registeredMembersList.map(m => ({ ...m.toObject(), type: 'member' }))
    ].filter((v, i, a) => a.findIndex(t => t.email === v.email) === i);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: totalFamilyMembers,
        activeUsersCount: activeUsersList.length,
        activeUsers: activeUsersList,
        registeredUsers,
        dailyUsage,
        topPages: topPages.map(p => ({ path: p._id, count: p.count })),
        roleStats,
        genderStats: genderStats.map(g => ({ name: g._id, value: g.count })),
        generationStats: generationStats.map(g => ({ name: `Gen ${g._id}`, value: g.count })),
        recentActivity: {
          messages24h: recentMessages,
          uploads24h: recentUploads,
          pendingUploads
        },
        growthStats: growthStats.map(g => ({ date: g._id, users: g.count })),
        systemInfo: {
          uptime: process.uptime(),
          memory: process.memoryUsage().heapUsed,
          platform: process.platform
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
