const {
  getAllGyms,
  getGym,
  createGym,
  insertAllGyms,
  updateGym,
  deleteGym,
  deleteAllGyms,
} = require("../controllers/gymController");
const express = require("express");
const router = express.Router();
router.route("/deleteAll").delete(deleteAllGyms);
router.route("/:id").get(getGym).patch(updateGym).delete(deleteGym);
router.route("/").get(getAllGyms).post(createGym);
router.route("/insertMany/data").post(insertAllGyms);
module.exports = router;
