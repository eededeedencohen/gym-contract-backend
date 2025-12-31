const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const productRouter = require("./routes/productRoutes");
const gymMemberRouter = require("./routes/gymMemberRoutes"); 

const app = express();

app.use(cors());
app.options("*", cors());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "50mb" }));

app.use("/api/v1/products", productRouter);
app.use("/api/v1/gym-members", gymMemberRouter); 

app.use(express.static('public'));
app.use(express.static('dist')); // frontned
// 2) ROUTES
// app.use('/api/v1/tours', tourRouter);

// בדיקת שרת בסיסית (אפשר למחוק אח"כ)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running successfully!",
    app: "Natours Template",
  });
});

// 3) UNHANDLED ROUTES (טיפול בכתובות לא קיימות)
app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

module.exports = app;
