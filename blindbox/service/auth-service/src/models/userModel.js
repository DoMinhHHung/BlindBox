const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    birthDate: { type: Date, required: true },
    address: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    createAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
