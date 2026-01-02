// // const express = require("express");
// // const morgan = require("morgan");
// // const cors = require("cors");
// // const productRouter = require("./routes/productRoutes");
// // const gymMemberRouter = require("./routes/gymMemberRoutes");

// // const app = express();

// // app.use(cors());
// // app.options("*", cors());

// // // Development logging
// // if (process.env.NODE_ENV === "development") {
// //   app.use(morgan("dev"));
// // }

// // // Body parser, reading data from body into req.body
// // app.use(express.json({ limit: "50mb" }));

// // app.use("/api/v1/products", productRouter);
// // app.use("/api/v1/gym-members", gymMemberRouter);

// // app.use(express.static('public'));
// // app.use(express.static('dist')); // frontned
// // // 2) ROUTES
// // // app.use('/api/v1/tours', tourRouter);

// // // בדיקת שרת בסיסית (אפשר למחוק אח"כ)
// // app.get("/", (req, res) => {
// //   res.status(200).json({
// //     status: "success",
// //     message: "Server is running successfully!",
// //     app: "Natours Template",
// //   });
// // });

// // // 3) UNHANDLED ROUTES (טיפול בכתובות לא קיימות)
// // app.all("*", (req, res, next) => {
// //   res.status(404).json({
// //     status: "fail",
// //     message: `Can't find ${req.originalUrl} on this server!`,
// //   });
// // });

// // module.exports = app;

// // server/app.js
// const express = require("express");
// const morgan = require("morgan");
// const cors = require("cors");
// const productRouter = require("./routes/productRoutes");
// const gymRouter = require("./routes/gymRoutes");

// const app = express();

// app.use(cors());
// app.options("*", cors());

// // Development logging
// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }

// // Body parser, reading data from body into req.body
// app.use(express.json({ limit: "50mb" }));

// app.use("/api/v1/products", productRouter);
// app.use("/api/v1/gyms", gymRouter);

// app.use(express.static("public"));
// app.use(express.static("dist")); // frontend

// // בדיקת שרת בסיסית
// app.get("/", (req, res) => {
//   res.status(200).json({
//     status: "success",
//     message: "Server is running successfully!",
//     app: "Natours Template",
//   });
// });

// // טיפול בכתובות לא קיימות (404)
// app.all("*", (req, res, next) => {
//   res.status(404).json({
//     status: "fail",
//     message: `Can't find ${req.originalUrl} on this server!`,
//   });
// });

// // --- זה החלק שהיה חסר לך! ---
// // Global Error Handler
// app.use((err, req, res, next) => {
//   console.error("🔥 Server Error:", err); // הדפסה ללוג של השרת

//   const statusCode = err.statusCode || 500;
//   const status = err.status || "error";

//   res.status(statusCode).json({
//     status: status,
//     message: err.message,
//     // stack: err.stack // אפשר להוסיף את זה אם רוצים לראות את הסטאק ב-response
//   });
// });

// module.exports = app;

const path = require("path"); // חובה להוסיף את זה
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const productRouter = require("./routes/productRoutes");
const gymRouter = require("./routes/gymRoutes");

const app = express();

// 1) GLOBAL MIDDLEWARES
app.use(cors());
app.options("*", cors());

// לוגים בפיתוח
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// קריאת JSON מהבקשה
app.use(express.json({ limit: "50mb" }));

// 2) API ROUTES (חייב לבוא לפני הסטטיק!)
app.use("/api/v1/products", productRouter);
app.use("/api/v1/gyms", gymRouter);

// 3) SERVING STATIC FILES (Frontend & Uploads)
// הגשת תמונות שהועלו
app.use(express.static(path.join(__dirname, "public")));
// הגשת קבצי הריאקט (הפרונט)
app.use(express.static(path.join(__dirname, "dist")));

// 4) HANDLING REACT ROUTING (התיקון החשוב)
// כל בקשה שלא הלכה ל-API או לקבצים סטטיים -> תשלח את ה-HTML הראשי
// זה מאפשר לריאקט לנהל את הראוטינג (כמו /admin)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// 5) GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);

  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    status: status,
    message: err.message,
  });
});

module.exports = app;
