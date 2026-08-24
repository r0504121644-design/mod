// Privacy-by-design guard: blocks any 9-digit run (Israeli Teudat Zehut / ID numbers)
// from being stored anywhere in the app, across all free-text inputs.

const NINE_DIGIT_PATTERN = /\d{9,}/;

export function containsIdNumber(value: string): boolean {
  const digitsOnly = value.replace(/[\s-]/g, "");
  return NINE_DIGIT_PATTERN.test(digitsOnly) || NINE_DIGIT_PATTERN.test(value);
}

export function sanitizeGuardMessage(): string {
  return "לא ניתן לשמור מספרים בני 9 ספרות ומעלה (כגון ת.ז). אנא הסירו את המספר והשתמשו בכינוי בלבד.";
}

export const DOCUMENT_UPLOAD_WARNING =
  "מומלץ לטשטש מספרי זהות ופרטים שאינם נחוצים לפני העלאת מסמך.";

export const ALIAS_ONLY_HINT =
  "נא להשתמש בשם פרטי או כינוי בלבד (למשל: \"אמא\", \"דנה\") — ללא שם משפחה או מספר זהות.";
