const mongoose = require("mongoose");
const AuthSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    email: { type: String, required: false },
    otp: { type: String, required: false },
    otpExpiresAt: { type: Date, required: false },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    verifyEmailToken: { type: String, required: false },
    verifyEmailExpires: { type: Date, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Auth", AuthSchema);
