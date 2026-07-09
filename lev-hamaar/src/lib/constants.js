export const BRAND = {
  company: 'בינה מעברית™',
  app: 'לב המעבר™',
  tagline: 'בכל מצב שמשתנה יש מי שמלווה',
  credit: 'מ. רצקר — כל הזכויות שמורות',
};

export const ROLES = {
  FAMILY_ADMIN: 'מנהל משפחתי',
  PRIMARY_CAREGIVER: 'מטפל משפחתי עיקרי',
  MEDS_OWNER: 'אחראי תרופות',
  APPOINTMENTS_OWNER: 'אחראי תורים',
  FAMILY_MEMBER: 'בן משפחה',
  VIEWER: 'צפייה בלבד',
};

export const ROLE_KEYS = Object.keys(ROLES);

// permission matrix: which roles may edit which data domains
export const PERMISSIONS = {
  medications: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER', 'MEDS_OWNER'],
  appointments: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER', 'APPOINTMENTS_OWNER'],
  tasks: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER', 'MEDS_OWNER', 'APPOINTMENTS_OWNER', 'FAMILY_MEMBER'],
  shifts: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER', 'FAMILY_MEMBER'],
  documents: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER', 'MEDS_OWNER', 'APPOINTMENTS_OWNER'],
  measurements: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER', 'MEDS_OWNER', 'FAMILY_MEMBER'],
  visitReports: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER', 'FAMILY_MEMBER'],
  familyManage: ['FAMILY_ADMIN'],
  automations: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER'],
  auditLog: ['FAMILY_ADMIN'],
  adminMetrics: ['FAMILY_ADMIN'],
};

export function canEdit(domain, roleKeys = []) {
  const allowed = PERMISSIONS[domain] || [];
  return roleKeys.some((r) => allowed.includes(r));
}

export const LIVING_SITUATIONS = ['בבית', 'דיור מוגן', 'מסגרת טיפולית'];

export const MEASUREMENT_TYPES = [
  { key: 'bp_sys', label: 'לחץ דם סיסטולי', unit: 'mmHg' },
  { key: 'bp_dia', label: 'לחץ דם דיאסטולי', unit: 'mmHg' },
  { key: 'pulse', label: 'דופק', unit: 'פעימות/דק׳' },
  { key: 'sugar', label: 'סוכר בדם', unit: 'mg/dL' },
  { key: 'spo2', label: 'סטורציה', unit: '%' },
  { key: 'temp', label: 'חום', unit: '°C' },
  { key: 'weight', label: 'משקל', unit: 'ק״ג' },
  { key: 'pain', label: 'כאב (0-10)', unit: '' },
  { key: 'fluids', label: 'צריכת נוזלים', unit: 'מ״ל' },
  { key: 'custom', label: 'מדד מותאם אישית', unit: '' },
];

export const MED_LOG_STATUS = {
  TAKEN: 'נלקחה',
  MISSED: 'לא נלקחה',
  SKIPPED: 'נדחתה',
  UNKNOWN: 'לא ידוע',
  PENDING: 'טרם סומנה',
};

export const VERIFICATION_METHODS = [
  'נראה שנלקחה',
  'ההורה דיווח',
  'לפי קופסת התרופות',
  'לא ידוע בוודאות',
];

export const TASK_CATEGORIES = ['תרופות', 'רפואי', 'תור', 'בית', 'מסמכים', 'זכויות', 'כספים', 'תורנות', 'קניות', 'בטיחות', 'משפחה'];
export const TASK_STATUSES = ['חדש', 'בטיפול', 'ממתין', 'הושלם', 'דורש בירור', 'בוטל'];
export const TASK_URGENCY = ['רגיל', 'גבוה', 'דחוף'];
export const TASK_SOURCES = { MANUAL: 'ידני', AGENT: 'הצעת סוכן', AUTOMATION: 'אוטומציה' };

export const SHIFT_TYPES = ['ביקור', 'ליווי לרופא', 'לינה', 'רכישת תרופות', 'קניות', 'הכנת אוכל', 'שיחת טלפון', 'טיפול במסמכים', 'הסעה', 'מעקב טלפוני'];
export const SHIFT_STATUSES = ['פנויה', 'משובצת', 'אושרה', 'בוצעה', 'בוטלה'];

export const DOCUMENT_TYPES = ['סיכום אשפוז', 'רשימת תרופות', 'הפניה', 'תוצאות בדיקה', 'מכתב רופא', 'טופס זכויות', 'סיכום ביקור', 'מסמך ביטוח', 'קבלה', 'צילום מסמך'];

export const ALERT_LEVELS = {
  INFO: { key: 'INFO', label: 'לידיעה', icon: 'ℹ️', cls: 'badge-muted' },
  REMINDER: { key: 'REMINDER', label: 'תזכורת', icon: '⏰', cls: 'badge' },
  TODAY: { key: 'TODAY', label: 'חשוב היום', icon: '📌', cls: 'badge-warning' },
  CLARIFY: { key: 'CLARIFY', label: 'דורש בירור', icon: '❓', cls: 'badge-warning' },
  URGENT: { key: 'URGENT', label: 'דחוף', icon: '🔴', cls: 'badge-danger' },
};

export const CONSENT_STATUS = ['ניתנה', 'חלקית', 'בוטלה', 'לא ניתנה', 'דורשת בירור'];

export const AUTOMATION_DEFS = [
  {
    id: 'med-not-marked',
    name: 'תרופה שלא סומנה',
    description: 'אם תרופה לא סומנה עד הזמן שהוגדר: תזכורת לאחראי, המתנה, התראה נוספת, ואז הודעה לאיש קשר נוסף.',
    template: 'אם: תרופה לא סומנה עד השעה שהוגדרה → אז: שלח תזכורת לאחראי התרופות → אם עדיין לא סומנה לאחר שעה: שלח הודעה למטפל העיקרי.',
    enabledDefault: true,
    configurable: ['graceMinutes', 'recipients'],
  },
  {
    id: 'low-inventory',
    name: 'מלאי תרופה נמוך',
    description: 'כשהכמות יורדת מתחת לסף: התראה, הצעה ליצור משימת רכישה, בדיקת צורך במרשם, תזכורת לפני חידוש מרשם.',
    template: 'אם: מלאי תרופה מתחת לסף שהוגדר → אז: התראה לאחראי התרופות + הצעת משימת רכישה.',
    enabledDefault: true,
    configurable: ['thresholdOverride', 'recipients'],
  },
  {
    id: 'appointment-prep',
    name: 'תזכורת לתור והכנה',
    description: '3 ימים לפני: בדיקת מלווה ומסמכים. יום לפני: פרטי התור. בבוקר: תזכורת קצרה. אחרי: הצעה לתעד סיכום.',
    template: 'אם: מתקרב תור → אז: 3 ימים לפני בדוק מלווה ומסמכים; יום לפני שלח פרטים; בבוקר תזכורת; אחרי התור הצע לתעד.',
    enabledDefault: true,
    configurable: ['recipients'],
  },
  {
    id: 'unstaffed-shift',
    name: 'תורנות לא מאוישת',
    description: 'אם תורנות מתקרבת ואין משובץ — בקשת מתנדב. בביטול — הודעה למנהל והצעת זמינים.',
    template: 'אם: תורנות בעוד יומיים ואין משובץ → אז: שלח בקשת מתנדב לכלל המשפחה.',
    enabledDefault: true,
    configurable: ['leadDays', 'recipients'],
  },
  {
    id: 'weekly-summary',
    name: 'סיכום שבועי למשפחה',
    description: 'כולל תרופות, מדידות, ביקורים, משימות, תורים, שינויים ותורנויות לשבוע הבא. נשלח לפי מועד שנבחר.',
    template: 'אם: הגיע מועד הסיכום השבועי שנבחר → אז: הפק וסמן סיכום שבועי לכלל המשפחה.',
    enabledDefault: true,
    configurable: ['sendDay', 'recipients'],
  },
];

export const AUTOMATIONS_COMING_SOON = [
  'זיהוי מגמת מדדים חריגה',
  'זיהוי עומס משפחתי לא מאוזן',
  'זיהוי סתירות בין רשימות תרופות',
];

export const EMERGENCY_KEYWORDS = [
  'כאב חזה', 'קושי בנשימה', 'לא נושם', 'חוסר תגובה', 'לא מגיב', 'חולשה פתאומית',
  'קושי בדיבור', 'מדבר מוזר', 'בלבול פתאומי', 'נפילה עם פגיעה', 'דימום', 'מינון יתר',
  'לקח יותר מדי', 'איבד הכרה', 'ירידה בהכרה', 'לא עונה',
];

export const EMERGENCY_MESSAGE = 'התיאור עשוי להתאים למצב הדורש עזרה רפואית דחופה. בישראל יש לפנות למד״א בטלפון 101. אין להסתמך על האפליקציה במצב חירום.';

export const ISRAELI_CITIES = [
  { name: 'ירושלים', lat: 31.7683, lon: 35.2137, candleOffset: 40 },
  { name: 'תל אביב', lat: 32.0853, lon: 34.7818, candleOffset: 18 },
  { name: 'חיפה', lat: 32.7940, lon: 34.9896, candleOffset: 20 },
  { name: 'באר שבע', lat: 31.2530, lon: 34.7915, candleOffset: 18 },
  { name: 'נתניה', lat: 32.3215, lon: 34.8532, candleOffset: 18 },
  { name: 'אשדוד', lat: 31.8044, lon: 34.6553, candleOffset: 18 },
  { name: 'ראשון לציון', lat: 31.9730, lon: 34.7925, candleOffset: 18 },
  { name: 'פתח תקווה', lat: 32.0917, lon: 34.8850, candleOffset: 18 },
];

export const PILOT_TARGETS = {
  medOnTimeRate: 0.8,
  visitReport24h: 0.7,
  weeklyActiveMembers: 3,
  shiftsStaffedAdvance: 0.9,
};
