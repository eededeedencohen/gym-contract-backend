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

// מוצא סטודנט מתאים לחוזה (לפי טוקן הזמנה, טלפון, ואם אין - לפי שם מלא) ומקשר אותו.
// אם לא נמצא - יוצר סטודנט חדש בסטטוס "חתום".
const linkGymToStudent = async (gym, inviteToken = null) => {
  if (!gym) return null;

  // כבר מקושר?
  const already = await Student.findOne({ contractID: gym._id });
  if (already) return already;

  let student = null;
  const phone = normalizePhone(gym.phone);

  // 1. הקישור האישי שנשלח בוואטסאפ - הזיהוי הכי אמין
  if (inviteToken) {
    student = await Student.findOne({ inviteToken, contractID: null });
  }

  if (!student && phone) {
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
  // 0. השלמת טוקן הזמנה לסטודנטים ותיקים
  const noToken = await Student.find({
    $or: [{ inviteToken: { $exists: false } }, { inviteToken: null }],
  });
  for (const s of noToken) await s.save(); // ה-pre-save מייצר טוקן

  const gyms = await Gym.find().select("_id memberName phone");
  const gymIds = new Set(gyms.map((g) => String(g._id)));

  // 1. ניקוי סטודנטים שמקושרים לחוזה שכבר לא קיים
  const linked = await Student.find({ contractID: { $ne: null } }).select(
    "_id contractID statuses"
  );
  for (const s of linked) {
    if (!gymIds.has(String(s.contractID))) {
      // החוזה נמחק - הסטודנט חוזר לתחילת התהליך
      s.contractID = null;
      s.statuses = ["waiting"];
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

// ============================
// Status workflow
// ============================
// שלב (אחד בלבד, אוטומטי):  waiting -> form_sent -> signed (קבוע)
// מנוי (אחד לכל היותר, רק אחרי חתימה): interested / active / finished / not_interested
const MEMBERSHIP = ["interested", "active", "finished", "not_interested"];
const ALLOWED_MEMBERSHIP_TRANSITIONS = {
  none: ["interested", "active", "not_interested"],
  interested: ["interested", "active", "not_interested"],
  active: ["active", "finished", "not_interested"],
  finished: ["finished", "interested", "active", "not_interested"],
  not_interested: ["not_interested", "interested", "active", "finished"],
};

const isStudentSigned = (student) =>
  Boolean(student && (student.contractID || (student.statuses || []).includes("signed")));

const currentMembershipOf = (student) =>
  (student?.statuses || []).find((s) => MEMBERSHIP.includes(s)) || null;

// מחשב את מערך הסטטוסים החוקי לפי המצב הנוכחי והבקשה.
// מחזיר { statuses } או { error }.
const resolveStatuses = (current, requested) => {
  const req = Array.isArray(requested)
    ? [...new Set(requested)].filter((s) => STUDENT_STATUSES.includes(s))
    : [];
  const signed = isStudentSigned(current);

  // שלב
  let stage = "waiting";
  if (signed) stage = "signed";
  else if (req.includes("form_sent")) stage = "form_sent";
  else if (req.includes("waiting") || req.length === 0) stage = "waiting";
  else if ((current?.statuses || []).includes("form_sent")) stage = "form_sent";

  // מנוי
  const currentMembership = currentMembershipOf(current);
  const requestedMembership = req.find((s) => MEMBERSHIP.includes(s)) || null;
  let membership = requestedMembership || currentMembership; // אי אפשר "לנקות" מנוי

  if (!signed) {
    if (requestedMembership) {
      return { error: "אפשר לסמן מנוי / לא מעוניין רק אחרי שהסטודנט חתם" };
    }
    membership = null;
  } else if (membership !== currentMembership) {
    const allowed = ALLOWED_MEMBERSHIP_TRANSITIONS[currentMembership || "none"];
    if (!allowed.includes(membership)) {
      return { error: "מעבר סטטוס לא חוקי" };
    }
  }

  return { statuses: membership ? [stage, membership] : [stage] };
};

// מסנן את גוף הבקשה לשדות המותרים בלבד (ללא סטטוסים - הם מטופלים בנפרד)
const pickStudentFields = (body) => {
  const data = {};
  if (typeof body.firstName === "string") data.firstName = body.firstName.trim();
  if (typeof body.lastName === "string") data.lastName = body.lastName.trim();
  if (typeof body.phone === "string") data.phone = normalizePhone(body.phone);
  if (typeof body.gender === "string" && GENDERS.includes(body.gender)) {
    data.gender = body.gender;
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

// ציבורי: פרטי מילוי-מראש לטופס לפי טוקן הזמנה (מחזיר רק מה שהטופס צריך)
exports.getInvite = catchAsync(async (req, res, next) => {
  const token = String(req.params.token || "");
  if (!/^[a-f0-9]{32}$/.test(token)) {
    return next(new AppError("קישור לא תקין", 404));
  }
  const student = await Student.findOne({ inviteToken: token }).select(
    "firstName lastName phone contractID"
  );
  if (!student) return next(new AppError("קישור לא תקין", 404));

  res.status(200).json({
    status: "success",
    data: {
      invite: {
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        phone: student.phone || "",
        alreadySigned: Boolean(student.contractID),
      },
    },
  });
});

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

  // סטודנט חדש תמיד מתחיל ב"ממתין"
  data.statuses = ["waiting"];

  const created = await Student.create(data);
  const student = await populateContract(Student.findById(created._id));

  res.status(201).json({
    status: "success",
    data: { student },
  });
});

exports.updateStudent = catchAsync(async (req, res, next) => {
  const data = pickStudentFields(req.body);
  const hasStatuses = Array.isArray(req.body.statuses);
  if (Object.keys(data).length === 0 && !hasStatuses) {
    return next(new AppError("אין שדות לעדכון", 400));
  }
  const err = validateStudentData(data, { partial: true });
  if (err) return next(new AppError(err, 400));

  const student = await Student.findById(req.params.id);
  if (!student) return next(new AppError("הסטודנט לא נמצא", 404));

  if (hasStatuses) {
    const resolved = resolveStatuses(student, req.body.statuses);
    if (resolved.error) return next(new AppError(resolved.error, 400));
    data.statuses = resolved.statuses;
  }

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
