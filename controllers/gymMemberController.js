// // controllers/gymMemberController.js
// const GymMember = require("../models/gymMemberModel");
// const catchAsync = require("../utils/catchAsync");
// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");

// exports.createMember = catchAsync(async (req, res, next) => {
//   // 1. קודם כל שומרים את המשתמש במסד הנתונים
//   const newMember = await GymMember.create(req.body);

//   // 2. מנסים ליצור PDF (בתוך בלוק try-catch כדי שלא יפיל את השרת אם נכשל)
//   let pdfUrl = null;

//   try {
//     const doc = new PDFDocument({ size: "A4", margin: 50 });
//     const fileName = `contract-${newMember.userID}-${Date.now()}.pdf`;

//     // יצירת הנתיב המלא
//     const contractsDir = path.join(__dirname, "../public/contracts");
//     const filePath = path.join(contractsDir, fileName);

//     // וידוא שהתיקייה קיימת
//     if (!fs.existsSync(contractsDir)) {
//       fs.mkdirSync(contractsDir, { recursive: true });
//     }

//     const stream = fs.createWriteStream(filePath);
//     doc.pipe(stream);

//     // --- תוכן המסמך ---
//     doc.fontSize(20).text("Gym Subscription Contract", { align: "center" });
//     doc.moveDown();
//     doc.fontSize(12).text(`Name: ${newMember.firstName} ${newMember.lastName}`);
//     doc.text(`ID: ${newMember.userID}`);
//     doc.text(`Date: ${new Date().toLocaleDateString()}`);
//     doc.moveDown().text("Terms and Conditions...");

//     // --- הוספת חתימה בטוחה ---
//     if (req.body.sign) {
//       try {
//         // ניקוי ה-Prefix של ה-Base64 (כמו data:image/png;base64,...)
//         // נשתמש בפתרון שעובד גם אם יש prefix וגם אם אין
//         const parts = req.body.sign.split(",");
//         const base64Data = parts.length > 1 ? parts[1] : parts[0];

//         doc.moveDown().text("Signature:");
//         doc.image(Buffer.from(base64Data, "base64"), { width: 150 });
//       } catch (sigErr) {
//         console.error("Error adding signature image:", sigErr.message);
//         doc.text("(Signature image could not be loaded)");
//       }
//     }

//     doc.end();

//     // נתיב יחסי עבור הלקוח
//     pdfUrl = `/contracts/${fileName}`;
//   } catch (pdfErr) {
//     // אם יצירת ה-PDF נכשלת, אנחנו *לא* עוצרים את הבקשה, אלא רק רושמים שגיאה
//     console.error("PDF Generation failed:", pdfErr);
//   }

//   // 3. תמיד מחזירים תשובה ללקוח, גם אם ה-PDF נכשל
//   res.status(201).json({
//     status: "success",
//     data: {
//       member: newMember,
//       pdfUrl: pdfUrl, // יהיה null אם נכשל, וזה בסדר
//       message: pdfUrl ? "Success" : "Member saved, but PDF failed",
//     },
//   });
// });

// // וודא שאתה מייצא גם את הפונקציות האחרות אם ישנן (כמו getAllMembers)
// exports.getAllMembers = catchAsync(async (req, res, next) => {
//   const members = await GymMember.find();
//   res
//     .status(200)
//     .json({ status: "success", results: members.length, data: { members } });
// });
// // וכן הלאה...
// server/controllers/gymMemberController.js
const GymMember = require("../models/gymMemberModel");
const catchAsync = require("../utils/catchAsync");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.createMember = catchAsync(async (req, res, next) => {
  // 1. שמירה בבסיס הנתונים (אם זה נכשל, זה יזרוק שגיאה וייעצר כאן)
  const newMember = await GymMember.create(req.body);

  let pdfUrl = null;

  // 2. ניסיון ליצור PDF בתוך בלוק try-catch כדי שלא יפיל את השרת
  try {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const fileName = `contract-${newMember.userID}-${Date.now()}.pdf`;

    // הגדרת נתיבים ובדיקה שהתיקייה קיימת
    const contractsDir = path.join(__dirname, "../public/contracts");
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    const filePath = path.join(contractsDir, fileName);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // כתיבת התוכן
    doc.fontSize(20).text("Gym Subscription Contract", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${newMember.firstName} ${newMember.lastName}`);
    doc.text(`ID: ${newMember.userID}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown().text("Terms and Conditions...");

    // הוספת חתימה בצורה בטוחה
    if (req.body.sign) {
      try {
        // טיפול בפורמטים שונים של base64
        const parts = req.body.sign.split(",");
        const base64Data = parts.length > 1 ? parts[1] : parts[0];

        doc.moveDown().text("Signature:");
        doc.image(Buffer.from(base64Data, "base64"), { width: 150 });
      } catch (imgErr) {
        console.error("Signature image error:", imgErr.message);
        doc.text("(Signature failed to load)");
      }
    }

    doc.end();
    pdfUrl = `/contracts/${fileName}`;
  } catch (pdfErr) {
    // אם ה-PDF נכשל, אנחנו רק מדפיסים ללוג ולא עוצרים את הבקשה!
    console.error("🔥 PDF Generation Error:", pdfErr);
  }

  // 3. החזרת תשובה ללקוח בכל מקרה
  res.status(201).json({
    status: "success",
    data: {
      member: newMember,
      pdfUrl: pdfUrl, // יהיה null אם ה-PDF נכשל
      message: pdfUrl ? "Contract created" : "Member saved (PDF failed)",
    },
  });
});

// ייצוא שאר הפונקציות
exports.getAllMembers = catchAsync(async (req, res, next) => {
  const members = await GymMember.find();
  res
    .status(200)
    .json({ status: "success", results: members.length, data: { members } });
});
// (הוסף כאן את getMember, updateMember, deleteMember אם צריך)
