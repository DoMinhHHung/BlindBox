const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const userModel = require("../models/userModel");
const authModel = require("../models/authModel");

// Create a new user
const createToken = (_id) => {
  const jwtkey = process.env.JWT_SECRET;
  return jwt.sign({ _id }, jwtkey, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const sendOtpEmail = async (email, otp, type = "verification") => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let subject = "BLINDBOX: Your OTP Verification Code";
  let heading = "OTP Verification Code";
  let description = "Here is your OTP verification code:";

  if (type === "password_change") {
    subject = "BLINDBOX: Password Change Request";
    heading = "Password Change Request";
    description = "Here is your OTP to reset your password:";
  } else if (type === "password_reset") {
    subject = "BLINDBOX: Password Reset Request";
    heading = "Password Reset Request";
    description = "Here is your OTP to reset your password:";
  } else if (type === "email_change") {
    subject = "BLINDBOX: Email Change Request";
    heading = "Email Change Verification";
    description = "Here is your OTP to verify your new email address:";
  }

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: subject,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px;">
            <div style="background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #007bff; margin-top: 0;">${heading}</h2>
                <p style="font-size: 16px;">${description}</p>
                <div style="background-color: #e0f7fa; color: #00acc1; font-size: 24px; font-weight: bold; padding: 15px; border-radius: 5px; text-align: center;">
                    ${otp}
                </div>
                <p style="font-size: 16px; margin-top: 20px;">This code will expire in <strong>5 minutes</strong>.</p>
                <p style="font-size: 16px;">Please do not share this code with anyone.</p>
                <p style="font-size: 14px; color: #777; margin-top: 30px;">Sincerely,<br>${process.env.EMAIL_FROM_NAME}</p>
            </div>
        </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP in auth collection
    await authModel.findOneAndUpdate(
      { email },
      { email, otp, otpExpiresAt },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, otp, "verification");

    return res.status(200).json({
      message: "OTP sent to your email for verification",
      email,
    });
  } catch (error) {
    console.error("Error in sendRegistrationOtp:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const registerUser = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    birthDate,
    address,
    password,
    otp,
  } = req.body;
  try {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !otp ||
      !birthDate ||
      !address
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await userModel.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Phone number already registered",
      });
    }

    const authRecord = await authModel.findOne({ email });
    if (
      !authRecord ||
      authRecord.otp !== otp ||
      authRecord.otpExpiresAt < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      address,
      password: hashedPassword,
    });

    await newUser.save();

    await authModel.findOneAndUpdate(
      { email },
      { $unset: { otp: "", otpExpiresAt: "" }, userId: newUser._id }
    );

    const token = createToken(newUser._id);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    if (!identifier || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const isEmail = validator.isEmail(identifier);
    const query = isEmail ? { email: identifier } : { phone: identifier };

    const user = await userModel.findOne(query);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await authModel.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        email,
        otp,
        otpExpiresAt,
      },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, otp, "password_reset");

    return res.status(200).json({
      message: "Password reset OTP sent to your email",
      email,
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const authRecord = await authModel.findOne({
      userId: user._id,
      otp,
    });

    if (!authRecord || authRecord.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

    await authModel.findOneAndUpdate(
      { userId: user._id },
      { $unset: { otp: "", otpExpiresAt: "" } }
    );

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const verifyAccount = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const authRecord = await authModel.findOne({ email });

    if (
      !authRecord ||
      authRecord.otp !== otp ||
      authRecord.otpExpiresAt < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res
      .status(200)
      .json({ message: "Email verified successfully", verified: true });
  } catch (error) {
    console.error("Error in verifyAccount:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    // Không cho phép cập nhật email hoặc role qua route này
    const updatedUser = await userModel
      .findByIdAndUpdate(
        req.user._id,
        { firstName, lastName, phone, address },
        { new: true }
      )
      .select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await userModel.findById(req.user._id);

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getSellerDashboard = async (req, res) => {
  try {
    // Lấy thông tin bảng điều khiển cho người bán
    // Dữ liệu thống kê, sản phẩm đang bán, doanh thu, v.v.

    res.status(200).json({
      success: true,
      message: "Seller dashboard data",
      data: {
        totalProducts: 0,
        pendingOrders: 0,
        revenue: 0,
        // Dữ liệu khác...
      },
    });
  } catch (error) {
    console.error("Error in getSellerDashboard:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createSellerProduct = async (req, res) => {
  try {
    // Xử lý tạo sản phẩm cho người bán
    // Có thể gọi đến Product Service qua API

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      // Dữ liệu sản phẩm...
    });
  } catch (error) {
    console.error("Error in createSellerProduct:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;

    const filter = {};
    if (role) {
      filter.role = role;
    }

    const users = await userModel
      .find(filter)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await userModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, birthDate } = req.body;

    const updatedUser = await userModel
      .findByIdAndUpdate(
        req.params.id,
        { firstName, lastName, email, phone, address, birthDate },
        { new: true }
      )
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await userModel.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "seller", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(req.params.id, { role }, { new: true })
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in changeUserRole:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  sendRegistrationOtp,
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyAccount,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getSellerDashboard,
  createSellerProduct,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
};
