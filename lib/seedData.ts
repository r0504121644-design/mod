import type {
  FamilySpace,
  Availability,
  ShiftAssignment,
  ShiftExchangeRequest,
  Medication,
  DoseRecord,
  VitalRecord,
  Appointment,
  DischargeRecord,
  CareDocument,
  Professional,
  UpdateFeedItem,
  Alert,
  TaskItem,
} from "./types";
import { isoDaysFromNow, todayIso } from "./format";

export const SEED_MEMBERS: FamilySpace["members"] = [
  { id: "dana", name: "דנה", role: "מנהל משפחה", color: "#1E3A8A", avatarInitial: "ד", phone: "050-1234567" },
  { id: "yossi", name: "יוסי", role: "בן משפחה", color: "#0D9488", avatarInitial: "י", phone: "052-2345678" },
  { id: "rachel", name: "רחל", role: "מטפל עיקרי", color: "#D97706", avatarInitial: "ר", phone: "054-3456789" },
  { id: "avi", name: "אבי", role: "בן משפחה", color: "#7C3AED", avatarInitial: "א", phone: "053-4567890" },
  { id: "tamar", name: "תמר", role: "בן משפחה", color: "#DB2777", avatarInitial: "ת", phone: "058-5678901" },
];

export const SEED_FAMILY_SPACE: FamilySpace = {
  parentAlias: "אמא",
  birthYear: "1943",
  city: "רמת גן",
  members: SEED_MEMBERS,
};

export const SEED_TASKS: TaskItem[] = [
  { id: "t1", title: "חידוש מרשם לתרופת לחץ דם", dueDate: isoDaysFromNow(5), done: false },
  { id: "t2", title: "איסוף תרופות מבית המרקחת", dueDate: isoDaysFromNow(1), done: false },
  { id: "t3", title: "תיאום הסעה לתור הקרדיולוג", dueDate: isoDaysFromNow(2), done: false },
];

export const SEED_AVAILABILITY: Availability[] = [
  { memberId: "dana", slots: { ראשון: ["בוקר"], שלישי: ["בוקר", "צהריים"] }, canDrive: true, canNightStay: false, canPharmacy: true },
  { memberId: "yossi", slots: { שני: ["צהריים"], רביעי: ["בוקר"] }, canDrive: true, canNightStay: false, canPharmacy: false },
  { memberId: "rachel", slots: { ראשון: ["ערב"], שני: ["בוקר", "ערב"], רביעי: ["צהריים", "ערב"] }, canDrive: false, canNightStay: true, canPharmacy: true },
  { memberId: "avi", slots: { שלישי: ["ערב"], חמישי: ["בוקר"] }, canDrive: true, canNightStay: false, canPharmacy: true },
  { memberId: "tamar", slots: { שישי: ["ערב"], שבת: ["ערב"], חמישי: ["ערב"] }, canDrive: false, canNightStay: true, canPharmacy: false },
];

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"] as const;
const SLOTS = ["בוקר", "צהריים", "ערב", "לילה"] as const;

export const SEED_SHIFTS: ShiftAssignment[] = (() => {
  const assignments: ShiftAssignment[] = [];
  const pattern: Record<string, string | null> = {
    "ראשון-בוקר": "dana",
    "ראשון-ערב": "rachel",
    "שני-בוקר": "rachel",
    "שני-צהריים": "yossi",
    "שלישי-בוקר": "dana",
    "שלישי-ערב": "avi",
    "רביעי-בוקר": "yossi",
    "רביעי-ערב": "rachel",
    "חמישי-בוקר": "avi",
    "חמישי-ערב": "tamar",
    "שישי-ערב": "tamar",
    "שבת-ערב": "tamar",
  };
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      assignments.push({ day, slot, memberId: pattern[`${day}-${slot}`] ?? null });
    }
  }
  return assignments;
})();

export const SEED_EXCHANGE_REQUESTS: ShiftExchangeRequest[] = [
  {
    id: "ex1",
    day: "רביעי",
    slot: "ערב",
    fromMemberId: "rachel",
    toMemberId: "avi",
    status: "ממתין",
    note: "יש לי אירוע משפחתי, אפשר להחליף?",
  },
];

export const SEED_MEDICATIONS: Medication[] = [
  { id: "m1", name: "קונקור (לחץ דם)", dosage: "5 מ״ג", times: ["08:00", "20:00"], stock: 6, lowStockThreshold: 8, unit: "כדורים", prescriptionEndsInDays: 5 },
  { id: "m2", name: "אקמול", dosage: "500 מ״ג", times: ["08:00", "14:00", "20:00"], stock: 22, lowStockThreshold: 10, unit: "כדורים" },
  { id: "m3", name: "אספירין", dosage: "100 מ״ג", times: ["08:00"], stock: 14, lowStockThreshold: 10, unit: "כדורים" },
  { id: "m4", name: "ויטמין D", dosage: "1000 יב״ל", times: ["08:00"], stock: 30, lowStockThreshold: 10, unit: "כדורים" },
];

export const SEED_DOSES: DoseRecord[] = [
  { id: "d1", medicationId: "m1", time: "08:00", date: todayIso(), status: "נלקח", markedBy: "רחל" },
  { id: "d2", medicationId: "m2", time: "08:00", date: todayIso(), status: "נלקח", markedBy: "רחל" },
  { id: "d3", medicationId: "m3", time: "08:00", date: todayIso(), status: "נלקח", markedBy: "רחל" },
  { id: "d4", medicationId: "m4", time: "08:00", date: todayIso(), status: "נלקח", markedBy: "רחל" },
  { id: "d5", medicationId: "m1", time: "20:00", date: todayIso(), status: "לא נלקח" },
  { id: "d6", medicationId: "m2", time: "14:00", date: todayIso(), status: "לא נלקח" },
  { id: "d7", medicationId: "m2", time: "20:00", date: todayIso(), status: "לא נלקח" },
];

export const SEED_VITALS: VitalRecord[] = [
  { id: "v1", type: "לחץ דם", value: "138/82", unit: "", date: todayIso(), time: "07:45" },
  { id: "v2", type: "סטורציה", value: "96", unit: "%", date: todayIso(), time: "07:45" },
  { id: "v3", type: "דופק", value: "78", unit: "פעימות/דקה", date: todayIso(), time: "07:45" },
  { id: "v4", type: "לחץ דם", value: "142/88", unit: "", date: isoDaysFromNow(-1), time: "08:10" },
  { id: "v5", type: "סוכר", value: "104", unit: "מ״ג/ד״ל", date: isoDaysFromNow(-1), time: "07:30" },
  { id: "v6", type: "לחץ דם", value: "135/80", unit: "", date: isoDaysFromNow(-2), time: "08:00" },
  { id: "v7", type: "משקל", value: "68", unit: "ק״ג", date: isoDaysFromNow(-3), time: "09:00" },
  { id: "v8", type: "לחץ דם", value: "140/85", unit: "", date: isoDaysFromNow(-4), time: "08:05" },
];

export const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    doctorName: "ד״ר כהן",
    specialty: "קרדיולוגיה",
    date: isoDaysFromNow(3),
    time: "10:30",
    location: "מרפאת קופת חולים, רמת גן",
    transportBy: "יוסי",
    documentsChecklist: [
      { id: "c1", label: "תוצאות בדיקת דם אחרונה", checked: true },
      { id: "c2", label: "רשימת תרופות נוכחית", checked: false },
      { id: "c3", label: "סיכום אשפוז קודם", checked: false },
    ],
  },
  {
    id: "a2",
    doctorName: "ד״ר לוינסון",
    specialty: "רופאת משפחה",
    date: isoDaysFromNow(10),
    time: "12:00",
    location: "מרפאה ראשית",
    documentsChecklist: [{ id: "c4", label: "מדדי לחץ דם שבועיים", checked: false }],
  },
];

export const SEED_DISCHARGES: DischargeRecord[] = [
  {
    id: "h1",
    hospitalName: "בית חולים שיבא",
    dischargeDate: isoDaysFromNow(-20),
    newMedications: ["קונקור 5 מ״ג", "אספירין 100 מ״ג"],
    discontinuedMedications: ["נורמיטן"],
    followUpTests: ["בדיקת דם כללית בעוד חודש", "מעקב קרדיולוגי"],
    summaryText:
      "אושפזה עקב חוסר איזון בלחץ הדם. טופלה והותאם טיפול תרופתי חדש. מומלץ מעקב קרדיולוגי צמוד ובדיקות דם תקופתיות.",
  },
];

export const SEED_DOCUMENTS: CareDocument[] = [
  { id: "doc1", name: "סיכום שחרור - שיבא", category: "סיכום שחרור", date: isoDaysFromNow(-20), uploadedBy: "דנה" },
  { id: "doc2", name: "בדיקת דם כללית", category: "בדיקות מעבדה", date: isoDaysFromNow(-5), uploadedBy: "רחל" },
  { id: "doc3", name: "ייפוי כוח מתמשך", category: "מסמכים משפטיים", date: isoDaysFromNow(-90), uploadedBy: "דנה" },
];

export const SEED_PROFESSIONALS: Professional[] = [
  { id: "p1", name: "ד״ר כהן", role: "קרדיולוג", phone: "03-1234567" },
  { id: "p2", name: "ד״ר לוינסון", role: "רופאת משפחה", phone: "03-2345678" },
  { id: "p3", name: "מיכל", role: "פיזיותרפיסטית", phone: "050-9876543" },
];

export const SEED_UPDATES: UpdateFeedItem[] = [
  { id: "u1", authorId: "rachel", text: "", chip: "התרופה נלקחה", timestamp: new Date().toISOString() },
  { id: "u2", authorId: "tamar", text: "", chip: "הגעתי לביקור", timestamp: new Date(Date.now() - 3600_000).toISOString() },
];

export const SEED_ALERTS: Alert[] = [
  { id: "al1", title: "המרשם לקונקור מסתיים בעוד 5 ימים", severity: "warning", timestamp: new Date().toISOString() },
  { id: "al2", title: "מלאי האקמול נמוך", severity: "info", timestamp: new Date().toISOString() },
];

export const TONIGHT_SHIFT_MEMBER_ID = "tamar";
