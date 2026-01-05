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
    const members = await FamilyMember.find().sort({ generation: 1, id: 1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available (unlinked) family members for signup
// @route   GET /api/family-members/available
// @access  Public (for signup)
export const getAvailableFamilyMembers = async (req, res, next) => {
  try {
    const User = (await import("../models/User.js")).default;
    // Get all users with linkedFamilyMemberId
    const linkedUsers = await User.find({
      linkedFamilyMemberId: { $ne: null },
    }).select("linkedFamilyMemberId");

    const linkedIds = linkedUsers
      .map((u) => u.linkedFamilyMemberId)
      .filter((id) => id !== null && id !== undefined);

    // Get all family members not linked to any user
    const availableMembers = await FamilyMember.find({
      id: { $nin: linkedIds },
    }).sort({ generation: 1, id: 1 });

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

      const ref = new Date(member.birthDate);
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
// @access  Private/Admin
export const updateFamilyMember = async (req, res, next) => {
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

    // Check for duplicate ID if ID is being changed
    if (req.body.id && req.body.id !== member.id) {
      const existingMember = await FamilyMember.findOne({ id: req.body.id });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "Family ID already exists",
        });
      }
    }

    // Validate parentId if provided
    if (req.body.parentId !== undefined && req.body.parentId !== null) {
      const parent = await FamilyMember.findOne({ id: req.body.parentId });
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Parent ID not found",
        });
      }
    }

    // Validate spouseId if provided
    if (req.body.spouseId !== undefined && req.body.spouseId !== null) {
      const spouse = await FamilyMember.findOne({ id: req.body.spouseId });
      if (!spouse) {
        return res.status(400).json({
          success: false,
          message: "Spouse ID not found",
        });
      }
    }

    const updatedMember = await FamilyMember.findByIdAndUpdate(
      member._id,
      req.body,
      { new: true, runValidators: true }
    );

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
