const mongoose = require("mongoose");

const gymMemberSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: [true, "חובה להזין תעודת זהות/מזהה משתמש"],
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "חובה להזין שם פרטי"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "חובה להזין שם משפחה"],
      trim: true,
    },
    sign: {
      type: String, // ישמור את ה-URL של התמונה או מחרוזת Base64
      required: [true, "חובה להוסיף חתימה"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const GymMember = mongoose.model("GymMember", gymMemberSchema);

module.exports = GymMember;
