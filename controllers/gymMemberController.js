// controllers/gymMemberController.js
const GymMember = require("../models/gymMemberModel");
const catchAsync = require("../utils/catchAsync");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.createMember = catchAsync(async (req, res, next) => {
  const newMember = await GymMember.create(req.body);

  // יצירת ה-PDF
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const fileName = `contract-${newMember.userID}.pdf`;
  const filePath = path.join(__dirname, "../public/contracts", fileName);

  if (!fs.existsSync(path.dirname(filePath)))
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // עיצוב ה-PDF (דוגמה בסיסית - לעברית נדרש טעינת פונט .ttf)
  doc.fontSize(20).text("Gym Subscription Contract", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${newMember.firstName} ${newMember.lastName}`);
  doc.text(`ID: ${newMember.userID}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);

  doc.moveDown().text("Terms and Conditions...");

  // הוספת החתימה מה-Base64
  const base64Data = req.body.sign.split(";base64,").pop();
  doc.moveDown().text("Signature:");
  doc.image(Buffer.from(base64Data, "base64"), { width: 150 });

  doc.end();

  res.status(201).json({
    status: "success",
    data: { member: newMember },
  });
});
