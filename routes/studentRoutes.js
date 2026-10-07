// routes/studentRoutes.js
const express = require("express");
const authController = require("../controllers/authController");
const {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getInvite,
} = require("../controllers/studentController");

const router = express.Router();

// ציבורי: מילוי-מראש של טופס החתימה לפי טוקן הזמנה אישי
router.get("/invite/:token", getInvite);

// שאר נתיבי הסטודנטים מיועדים למנהל בלבד
router.use(authController.protect);

router.route("/").get(getAllStudents).post(createStudent);
router.route("/:id").patch(updateStudent).delete(deleteStudent);

module.exports = router;
