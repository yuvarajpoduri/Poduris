import User from "../models/User.js";
import FamilyMember from "../models/FamilyMember.js";

export const register = async (req, res, next) => {
  try {
    const { email, password, linkedFamilyMemberId } = req.body;
    if (!email || !password || !linkedFamilyMemberId) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password, and select a family member",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Validate that FamilyMember exists
    const familyMember = await FamilyMember.findOne({
      id: linkedFamilyMemberId,
    });
    if (!familyMember) {
      return res
        .status(400)
        .json({ success: false, message: "Selected family member not found" });
    }

    // Check if FamilyMember is already linked to another user
    const existingLink = await User.findOne({ linkedFamilyMemberId });
    if (existingLink) {
      return res
        .status(400)
        .json({
          success: false,
          message: "This family member is already linked to another user",
        });
    }

    // Create user with linkedFamilyMemberId
    const user = await User.create({
      email,
      password,
      name: familyMember.name, // Use FamilyMember name initially
      linkedFamilyMemberId,
      role: "family_member",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please wait for admin approval.",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        linkedFamilyMemberId: user.linkedFamilyMemberId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    if (user.role !== "admin" && user.status === "pending") {
      return res
        .status(403)
        .json({ success: false, message: "Your account is pending approval." });
    }
    req.session.userId = user._id.toString();
    req.session.userRole = user.role;
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status || "approved",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
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
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Get linked FamilyMember if exists
    let linkedFamilyMember = null;
    if (user.linkedFamilyMemberId) {
      linkedFamilyMember = await FamilyMember.findOne({
        id: user.linkedFamilyMemberId,
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status || "approved",
        linkedFamilyMemberId: user.linkedFamilyMemberId,
        linkedFamilyMember: linkedFamilyMember
          ? {
              id: linkedFamilyMember.id,
              name: linkedFamilyMember.name,
              avatar: linkedFamilyMember.avatar,
              generation: linkedFamilyMember.generation,
              birthDate: linkedFamilyMember.birthDate,
              gender: linkedFamilyMember.gender,
              occupation: linkedFamilyMember.occupation,
              location: linkedFamilyMember.location,
              bio: linkedFamilyMember.bio,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Error logging out" });
      res.clearCookie("family_tree_sid");
      res
        .status(200)
        .json({ success: true, message: "Logged out successfully" });
    });
  } catch (error) {
    next(error);
  }
};
