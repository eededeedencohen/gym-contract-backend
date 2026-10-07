// utils/phone.js
// נרמול מספרי טלפון ישראליים לפורמט אחיד: קידומת-מספר (למשל 050-1234567 או 03-1234567)

const normalizePhone = (input) => {
  if (input === null || input === undefined) return "";
  let digits = String(input).replace(/\D/g, "");
  if (!digits) return "";

  // קידומת בינלאומית 972 -> 0
  if (digits.startsWith("972")) digits = "0" + digits.slice(3);
  // מספר ללא 0 מוביל (למשל 501234567)
  else if (!digits.startsWith("0") && (digits.length === 9 || digits.length === 8)) {
    digits = "0" + digits;
  }

  // נייד / 07X: 3 ספרות קידומת + 7 ספרות
  if (digits.length === 10 && /^0[57]/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  // קווי: 2 ספרות קידומת + 7 ספרות
  if (digits.length === 9 && /^0[2-4,8-9]/.test(digits)) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  // צורה לא מזוהה - מחזירים ספרות בלבד (הולידציה תתפוס את זה)
  return digits;
};

const isValidPhone = (input) => {
  const digits = normalizePhone(input).replace(/\D/g, "");
  return /^0\d{8,9}$/.test(digits);
};

module.exports = { normalizePhone, isValidPhone };
