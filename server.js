const mongoose = require("mongoose");
const dotenv = require("dotenv");

// טיפול בשגיאות סינכרוניות שלא נתפסו (Uncaught Exception)
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// טעינת משתני סביבה
dotenv.config({ path: "./config.env" });

const app = require("./app");

// התחברות ל-Database
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB connection successful!"));

// הרצת השרת
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// טיפול בשגיאות א-סינכרוניות (Unhandled Rejection) - למשל כישלון בחיבור ל-DB
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
