// const {
//   getAllGyms,
//   getGym,
//   createGym,
//   insertAllGyms,
//   updateGym,
//   deleteGym,
//   deleteAllGyms,
// } = require("../controllers/gymController");
// const express = require("express");
// const router = express.Router();
// router.route("/deleteAll").delete(deleteAllGyms);
// router.route("/:id").get(getGym).patch(updateGym).delete(deleteGym);
// router.route("/").get(getAllGyms).post(createGym);
// router.route("/insertMany/data").post(insertAllGyms);
// module.exports = router;

// routes/gymRoutes.js
const express = require("express");
const multer = require("multer"); // ייבוא multer
const path = require("path");
const fs = require("fs");

const {
  getAllGyms,
  getGym,
  createGym,
  insertAllGyms,
  updateGym,
  deleteGym,
  deleteAllGyms,
  uploadGymImage, // הפונקציה החדשה שנוסיף ב-Controller
} = require("../controllers/gymController");

const router = express.Router();

// ============================
// MULTER CONFIGURATION
// ============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // נתיב השמירה: public/uploads
    const dir = path.join(__dirname, "../public/uploads");

    // בדיקה אם התיקייה קיימת, ואם לא - ליצור אותה
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // שימוש בשם המקורי של הקובץ
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// ============================
// ROUTES
// ============================

// נתיב להעלאת תמונה
// מקבל שדה בשם 'image' (כמו בפרויקט הקודם שלך)
router.post("/upload-image", upload.single("image"), uploadGymImage);

// שאר הנתיבים הקיימים
router.route("/deleteAll").delete(deleteAllGyms);
router.route("/:id").get(getGym).patch(updateGym).delete(deleteGym);
router.route("/").get(getAllGyms).post(createGym);
router.route("/insertMany/data").post(insertAllGyms);

module.exports = router;