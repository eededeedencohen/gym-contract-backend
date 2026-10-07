// controllers/studentController.js
const Student = require("../models/studentModel");
const { STUDENT_STATUSES, GENDERS } = require("../models/studentModel");
const Gym = require("../models/gymModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { normalizePhone, isValidPhone } = require("../utils/phone");

// ============================
// Helpers
// ============================

const collapseSpaces = (s) => String(s || "").trim().replace(/\s+/g, " ");

// "ישראל ישראלי כהן" -> { firstName: "ישראל", lastName: "ישראלי כהן" }
const splitName = (fullName) => {
  const parts = collapseSpaces(fullName).split(" ");
  const firstName = parts.shift() || "";
  return { firstName, lastName: parts.join(" ") };
};

// מסמן סטודנט כחתום: מוריד "ממתין"/"נשלח טופס" ומוסיף "חתום"
const markSigned = (student) => {
  const keep = (student.statuses || []).filter(
    (s) => s !== "waiting" && s !== "form_sent"
  );
  if (!keep.includes("signed")) keep.push("signed");
  student.statuses = keep;
};

// מוצא סטודנט מתאים לחוזה (לפי טלפון, ואם אין - לפי שם מלא) ומקשר אותו.
// אם לא נמצא - יוצר סטודנט חדש בסטטוס "חתום".
const linkGymToStudent = async (gym) => {
  if (!gym) return null;

  // כבר מקושר?
  const already = await Student.findOne({ contractID: gym._id });
  if (already) return already;

  let student = null;
  const phone = normalizePhone(gym.phone);

  if (phone) {
    student = await Student.findOne({ phone, contractID: null });
  }

  if (!student) {
    const target = collapseSpaces(gym.memberName);
    if (target) {
      const candidates = await Student.find({ contractID: null });
      student =
        candidates.find(
          (s) => collapseSpaces(`${s.firstName} ${s.lastName}`) === target
        ) || null;
    }
  }

  if (student) {
    student.contractID = gym._id;
    if (!student.phone && phone) student.phone = phone;
    markSigned(student);
    await student.save();
    return student;
  }

  const { firstName, lastName } = splitName(gym.memberName);
  return Student.create({
    firstName: firstName || "ללא שם",
    lastName,
    phone,
    gender: "unknown",
    statuses: ["signed"],
    contractID: gym._id,
  });
};

// סנכרון מלא: כל חוזה חתום מקבל סטודנט בסטטוס "חתום"; קישורים "תלויים" מנוקים.
const syncSignedStudents = async () => {
  const gyms = await Gym.find().select("_id memberName phone");
  const gymIds = new Set(gyms.map((g) => String(g._id)));

  // 1. ניקוי סטודנטים שמקושרים לחוזה שכבר לא קיים
  const linked = await Student.find({ contractID: { $ne: null } }).select(
    "_id contractID statuses"
  );
  for (const s of linked) {
    if (!gymIds.has(String(s.contractID))) {
      s.contractID = null;
      s.statuses = (s.statuses || []).filter((st) => st !== "signed");
      if (s.statuses.length === 0) s.statuses = ["waiting"];
      await s.save();
    }
  }

  // 2. קישור / יצירה לכל חוזה ללא סטודנט
  const linkedIds = new Set(
    linked
      .filter((s) => gymIds.has(String(s.contractID)))
      .map((s) => String(s.contractID))
  );
  for (const gym of gyms) {
    if (linkedIds.has(String(gym._id))) continue;
    await linkGymToStudent(gym);
  }
};

// מסנן את גוף הבקשה לשדות המותרים בלבד
const pickStudentFields = (body) => {
  const data = {};
  if (typeof body.firstName === "string") data.firstName = body.firstName.trim();
  if (typeof body.lastName === "string") data.lastName = body.lastName.trim();
  if (typeof body.phone === "string") data.phone = normalizePhone(body.phone);
  if (typeof body.gender === "string" && GENDERS.includes(body.gender)) {
    data.gender = body.gender;
  }
  if (Array.isArray(body.statuses)) {
    const clean = [...new Set(body.statuses)].filter((s) =>
      STUDENT_STATUSES.includes(s)
    );
    data.statuses = clean.length ? clean : ["waiting"];
  }
  return data;
};

const validateStudentData = (data, { partial = false } = {}) => {
  if (!partial && !data.firstName) return "יש להזין שם פרטי";
  if (partial && data.firstName !== undefined && !data.firstName) {
    return "יש להזין שם פרטי";
  }
  if (data.phone && !isValidPhone(data.phone)) return "מספר טלפון לא תקין";
  return null;
};

const populateContract = (query) =>
  query.populate("contractID", "memberName memberID phone createdAt");

// ============================
// Handlers
// ============================

exports.getAllStudents = catchAsync(async (req, res, next) => {
  // מוודאים שכל מי שחתם מופיע כ"חתום"
  await syncSignedStudents();

  const students = await populateContract(
    Student.find().sort({ createdAt: -1 })
  );

  res.status(200).json({
    status: "success",
    results: students.length,
    data: { students },
  });
});

exports.createStudent = catchAsync(async (req, res, next) => {
  const data = pickStudentFields(req.body);
  const err = validateStudentData(data);
  if (err) return next(new AppError(err, 400));

  const created = await Student.create(data);
  const student = await populateContract(Student.findById(created._id));

  res.status(201).json({
    status: "success",
    data: { student },
  });
});

exports.updateStudent = catchAsync(async (req, res, next) => {
  const data = pickStudentFields(req.body);
  if (Object.keys(data).length === 0) {
    return next(new AppError("אין שדות לעדכון", 400));
  }
  const err = validateStudentData(data, { partial: true });
  if (err) return next(new AppError(err, 400));

  const student = await Student.findById(req.params.id);
  if (!student) return next(new AppError("הסטודנט לא נמצא", 404));

  Object.assign(student, data);
  await student.save();

  // שמירה על עקביות עם החוזה המקושר (טלפון ושם)
  if (student.contractID) {
    const gymUpdate = {};
    if (data.phone !== undefined) gymUpdate.phone = student.phone;
    if (data.firstName !== undefined || data.lastName !== undefined) {
      gymUpdate.memberName = `${student.firstName} ${student.lastName}`.trim();
    }
    if (Object.keys(gymUpdate).length) {
      await Gym.findByIdAndUpdate(student.contractID, gymUpdate);
    }
  }

  const populated = await populateContract(Student.findById(student._id));
  res.status(200).json({
    status: "success",
    data: { student: populated },
  });
});

exports.deleteStudent = catchAsync(async (req, res, next) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return next(new AppError("הסטודנט לא נמצא", 404));

  res.status(204).json({ status: "success", data: null });
});

// לשימוש מתוך gymController
exports.linkGymToStudent = linkGymToStudent;
exports.syncSignedStudents = syncSignedStudents;
