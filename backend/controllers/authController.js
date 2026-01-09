import FamilyMember from "../models/FamilyMember.js";

// Hardcoded admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@poduris.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

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
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

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
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
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
