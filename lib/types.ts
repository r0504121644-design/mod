export type FamilyRole =
  | "מנהל משפחה"
  | "מטפל עיקרי"
  | "בן משפחה"
  | "משתמש מוגבל"
  | "מטפל מקצועי";

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  color: string;
  phone?: string;
  avatarInitial: string;
}

export interface FamilySpace {
  parentAlias: string;
  birthYear?: string;
  city?: string;
  members: FamilyMember[];
}

export type DayKey = "ראשון" | "שני" | "שלישי" | "רביעי" | "חמישי" | "שישי" | "שבת";
export type SlotKey = "בוקר" | "צהריים" | "ערב" | "לילה";

export interface Availability {
  memberId: string;
  slots: Partial<Record<DayKey, SlotKey[]>>;
  canDrive: boolean;
  canNightStay: boolean;
  canPharmacy: boolean;
}

export interface ShiftAssignment {
  day: DayKey;
  slot: SlotKey;
  memberId: string | null;
}

export interface ShiftExchangeRequest {
  id: string;
  day: DayKey;
  slot: SlotKey;
  fromMemberId: string;
  toMemberId: string | null;
  status: "ממתין" | "אושר" | "נדחה";
  note?: string;
}

export type DoseStatus = "נלקח" | "לא נלקח" | "נדחה";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  stock: number;
  lowStockThreshold: number;
  unit: string;
  prescriptionEndsInDays?: number;
}

export interface DoseRecord {
  id: string;
  medicationId: string;
  time: string;
  date: string;
  status: DoseStatus;
  reason?: string;
  markedBy?: string;
}

export type VitalType =
  | "לחץ דם"
  | "דופק"
  | "סוכר"
  | "סטורציה"
  | "חום"
  | "משקל"
  | "כאב"
  | "שינה";

export interface VitalRecord {
  id: string;
  type: VitalType;
  value: string;
  unit: string;
  date: string;
  time: string;
  outOfRange?: boolean;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  transportBy?: string;
  documentsChecklist: { id: string; label: string; checked: boolean }[];
}

export interface DischargeRecord {
  id: string;
  hospitalName: string;
  dischargeDate: string;
  newMedications: string[];
  discontinuedMedications: string[];
  followUpTests: string[];
  summaryText: string;
}

export type DocumentCategory = "סיכום שחרור" | "בדיקות מעבדה" | "מסמכים משפטיים" | "אחר";

export interface CareDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  date: string;
  uploadedBy: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  phone: string;
  notes?: string;
}

export interface UpdateFeedItem {
  id: string;
  authorId: string;
  text: string;
  chip?: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

export interface TaskItem {
  id: string;
  title: string;
  dueDate?: string;
  done: boolean;
}

export interface AgentMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: string;
}

export interface AgentPermissions {
  vitals: boolean;
  medications: boolean;
  appointments: boolean;
  documents: boolean;
  shifts: boolean;
}
