// const express = require("express");
// const multer = require("multer"); // ייבוא multer
// const path = require("path");
// const fs = require("fs");

// const {
//   getAllGyms,
//   getGym,
//   createGym,
//   insertAllGyms,
//   updateGym,
//   deleteGym,
//   deleteAllGyms,
//   uploadGymImage, // הפונקציה החדשה שנוסיף ב-Controller
//   getImageByID,
// } = require("../controllers/gymController");

// const router = express.Router();

// // ============================
// // MULTER CONFIGURATION
// // ============================
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // נתיב השמירה: public/uploads
//     const dir = path.join(__dirname, "../public/uploads");

//     // בדיקה אם התיקייה קיימת, ואם לא - ליצור אותה
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }

//     cb(null, dir);
//   },
//   filename: (req, file, cb) => {
//     // שימוש בשם המקורי של הקובץ
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({ storage });

// // ============================
// // ROUTES
// // ============================

// // נתיב להעלאת תמונה
// // מקבל שדה בשם 'image' (כמו בפרויקט הקודם שלך)
// router.post("/upload-image", upload.single("image"), uploadGymImage);

// // נתיב להחזרת תמונה לפי ID
// router.get("/image/:id", getImageByID);

// // שאר הנתיבים הקיימים
// router.route("/deleteAll").delete(deleteAllGyms);
// router.route("/:id").get(getGym).patch(updateGym).delete(deleteGym);
// router.route("/").get(getAllGyms).post(createGym);
// router.route("/insertMany/data").post(insertAllGyms);

// module.exports = router;
//=====================================================
// const express = require("express");
// const multer = require("multer");
// const {
//   getAllGyms,
//   getGym,
//   createGym,
//   insertAllGyms,
//   updateGym,
//   deleteGym,
//   deleteAllGyms,
//   uploadGymImage,
//   getImageByID,
// } = require("../controllers/gymController");

// const router = express.Router();

// // ============================
// // MULTER CONFIGURATION - CHANGED TO MEMORY STORAGE
// // ============================
// const storage = multer.memoryStorage();

// const upload = multer({ storage });

// // ============================
// // ROUTES
// // ============================

// router.post("/upload-image", upload.single("image"), uploadGymImage);

// router.get("/image/:id", getImageByID);

// router.route("/deleteAll").delete(deleteAllGyms);
// router.route("/:id").get(getGym).patch(updateGym).delete(deleteGym);
// router.route("/").get(getAllGyms).post(createGym);
// router.route("/insertMany/data").post(insertAllGyms);

// module.exports = router;

const express = require("express");
const multer = require("multer");
const authController = require("../controllers/authController"); // 1. הייבוא של האבטחה
const {
  getAllGyms,
  getGym,
  createGym,
  insertAllGyms,
  updateGym,
  deleteGym,
  deleteAllGyms,
  uploadGymImage,
  getImageByID,
} = require("../controllers/gymController");

const router = express.Router();

// ============================
// MULTER CONFIGURATION
// ============================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ============================
// 1. PUBLIC ROUTES (פתוח לכולם)
// ============================

// נתיב התחברות למנהל (כדי שתוכל לקבל את הטוקן)
router.post("/login", authController.login);

// שליחת הטופס - חייב להיות פתוח ללקוח
router.post("/", createGym);

// העלאת תמונה/חתימה - חייב להיות פתוח כי זה חלק מהטופס של הלקוח
router.post("/upload-image", upload.single("image"), uploadGymImage);

// צפייה בתמונה - בדרך כלל משאירים פתוח כדי שיהיה קל להציג בדפדפן
router.get("/image/:id", getImageByID);

// ============================
// 2. SECURITY MIDDLEWARE (מחסום)
// ============================
// כל נתיב שיוגדר מתחת לשורה הזו יחייב שליחת Token תקני
router.use(authController.protect);

// ============================
// 3. PROTECTED ROUTES (רק למנהל)
// ============================

// קבלת כל החוזים (רק מנהל צריך לראות את הרשימה)
router.get("/", getAllGyms);

// פעולות מחיקה ועריכה מתקדמות
router.route("/deleteAll").delete(deleteAllGyms);
router.route("/insertMany/data").post(insertAllGyms);

// פעולות על חוזה ספציפי (קריאה, עריכה, מחיקה)
router.route("/:id").get(getGym).patch(updateGym).delete(deleteGym);

module.exports = router;
