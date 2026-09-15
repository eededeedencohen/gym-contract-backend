// controllers/authController.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const AppError = require("../utils/appError"); // בהנחה שקיים אצלך
const catchAsync = require("../utils/catchAsync"); // בהנחה שקיים אצלך

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "90d",
  });
};

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  // 1. בדיקה אם הוזנו פרטים
  if (!username || !password) {
    return next(new AppError("Please provide username and password", 400));
  }

  // 2. בדיקה אם המשתמש קיים והסיסמה נכונה
  const admin = await Admin.findOne({ username }).select("+password");

  if (!admin || !(await admin.correctPassword(password, admin.password))) {
    return next(new AppError("Incorrect username or password", 401));
  }

  // 3. שליחת Token ללקוח
  const token = signToken(admin._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

// שינוי סיסמה (למנהל מחובר בלבד)
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // 1. בדיקת קלט
  if (!currentPassword || !newPassword) {
    return next(new AppError("יש להזין סיסמה נוכחית וסיסמה חדשה", 400));
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return next(new AppError("הסיסמה החדשה חייבת להכיל לפחות 6 תווים", 400));
  }
  if (newPassword === currentPassword) {
    return next(new AppError("הסיסמה החדשה חייבת להיות שונה מהנוכחית", 400));
  }

  // 2. שליפת המנהל מהטוקן
  const admin = await Admin.findById(req.user.id).select("+password");
  if (!admin) {
    return next(new AppError("המשתמש לא נמצא", 401));
  }

  // 3. אימות הסיסמה הנוכחית
  if (!(await admin.correctPassword(currentPassword, admin.password))) {
    return next(new AppError("הסיסמה הנוכחית שגויה", 401));
  }

  // 4. שמירה (ה-pre-save hook מצפין את הסיסמה)
  admin.password = newPassword;
  await admin.save();

  // 5. הנפקת טוקן חדש
  const token = signToken(admin._id);
  res.status(200).json({
    status: "success",
    message: "הסיסמה עודכנה בהצלחה",
    token,
  });
});

// Middleware להגנה על נתיבים
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("You are not logged in!", 401));
  }

  // אימות הטוקן
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // (ניתן להוסיף כאן בדיקה אם המשתמש עדיין קיים ב-DB)

  req.user = decoded;
  next();
});
