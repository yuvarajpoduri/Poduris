import User from "../models/User.js";

export const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide email, password, and name",
        });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const user = await User.create({
      email,
      password,
      name,
      role: role || "family_member",
      status: role === "admin" ? "approved" : "pending",
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
