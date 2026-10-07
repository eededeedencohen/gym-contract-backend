// models/adminModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // שם תצוגה - מופיע בממשק ובניסוח הודעות הוואטסאפ
  displayName: {
    type: String,
    trim: true,
    default: "שמרית",
    maxlength: [40, "השם ארוך מדי"],
  },
});

// הצפנת הסיסמה לפני שמירה
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
