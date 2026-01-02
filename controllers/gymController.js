// const Gym = require("../models/gymModel");
// const Image = require("../models/imageModel"); // ייבוא המודל החדש
// const catchAsync = require("../utils/catchAsync");
// const APIfeatures = require("../utils/apiFeatures");

// // ========================
// // UPLOAD IMAGE HANDLER (MONGO VERSION)
// // ========================
// exports.uploadGymImage = catchAsync(async (req, res, next) => {
//   if (!req.file) {
//     return res.status(400).json({
//       status: "fail",
//       message: "No image uploaded",
//     });
//   }

//   // יצירת שם קובץ (בדיוק כמו שהיה ב-diskStorage - השם המקורי)
//   const filename = req.file.originalname;

//   // שמירה ב-MongoDB
//   // אנחנו בודקים אם קיימת תמונה עם שם זהה ומעדכנים אותה, או יוצרים חדשה
//   // זה מונע כפילויות אם מעלים שוב לאותו משתמש
//   const newImage = await Image.findOneAndUpdate(
//     { filename: filename },
//     {
//       filename: filename,
//       contentType: req.file.mimetype,
//       data: req.file.buffer, // המידע הבינארי של התמונה
//     },
//     { upsert: true, new: true }
//   );

//   // שמירת הנתיב היחסי (וירטואלי) כדי להחזיר ללקוח בדיוק את מה שהוא מצפה לקבל
//   // הצד לקוח ישתמש בנתיב הזה, שיפנה ל-endpoint שלנו: getImageByID
//   const relativePath = `/uploads/${filename}`;

//   console.log("Image saved to MongoDB:", filename);

//   res.status(200).json({
//     status: "success",
//     message: "Image uploaded successfully",
//     data: {
//       filePath: relativePath,
//       fileName: filename,
//     },
//   });
// });

// // ========================
// // GET IMAGE BY ID (MONGO VERSION)
// // ========================
// exports.getImageByID = catchAsync(async (req, res, next) => {
//   const imageId = req.params.id;

//   // לוגיקה זהה למה שהיה ב-FS: חיפוש קובץ שמתחיל ב-ID
//   // אנחנו משתמשים ב-Regex כדי לחקות את ההתנהגות של files.find(file => file.startsWith(imageId))
//   const image = await Image.findOne({
//     filename: { $regex: new RegExp(`^${imageId}`) },
//   });

//   if (!image) {
//     return res.status(404).json({
//       status: "fail",
//       message: "Image not found",
//     });
//   }

//   // הגדרת סוג התוכן (למשל image/png)
//   res.set("Content-Type", image.contentType);

//   // שליחת ה-Buffer ישירות לדפדפן
//   res.send(image.data);
// });

// // const fs = require("fs");
// // const path = require("path");
// // const Gym = require("../models/gymModel");
// // const catchAsync = require("../utils/catchAsync");
// // const APIfeatures = require("../utils/apiFeatures");

// // // ========================
// // // UPLOAD IMAGE HANDLER
// // // ========================
// // exports.uploadGymImage = catchAsync(async (req, res, next) => {
// //   // אם אין קובץ, נחזיר שגיאה (אופציונלי להשתמש ב-AppError שלך)
// //   if (!req.file) {
// //     return res.status(400).json({
// //       status: "fail",
// //       message: "No image uploaded",
// //     });
// //   }

// //   // שמירת הנתיב היחסי כדי לשמור ב-DB או להחזיר ללקוח
// //   // למשל: /uploads/gym-123456.jpg
// //   const relativePath = `/uploads/${req.file.filename}`;

// //   console.log("Image saved at:", req.file.path);

// //   res.status(200).json({
// //     status: "success",
// //     message: "Image uploaded successfully",
// //     data: {
// //       filePath: relativePath, // הנתיב שבו התמונה נשמרה
// //       fileName: req.file.filename,
// //     },
// //   });
// // });

// // // ========================
// // // GET IMAGE BY ID
// // // ========================
// // exports.getImageByID = catchAsync(async (req, res, next) => {
// //   const imageId = req.params.id;
// //   const uploadsDir = path.join(__dirname, "../public/uploads");

// //   // חיפוש קובץ שמתחיל ב-ID (למשל 315774000.png)
// //   const files = fs.readdirSync(uploadsDir);
// //   const imageFile = files.find((file) => file.startsWith(imageId));

// //   if (!imageFile) {
// //     return res.status(404).json({
// //       status: "fail",
// //       message: "Image not found",
// //     });
// //   }

// //   const imagePath = path.join(uploadsDir, imageFile);

// //   // שליחת הקובץ
// //   res.sendFile(imagePath);
// // });

// //------------------------
// // GET ALL GYMS
// //------------------------
// exports.getAllGyms = catchAsync(async (req, res, next) => {
//   // EXECUTE QUERY
//   const features = new APIfeatures(Gym.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   const gyms = await features.query;

//   // SEND RESPONSE
//   res.status(200).json({
//     status: "success",
//     results: gyms.length,
//     data: { gyms },
//   });
// });

// //------------------------
// // GET SINGLE GYM
// //------------------------
// exports.getGym = catchAsync(async (req, res, next) => {
//   // תיקון: חיפוש לפי memberID במקום _id
//   const gym = await Gym.findOne({ memberID: req.params.id });

//   if (!gym) {
//     return res.status(404).json({
//       status: "fail",
//       message: "No gym found with that ID",
//     });
//   }

//   res.status(200).json({
//     status: "success",
//     data: { gym },
//   });
// });

// //------------------------
// // ADD A NEW GYM
// //------------------------
// exports.createGym = catchAsync(async (req, res, next) => {
//   const newGym = await Gym.create(req.body);
//   console.log("New gym created:", newGym);

//   res.status(201).json({
//     status: "success",
//     data: { gym: newGym },
//   });
// });

// //------------------------
// // UPDATE GYM
// //------------------------
// exports.updateGym = catchAsync(async (req, res, next) => {
//   // תיקון: עדכון לפי memberID
//   const gym = await Gym.findOneAndUpdate(
//     { memberID: req.params.id },
//     req.body,
//     {
//       new: true, // מחזיר את האובייקט החדש המעודכן
//       runValidators: true, // מריץ בדיקות תקינות
//     }
//   );

//   if (!gym) {
//     return res.status(404).json({
//       status: "fail",
//       message: "No gym found with that ID",
//     });
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       gym,
//     },
//   });
// });

// //------------------------
// // DELETE GYM
// //------------------------
// exports.deleteGym = catchAsync(async (req, res, next) => {
//   // תיקון: מחיקה לפי memberID
//   const gym = await Gym.findOneAndDelete({ memberID: req.params.id });
//   const image = await Image.findOneAndDelete({
//     filename: { $regex: new RegExp(`^${req.params.id}`) },
//   });

//   if (!gym) {
//     return res.status(404).json({
//       status: "fail",
//       message: "No gym found with that ID",
//     });
//   }

//   if (!image) {
//     console.warn("No image found to delete for gym ID:", req.params.id);
//   }

//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// });

// //-------------------------------------------------
// // ADD ALL THE DATA FROM THE JSON FILE TO THE DATABASE
// //-------------------------------------------------
// exports.insertAllGyms = catchAsync(async (req, res, next) => {
//   const data = JSON.parse(
//     fs.readFileSync(`${__dirname}/../ConvertData/newGyms.json`, "utf-8")
//   );

//   const gyms = await Gym.insertMany(data);

//   res.status(201).json({
//     status: "success",
//     data: { gyms },
//   });
// });

// //-------------------------------------------------
// // DELETE ALL DATA (Utility)
// //-------------------------------------------------
// exports.deleteAllGyms = catchAsync(async (req, res, next) => {
//   await Gym.deleteMany();
//   await Image.deleteMany();

//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// });

const fs = require("fs"); // הוספתי את זה כי אתה משתמש בזה ב-insertAllGyms
const Gym = require("../models/gymModel");
const Image = require("../models/imageModel");
const catchAsync = require("../utils/catchAsync");
const APIfeatures = require("../utils/apiFeatures");

// ========================
// UPLOAD IMAGE HANDLER (MONGO VERSION)
// ========================
exports.uploadGymImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: "fail",
      message: "No image uploaded",
    });
  }

  // יצירת שם קובץ (בדיוק כמו שהיה ב-diskStorage - השם המקורי)
  const filename = req.file.originalname;

  // שמירה ב-MongoDB
  // אנחנו בודקים אם קיימת תמונה עם שם זהה ומעדכנים אותה, או יוצרים חדשה
  const newImage = await Image.findOneAndUpdate(
    { filename: filename },
    {
      filename: filename,
      contentType: req.file.mimetype,
      data: req.file.buffer, // המידע הבינארי של התמונה (כי אנחנו ב-MemoryStorage)
    },
    { upsert: true, new: true }
  );

  // שמירת הנתיב היחסי (וירטואלי) לשימוש בצד לקוח
  const relativePath = `/uploads/${filename}`;

  console.log("Image saved to MongoDB:", filename);

  res.status(200).json({
    status: "success",
    message: "Image uploaded successfully",
    data: {
      filePath: relativePath,
      fileName: filename,
    },
  });
});

// ========================
// GET IMAGE BY ID (MONGO VERSION)
// ========================
exports.getImageByID = catchAsync(async (req, res, next) => {
  const imageId = req.params.id;

  // חיפוש קובץ שמתחיל ב-ID
  const image = await Image.findOne({
    filename: { $regex: new RegExp(`^${imageId}`) },
  });

  if (!image) {
    return res.status(404).json({
      status: "fail",
      message: "Image not found",
    });
  }

  // הגדרת סוג התוכן ושליחת ה-Buffer
  res.set("Content-Type", image.contentType);
  res.send(image.data);
});

//------------------------
// GET ALL GYMS
//------------------------
exports.getAllGyms = catchAsync(async (req, res, next) => {
  const features = new APIfeatures(Gym.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const gyms = await features.query;

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
  const gym = await Gym.findOneAndUpdate(
    { memberID: req.params.id },
    req.body,
    {
      new: true,
      runValidators: true,
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
    data: { gym },
  });
});

//------------------------
// DELETE GYM
//------------------------
exports.deleteGym = catchAsync(async (req, res, next) => {
  const gym = await Gym.findOneAndDelete({ memberID: req.params.id });

  // מחיקת התמונה המקושרת גם כן
  const image = await Image.findOneAndDelete({
    filename: { $regex: new RegExp(`^${req.params.id}`) },
  });

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

//------------------------
// INSERT ALL DATA (From JSON)
//------------------------
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

//------------------------
// DELETE ALL DATA (Utility)
//------------------------
exports.deleteAllGyms = catchAsync(async (req, res, next) => {
  await Gym.deleteMany();
  await Image.deleteMany();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
