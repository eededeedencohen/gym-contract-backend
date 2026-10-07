// routes/studentRoutes.js
const express = require("express");
const authController = require("../controllers/authController");
const {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

const router = express.Router();

// כל נתיבי הסטודנטים מיועדים למנהל בלבד
router.use(authController.protect);

router.route("/").get(getAllStudents).post(createStudent);
router.route("/:id").patch(updateStudent).delete(deleteStudent);

module.exports = router;
