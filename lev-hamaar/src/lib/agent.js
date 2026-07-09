import { byFamily, byParent, sortByDateDesc } from './store';
import { detectEmergency } from './safety';
import { dateStr } from './automations';

export const SUGGESTED_QUESTIONS = [
  'מה חשוב לעשות היום?',
  'אילו תרופות עדיין לא סומנו?',
  'מה השתנה השבוע?',
  'מי מגיע היום?',
  'אילו משימות באיחור?',
  'מה להכין לרופא?',
  'האם חסר מידע?',
  'מה כדאי לשלוח למשפחה?',
  'מי יכול לקחת את התורנות?',
];

const SRC = {
  DATA: { type: 'DATA', label: 'נתון מתועד באפליקציה' },
  SUGGESTION: { type: 'SUGGESTION', label: 'הצעה לפעולה' },
};

function withinDays(dateVal, days) {
  const d = new Date(dateVal);
  const now = new Date();
  const diff = (now - d) / 86400000;
  return diff >= 0 && diff <= days;
}

function todayMeds(entities, familyId, parentId) {
  const ds = dateStr(new Date());
  return Object.values(entities.medicationLogs).filter(
    (l) => l.familyId === familyId && (!parentId || l.parentId === parentId) && l.date === ds
  );
}

function medsHandler(entities, familyId, parentId) {
  const logs = todayMeds(entities, familyId, parentId).filter((l) => l.status === 'טרם סומנה');
  const meds = byFamily(entities, 'medications', familyId);
  if (!logs.length) {
    return { text: 'כל התרופות המתוכננות להיום כבר סומנו. ✅', sources: [SRC.DATA] };
  }
  const names = logs.map((l) => {
    const med = meds.find((m) => m.id === l.medicationId);
    return `${med?.name || 'תרופה'} בשעה ${l.scheduledTime}`;
  });
  return { text: `עדיין לא סומנו: ${names.join(', ')}.`, sources: [SRC.DATA] };
}

function overdueTasksHandler(entities, familyId, parentId) {
  const ds = dateStr(new Date());
  const tasks = byFamily(entities, 'tasks', familyId).filter(
    (t) => (!parentId || t.parentId === parentId) && t.dueDate && t.dueDate < ds && !['הושלם', 'בוטל'].includes(t.status)
  );
  if (!tasks.length) return { text: 'אין משימות באיחור כרגע. 🙂', sources: [SRC.DATA] };
  return { text: `משימות באיחור: ${tasks.map((t) => t.title).join(', ')}.`, sources: [SRC.DATA] };
}

function todayShiftHandler(entities, familyId, parentId) {
  const ds = dateStr(new Date());
  const shifts = byFamily(entities, 'shifts', familyId).filter((s) => (!parentId || s.parentId === parentId) && s.date === ds);
  if (!shifts.length) return { text: 'לא נמצאה תורנות רשומה להיום.', sources: [SRC.DATA] };
  const users = entities.users;
  const parts = shifts.map((s) => `${s.type}${s.assigneeUserId ? ` — ${users[s.assigneeUserId]?.displayName || 'משובץ'}` : ' (טרם שובץ)'}`);
  return { text: `היום: ${parts.join(', ')}.`, sources: [SRC.DATA] };
}

function unstaffedShiftHandler(entities, familyId, parentId) {
  const shifts = byFamily(entities, 'shifts', familyId).filter((s) => (!parentId || s.parentId === parentId) && s.status === 'פנויה');
  if (!shifts.length) return { text: 'כרגע כל התורנויות הקרובות מאוישות.', sources: [SRC.DATA] };
  const parts = shifts.map((s) => `${s.type} בתאריך ${s.date}`);
  return { text: `תורנויות פנויות: ${parts.join(', ')}. אפשר להתנדב דרך מסך התורנויות.`, sources: [SRC.DATA, SRC.SUGGESTION] };
}

function nextAppointmentHandler(entities, familyId, parentId) {
  const ds = dateStr(new Date());
  const appts = byFamily(entities, 'appointments', familyId)
    .filter((a) => (!parentId || a.parentId === parentId) && a.date >= ds)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!appts.length) return { text: 'אין תור קרוב רשום במערכת.', sources: [SRC.DATA] };
  const a = appts[0];
  const qs = (a.questions || []).length ? ` שאלות שהוכנו: ${a.questions.join('; ')}.` : ' טרם הוכנו שאלות — אפשר להוסיף במסך התורים.';
  return { text: `התור הקרוב: ${a.type || 'רופא'} בתאריך ${a.date} ${a.time || ''} ב${a.clinic || ''}.${qs}`, sources: [SRC.DATA, SRC.SUGGESTION] };
}

function whatsMissingHandler(entities, familyId, parentId) {
  const gaps = [];
  const consent = byFamily(entities, 'consents', familyId).find((c) => !parentId || c.parentId === parentId);
  if (!consent || consent.status === 'דורשת בירור' || consent.status === 'לא ניתנה') {
    gaps.push('סטטוס ההסכמה וההרשאה של ההורה טרם הוסדר');
  }
  const meds = byParent(entities, 'medications', parentId).filter((m) => m.status !== 'הופסקה');
  meds.forEach((m) => {
    if (!m.doctor) gaps.push(`לתרופה "${m.name}" לא צוין רופא מטפל`);
    if (m.needsPrescription && !m.renewalDate) gaps.push(`לתרופה "${m.name}" לא צוין תאריך חידוש מרשם`);
  });
  if (!gaps.length) return { text: 'לא זיהיתי פערי מידע בולטים כרגע.', sources: [SRC.DATA] };
  return { text: `מידע שכדאי להשלים: ${gaps.slice(0, 5).join('; ')}.`, sources: [SRC.DATA] };
}

function whatChangedHandler(entities, familyId, parentId) {
  const changes = [];
  const collect = (key, label, textFn) => {
    byFamily(entities, key, familyId)
      .filter((r) => (!parentId || r.parentId === parentId) && withinDays(r.createdAt, 7))
      .forEach((r) => changes.push(textFn(r)));
  };
  collect('tasks', 'משימה', (t) => `נפתחה משימה: ${t.title}`);
  collect('documents', 'מסמך', (d) => `הועלה מסמך: ${d.type}`);
  collect('visitReports', 'ביקור', () => 'תועד ביקור חדש');
  collect('appointments', 'תור', (a) => `נוסף תור ל${a.type || 'רופא'} בתאריך ${a.date}`);
  if (!changes.length) return { text: 'לא נרשמו שינויים משמעותיים בשבוע האחרון.', sources: [SRC.DATA] };
  return { text: `בשבוע האחרון: ${changes.slice(0, 6).join('; ')}.`, sources: [SRC.DATA] };
}

function whatToSendHandler() {
  return {
    text: 'כדאי לשקול לשלוח למשפחה את הסיכום השבועי, או עדכון קצר על תרופות שלא סומנו ותורנויות פנויות — ניתן להפיק מסך "דוחות" ומסך "התראות".',
    sources: [SRC.SUGGESTION],
  };
}

function todayImportantHandler(entities, familyId, parentId) {
  const parts = [];
  const meds = medsHandler(entities, familyId, parentId);
  if (!meds.text.startsWith('כל')) parts.push(meds.text);
  const ds = dateStr(new Date());
  const appts = byFamily(entities, 'appointments', familyId).filter((a) => (!parentId || a.parentId === parentId) && a.date === ds);
  if (appts.length) parts.push(`היום יש תור בשעה ${appts[0].time || ''}.`);
  const shifts = todayShiftHandler(entities, familyId, parentId);
  if (!shifts.text.includes('לא נמצאה')) parts.push(shifts.text);
  const overdue = overdueTasksHandler(entities, familyId, parentId);
  if (!overdue.text.startsWith('אין')) parts.push(overdue.text);
  if (!parts.length) return { text: 'היום נראה רגוע — אין דברים דחופים שזיהיתי.', sources: [SRC.DATA] };
  return { text: parts.join(' '), sources: [SRC.DATA] };
}

const INTENTS = [
  { test: (m) => /חשוב היום|היום.*עשות|מה עושים היום/.test(m), run: todayImportantHandler },
  { test: (m) => /תרופ.*סומנ|תרופ.*היום/.test(m), run: medsHandler },
  { test: (m) => /השתנה השבוע|שבוע האחרון|מה חדש/.test(m), run: whatChangedHandler },
  { test: (m) => /מי מגיע היום|תורנ.*היום/.test(m), run: todayShiftHandler },
  { test: (m) => /משימ.*איחור|באיחור/.test(m), run: overdueTasksHandler },
  { test: (m) => /להכין לרופא|תור.*הכנה|לקראת התור/.test(m), run: nextAppointmentHandler },
  { test: (m) => /חסר מידע|מה חסר/.test(m), run: whatsMissingHandler },
  { test: (m) => /לשלוח למשפחה|לעדכן את המשפחה/.test(m), run: whatToSendHandler },
  { test: (m) => /לקחת את התורנות|תורנות פנויה|מי פנוי/.test(m), run: unstaffedShiftHandler },
];

// מנוע סוכן מבוסס-כללים הפועל אך ורק על נתונים מקומיים שהמשתמש מורשה לצפות בהם. אינו קורא לשירות חיצוני ואינו ממציא מידע.
export function askAgent(message, ctx) {
  const { entities, familyId, parentId } = ctx;
  if (detectEmergency(message)) {
    return { emergency: true };
  }
  const normalized = (message || '').trim();
  const intent = INTENTS.find((i) => i.test(normalized));
  if (!intent) {
    return {
      text: 'לא מצאתי באפליקציה מידע עדכני בנושא הזה. אפשר לנסח את השאלה אחרת, או לבחור אחת מהשאלות המוצעות.',
      sources: [],
    };
  }
  const result = intent.run(entities, familyId, parentId);
  return result;
}
