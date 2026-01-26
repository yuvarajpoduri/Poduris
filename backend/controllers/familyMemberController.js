import FamilyMember from "../models/FamilyMember.js";
import {
  getParents,
  getSpouse,
  getChildren,
} from "../utils/familyRelations.js";
import mongoose from "mongoose";

// @desc    Get all family members
// @route   GET /api/family-members
// @access  Private
const formatDateOnly = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
export const getFamilyMembers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};
    
    // If search query is provided, search by name or email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      };
    }
    
    const members = await FamilyMember.find(query).select('-password').sort({ generation: 1, id: 1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available family members (all members with email)
// @route   GET /api/family-members/available
// @access  Public (deprecated, kept for backward compatibility)
export const getAvailableFamilyMembers = async (req, res, next) => {
  try {
    // Return all family members (no longer filtering by linked status)
    const availableMembers = await FamilyMember.find({
      email: { $exists: true, $ne: null }
    }).select('-password').sort({ generation: 1, id: 1 });

    res.status(200).json({
      success: true,
      count: availableMembers.length,
      data: availableMembers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single family member with relationships
// @route   GET /api/family-members/:id
// @access  Private
export const getFamilyMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate if id is a valid MongoDB ObjectId or numeric ID
    let member;
    if (mongoose.Types.ObjectId.isValid(id)) {
      member = await FamilyMember.findById(id);
    } else {
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid member ID",
        });
      }
      member = await FamilyMember.findOne({ id: numericId });
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Family member not found",
      });
    }

    // Get all members for relationship calculation
    const allMembers = await FamilyMember.find();
    const allMembersArray = allMembers.map((m) => m.toObject());

    // Get relationships
    const parents = getParents(allMembersArray, member.id);
    const spouse = getSpouse(allMembersArray, member.id);
    const children = getChildren(allMembersArray, member.id);

    res.status(200).json({
      success: true,
      data: {
        ...member.toObject(),
        parents,
        spouse,
        children,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get family members by generation
// @route   GET /api/family-members/generation/:generation
// @access  Private
export const getFamilyMembersByGeneration = async (req, res, next) => {
  try {
    const { generation } = req.params;
    const genNum = parseInt(generation);

    if (isNaN(genNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid generation number",
      });
    }

    const members = await FamilyMember.find({ generation: genNum }).sort({
      id: 1,
    });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/family-members/stats/dashboard
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    const allMembers = await FamilyMember.find().lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalMembers = allMembers.length;
    const totalGenerations = new Set(allMembers.map((m) => m.generation)).size;

    const upcomingBirthdays = [];
    const upcomingAnniversaries = [];

    for (const member of allMembers) {
      if (member.birthDate && !member.deathDate) {
        const birth = new Date(member.birthDate);
        const nextBirthday = new Date(
          today.getFullYear(),
          birth.getMonth(),
          birth.getDate()
        );

        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const diffMs = nextBirthday.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysUntil <= 30) {
          upcomingBirthdays.push({
            ...member,
            nextBirthday: formatDateOnly(nextBirthday),
            daysUntil,
          });
        }
      }
    }

    const processedPairs = new Set();

    for (const member of allMembers) {
      if (!member.spouseId) continue;

      const pairKey = [member.id, member.spouseId].sort().join("-");
      if (processedPairs.has(pairKey)) continue;

      const spouse = allMembers.find((m) => m.id === member.spouseId);
      if (!spouse) continue;

      processedPairs.add(pairKey);

      // Use anniversaryDate if it exists, otherwise use birthDate as fallback
      const anniversaryRef = member.anniversaryDate || member.birthDate;
      const ref = new Date(anniversaryRef);
      const nextAnniversary = new Date(
        today.getFullYear(),
        ref.getMonth(),
        ref.getDate()
      );

      if (nextAnniversary < today) {
        nextAnniversary.setFullYear(today.getFullYear() + 1);
      }

      const diffMs = nextAnniversary.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysUntil <= 30) {
        upcomingAnniversaries.push({
          member1: member.name,
          member2: spouse.name,
          anniversaryDate: formatDateOnly(nextAnniversary),
          daysUntil,
        });
      }
    }

    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    upcomingAnniversaries.sort((a, b) => a.daysUntil - b.daysUntil);

    res.status(200).json({
      success: true,
      data: {
        totalMembers,
        totalGenerations,
        upcomingBirthdays: upcomingBirthdays.slice(0, 5),
        upcomingAnniversaries: upcomingAnniversaries.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create family member
// @route   POST /api/family-members
// @access  Private/Admin
export const createFamilyMember = async (req, res, next) => {
  try {
    const {
      id,
      name,
      nickname,
      birthDate,
      deathDate,
      gender,
      parentId,
      spouseId,
      generation,
      avatar,
      occupation,
      location,
      bio,
    } = req.body;

    // Check for duplicate ID
    if (id) {
      const existingMember = await FamilyMember.findOne({ id });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "Family ID already exists",
        });
      }
    }

    // Validate parentId if provided
    if (parentId !== null && parentId !== undefined) {
      const parent = await FamilyMember.findOne({ id: parentId });
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Parent ID not found",
        });
      }
    }

    // Validate spouseId if provided
    if (spouseId !== null && spouseId !== undefined) {
      const spouse = await FamilyMember.findOne({ id: spouseId });
      if (!spouse) {
        return res.status(400).json({
          success: false,
          message: "Spouse ID not found",
        });
      }
    }

    const member = await FamilyMember.create({
      id,
      name,
      nickname: nickname || "",
      birthDate,
      deathDate: deathDate || null,
      gender,
      parentId: parentId || null,
      spouseId: spouseId || null,
      generation,
      avatar: avatar || "",
      occupation: occupation || "",
      location: location || "",
      bio: bio || "",
    });

    res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update family member
// @route   PUT /api/family-members/:id
// @access  Private (Admin can edit any, members can edit only their own)
export const updateFamilyMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.session?.role === 'admin';
    const currentFamilyMemberId = req.session?.familyMemberId;

    let member;
    if (mongoose.Types.ObjectId.isValid(id)) {
      member = await FamilyMember.findById(id);
    } else {
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid member ID",
        });
      }
      member = await FamilyMember.findOne({ id: numericId });
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Family member not found",
      });
    }

    // Check permissions: Admin can edit any, members can only edit their own
    if (!isAdmin) {
      if (member._id.toString() !== currentFamilyMemberId) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own profile",
        });
      }
    }

    // For non-admin users, restrict which fields can be updated
    const updateData = { ...req.body };
    if (!isAdmin) {
      // Members can only update: name, email, password, avatar, bio, location, occupation, anniversaryDate
      // They cannot update: id, birthDate, deathDate, gender, parentId, spouseId, generation
      const allowedFields = ['name', 'nickname', 'email', 'password', 'avatar', 'bio', 'location', 'occupation', 'anniversaryDate'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    // Check for duplicate email if email is being changed
    if (updateData.email && updateData.email !== member.email) {
      const existingMember = await FamilyMember.findOne({ 
        email: updateData.email.toLowerCase(),
        _id: { $ne: member._id }
      });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Check for duplicate ID if ID is being changed (admin only)
    if (updateData.id && updateData.id !== member.id && isAdmin) {
      const existingMember = await FamilyMember.findOne({ id: updateData.id });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "Family ID already exists",
        });
      }
    }

    // Validate parentId if provided (admin only)
    if (updateData.parentId !== undefined && updateData.parentId !== null && isAdmin) {
      const parent = await FamilyMember.findOne({ id: updateData.parentId });
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Parent ID not found",
        });
      }
    }

    // Validate spouseId if provided (admin only)
    if (updateData.spouseId !== undefined && updateData.spouseId !== null && isAdmin) {
      const spouse = await FamilyMember.findOne({ id: updateData.spouseId });
      if (!spouse) {
        return res.status(400).json({
          success: false,
          message: "Spouse ID not found",
        });
      }
    }

    // If password is being updated, it will be hashed by the pre-save hook
    const updatedMember = await FamilyMember.findByIdAndUpdate(
      member._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: updatedMember,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete family member
// @route   DELETE /api/family-members/:id
// @access  Private/Admin
export const deleteFamilyMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    let member;
    if (mongoose.Types.ObjectId.isValid(id)) {
      member = await FamilyMember.findById(id);
    } else {
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid member ID",
        });
      }
      member = await FamilyMember.findOne({ id: numericId });
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Family member not found",
      });
    }

    await FamilyMember.findByIdAndDelete(member._id);

    res.status(200).json({
      success: true,
      message: "Family member deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const resetMemberPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    let member;
    if (mongoose.Types.ObjectId.isValid(id)) {
      member = await FamilyMember.findById(id);
    } else {
      member = await FamilyMember.findOne({ id: parseInt(id) });
    }

    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    member.password = password;
    await member.save();

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
