const fs = require("fs");
const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const APIfeatures = require("../utils/apiFeatures");

//------------------------
// GET ALL PRODUCTS
//------------------------
exports.getAllProducts = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIfeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: products.length,
    data: { products },
  });
});

//------------------------
// GET SINGLE PRODUCT
//------------------------
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  // Tour.findOne({ _id: req.params.id })
  res.status(200).json({
    status: "success",
    data: { product },
  });
});

//------------------------
// ADD A NEW PRODUCT
//------------------------
exports.createProduct = catchAsync(async (req, res, next) => {
  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: "success",
    data: { product: newProduct },
  });
});

//-------------------------------------------------
// ADD ALL THE DATA FROM THE JSON FILE TO THE DATABASE
//-------------------------------------------------
exports.insertAllProducts = catchAsync(async (req, res, next) => {
  const data = JSON.parse(
    fs.readFileSync(`${__dirname}/../ConvertData/newProducts.json`, "utf-8")
  );
  const products = await Product.insertMany(data);

  res.status(201).json({
    status: "success",
    data: { products },
  });
});

//------------------------
// UPDATE A PRODUCT
//------------------------
exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

//------------------------
// DELETE A PRODUCT
//------------------------
exports.deleteProduct = catchAsync(async (req, res, next) => {
  await Product.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
