const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const express = require("express");
const router = express.Router();

router.route("/:id").get(getProduct).patch(updateProduct).delete(deleteProduct);

router.route("/").get(getAllProducts).post(createProduct);

module.exports = router;