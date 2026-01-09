import FamilyMember from "../models/FamilyMember.js";

<<<<<<< HEAD
// Hardcoded admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@poduris.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
=======
export const register = async (req, res, next) => {
  try {
    const { email, password, linkedFamilyMemberId } = req.body;

    if (!email || !password || !linkedFamilyMemberId) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password, and select a family member",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const familyMember = await FamilyMember.findOne({
      id: linkedFamilyMemberId,
    });

    if (!familyMember) {
      return res.status(400).json({
        success: false,
        message: "Selected family member not found",
      });
    }

    const existingLink = await User.findOne({ linkedFamilyMemberId });
    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: "This family member is already linked to another user",
      });
    }

    const user = await User.create({
      email,
      password,
      name: familyMember.name,
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
>>>>>>> 3c8a2a087cf8d1de97ed55022004c88257f07561

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

<<<<<<< HEAD
    // Check if it's admin login
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if (password === ADMIN_PASSWORD) {
        req.session.familyMemberId = "admin";
        req.session.role = "admin";
        res.status(200).json({
          success: true,
          user: {
            id: "admin",
            email: ADMIN_EMAIL,
            name: "Admin",
            role: "admin",
            avatar: "",
          },
        });
        return;
      } else {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
    }

    // Check if email exists in FamilyMember
    const familyMember = await FamilyMember.findOne({ email: email.toLowerCase() }).select("+password");
    if (!familyMember) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // If password doesn't exist, allow setting it on first login
    if (!familyMember.password) {
      // Set password on first login
      familyMember.password = password;
      await familyMember.save();
      
      req.session.familyMemberId = familyMember._id.toString();
      req.session.role = "member";
      res.status(200).json({
        success: true,
        user: {
          id: familyMember._id.toString(),
          email: familyMember.email,
          name: familyMember.name,
          role: "member",
          avatar: familyMember.avatar || "",
          familyMemberId: familyMember.id,
        },
      });
      return;
    }

    // Validate password
    const isMatch = await familyMember.comparePassword(password);
=======
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);
>>>>>>> 3c8a2a087cf8d1de97ed55022004c88257f07561
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

<<<<<<< HEAD
    // Set session
    req.session.familyMemberId = familyMember._id.toString();
    req.session.role = "member";
    res.status(200).json({
      success: true,
      user: {
        id: familyMember._id.toString(),
        email: familyMember.email,
        name: familyMember.name,
        role: "member",
        avatar: familyMember.avatar || "",
        familyMemberId: familyMember.id,
=======
    if (user.role !== "admin" && user.status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval.",
      });
    }

    req.session.user = {
      id: user._id.toString(),
      role: user.role,
      linkedFamilyMemberId: user.linkedFamilyMemberId,
    };

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status || "approved",
        linkedFamilyMemberId: user.linkedFamilyMemberId,
>>>>>>> 3c8a2a087cf8d1de97ed55022004c88257f07561
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
<<<<<<< HEAD
    const familyMemberId = req.session.familyMemberId;
    const role = req.session.role;
    
    if (!familyMemberId || !role) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    // Handle admin
    if (role === "admin") {
      return res.status(200).json({
        success: true,
        user: {
          id: "admin",
          email: ADMIN_EMAIL,
          name: "Admin",
          role: "admin",
          avatar: "",
        },
      });
    }

    // Handle family member
    const familyMember = await FamilyMember.findById(familyMemberId);
    if (!familyMember) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
=======
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let linkedFamilyMember = null;
    if (user.linkedFamilyMemberId) {
      linkedFamilyMember = await FamilyMember.findOne({
        id: user.linkedFamilyMemberId,
>>>>>>> 3c8a2a087cf8d1de97ed55022004c88257f07561
      });
      return res
        .status(404)
        .json({ success: false, message: "Family member not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: familyMember._id.toString(),
        email: familyMember.email,
        name: familyMember.name,
        role: "member",
        avatar: familyMember.avatar || "",
        familyMemberId: familyMember.id,
        bio: familyMember.bio || "",
        location: familyMember.location || "",
        occupation: familyMember.occupation || "",
        birthDate: familyMember.birthDate,
        anniversaryDate: familyMember.anniversaryDate || null,
        gender: familyMember.gender,
        generation: familyMember.generation,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    req.session.destroy(() => {
      res.clearCookie("poduris.sid");
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    });
  } catch (error) {
    next(error);
  }
};
