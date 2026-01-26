import User from "../models/User.js";
import FamilyMember from "../models/FamilyMember.js";
import mongoose from "mongoose";

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    
    // Populate linkedFamilyMember data for each user
    const usersWithFamilyMembers = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        if (user.linkedFamilyMemberId) {
          const familyMember = await FamilyMember.findOne({ id: user.linkedFamilyMemberId });
          if (familyMember) {
            userObj.linkedFamilyMember = {
              id: familyMember.id,
              name: familyMember.name,
              avatar: familyMember.avatar,
              generation: familyMember.generation,
            };
          }
        }
        return userObj;
      })
    );
    
    res.status(200).json({ success: true, count: usersWithFamilyMembers.length, data: usersWithFamilyMembers });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    
    // Ensure user has linkedFamilyMemberId before approval
    if (!user.linkedFamilyMemberId) {
      return res
        .status(400)
        .json({ success: false, message: "User must be linked to a family member before approval" });
    }
    
    const updateData = { status: "approved" };
    if (role) updateData.role = role;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
    
    // Get linked FamilyMember
    const linkedFamilyMember = await FamilyMember.findOne({ id: updatedUser.linkedFamilyMemberId });
    const userObj = updatedUser.toObject();
    if (linkedFamilyMember) {
      userObj.linkedFamilyMember = {
        id: linkedFamilyMember.id,
        name: linkedFamilyMember.name,
        avatar: linkedFamilyMember.avatar,
        generation: linkedFamilyMember.generation,
      };
    }
    
    res.status(200).json({ success: true, data: userObj });
  } catch (error) {
    next(error);
  }
};

export const rejectUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }
    const user = await User.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    ).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }
    const user = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = password;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user's own profile (after approval)
// @route   PUT /api/users/me/profile
// @access  Private
export const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    
    // Only approved users can update their profile (Admins are usually approved or exempt, but logic holds)
    if (user.status !== "approved") {
      return res
        .status(403)
        .json({ success: false, message: "Only approved users can update their profile" });
    }
    
    // If not linked to a family member, only allow updating User fields directly
    if (!user.linkedFamilyMemberId) {
       const allowedUserFields = ['name', 'nickname', 'avatar', 'bio', 'location', 'occupation', 'birthDate', 'gender'];
       const userUpdateData = {};
       
       allowedUserFields.forEach((field) => {
         if (Object.prototype.hasOwnProperty.call(req.body, field)) {
           userUpdateData[field] = req.body[field];
         }
       });

       const updatedUser = await User.findByIdAndUpdate(userId, userUpdateData, {
          new: true,
          runValidators: true
       }).select("-password");

       return res.status(200).json({ success: true, data: updatedUser });
    }
    
    // Update the linked FamilyMember instead of User
    const allowedFields = ['name', 'nickname', 'avatar', 'bio', 'location', 'occupation', 'birthDate', 'gender'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updateData[field] = req.body[field];
      }
    });

    const familyMember = await FamilyMember.findOneAndUpdate(
      { id: user.linkedFamilyMemberId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!familyMember) {
      return res
        .status(404)
        .json({ success: false, message: "Linked family member not found" });
    }
    
    // Also update user name and nickname to match FamilyMember
    await User.findByIdAndUpdate(userId, { 
      name: familyMember.name,
      nickname: familyMember.nickname
    }, { new: true });

    res.status(200).json({ success: true, data: familyMember });
  } catch (error) {
    next(error);
  }
};