// models/studentModel.js
const mongoose = require("mongoose");
const { normalizePhone, isValidPhone } = require("../utils/phone");

// סטטוסים (תגיות) - אפשר יותר מאחד לכל סטודנט
const STUDENT_STATUSES = [
  "waiting", // ממתין
  "form_sent", // נשלח טופס לחתימה
  "signed", // חתום
  "active", // מנוי בפרופיט
  "finished", // סיים מנוי בפרופיט
  "not_interested", // לא מעוניין
];

const GENDERS = ["male", "female", "unknown"];

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "יש להזין שם פרטי"],
      trim: true,
      minlength: [1, "יש להזין שם פרטי"],
      maxlength: [50, "שם פרטי ארוך מדי"],
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [50, "שם משפחה ארוך מדי"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      set: normalizePhone,
      validate: {
        validator: (v) => !v || isValidPhone(v),
        message: "מספר טלפון לא תקין",
      },
    },
    gender: {
      type: String,
      enum: GENDERS,
      default: "unknown",
    },
    statuses: {
      type: [{ type: String, enum: STUDENT_STATUSES }],
      default: ["waiting"],
    },
    // קישור לחוזה חתום (אם קיים)
    contractID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

studentSchema.index({ phone: 1 });
studentSchema.index({ contractID: 1 });

studentSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
module.exports.STUDENT_STATUSES = STUDENT_STATUSES;
module.exports.GENDERS = GENDERS;
