const fs = require("fs");
const Gym = require("../models/gymModel");
const catchAsync = require("../utils/catchAsync");
const APIfeatures = require("../utils/apiFeatures");

//------------------------
// GET ALL GYMS
//------------------------
exports.getAllGyms = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIfeatures(Gym.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const gyms = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: gyms.length,
    data: { gyms },
  });
});

//------------------------
// GET SINGLE GYM
//------------------------
exports.getGym = catchAsync(async (req, res, next) => {
  // תיקון: חיפוש לפי memberID במקום _id
  const gym = await Gym.findOne({ memberID: req.params.id });

  if (!gym) {
    return res.status(404).json({
      status: "fail",
      message: "No gym found with that ID",
    });
  }

  res.status(200).json({
    status: "success",
    data: { gym },
  });
});

//------------------------
// ADD A NEW GYM
//------------------------
exports.createGym = catchAsync(async (req, res, next) => {
  const newGym = await Gym.create(req.body);
  console.log("New gym created:", newGym);

  res.status(201).json({
    status: "success",
    data: { gym: newGym },
  });
});

//------------------------
// UPDATE GYM
//------------------------
exports.updateGym = catchAsync(async (req, res, next) => {
  // תיקון: עדכון לפי memberID
  const gym = await Gym.findOneAndUpdate(
    { memberID: req.params.id },
    req.body,
    {
      new: true, // מחזיר את האובייקט החדש המעודכן
      runValidators: true, // מריץ בדיקות תקינות
    }
  );

  if (!gym) {
    return res.status(404).json({
      status: "fail",
      message: "No gym found with that ID",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      gym,
    },
  });
});

//------------------------
// DELETE GYM
//------------------------
exports.deleteGym = catchAsync(async (req, res, next) => {
  // תיקון: מחיקה לפי memberID
  const gym = await Gym.findOneAndDelete({ memberID: req.params.id });

  if (!gym) {
    return res.status(404).json({
      status: "fail",
      message: "No gym found with that ID",
    });
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

//-------------------------------------------------
// ADD ALL THE DATA FROM THE JSON FILE TO THE DATABASE
//-------------------------------------------------
exports.insertAllGyms = catchAsync(async (req, res, next) => {
  const data = JSON.parse(
    fs.readFileSync(`${__dirname}/../ConvertData/newGyms.json`, "utf-8")
  );

  const gyms = await Gym.insertMany(data);

  res.status(201).json({
    status: "success",
    data: { gyms },
  });
});

//-------------------------------------------------
// DELETE ALL DATA (Utility)
//-------------------------------------------------
exports.deleteAllGyms = catchAsync(async (req, res, next) => {
  await Gym.deleteMany();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
