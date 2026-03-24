import { useState, useEffect } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

const COMPETENCIES = [
  {
    id: "self_awareness", name: "מודעות עצמית", icon: "🔍", color: "#4A90D9", shortName: "מודעות",
    questions: [
      "אני יודע לזהות את הערכים המרכזיים שמנחים את החלטותיי",
      "אני מכיר את נקודות החוזק שלי ויודע לנצל אותן",
      "אני מודע לנקודות התורפה שלי ועובד עליהן",
      "אני מבין מה מפעיל אותי רגשית בסיטואציות לחץ",
      "יש לי בהירות לגבי זהותי המקצועית – מה אני מביא לעולם",
      "אני מסוגל לקבל פידבק ביקורתי מבלי להתגונן"
    ],
    exercises: [
      { title: "מפת ערכים אישית", duration: "30 דקות", desc: "רשום 20 ערכים שחשובים לך. דרג אותם. בחר את 5 העליונים. לכל אחד כתוב: מתי חייתי אותו? מתי הפרתי אותו? מה אני עושה כדי לחיות אותו יותר?" },
      { title: "יומן חוזקות – 7 ימים", duration: "10 דקות/יום", desc: "כל ערב כתוב: מה עשיתי היום שבא לי טבעי? מה הצלחתי בו? איזו חוזקה הפעלתי? בסוף השבוע – זהה דפוסים." },
      { title: "ראיון עם עצמי", duration: "45 דקות", desc: "שאל את עצמך: מה 3 האנשים הקרובים אליי יגידו שהם הכי מעריכים בי? מה אני עושה כשאני בשיאי? מה גורם לי לאבד את עצמי?" }
    ]
  },
  {
    id: "cognitive_flexibility", name: "גמישות קוגניטיבית", icon: "🧠", color: "#9B59B6", shortName: "גמישות",
    questions: [
      "כשאני נתקל בבעיה, אני מחפש לפחות 3 פתרונות שונים לפני שאבחר",
      "אני מסוגל לשנות דעתי לאור עדויות חדשות גם אם זה לא נוח",
      "אני רואה סיטואציות מנקודות מבט שונות לפני שאני מגיב",
      "אי-ודאות לא מקפיאה אותי – אני פועל גם בלי תמונה מלאה",
      "אני מסוגל לחשוב במערכות – לראות כיצד חלקים שונים מחוברים",
      "אני מאתגר הנחות יסוד שלי לפחות פעם בחודש"
    ],
    exercises: [
      { title: "6 כובעים לבעיה שלך", duration: "40 דקות", desc: "קח אתגר שאתה מתמודד איתו. נתח אותו מ-6 זוויות: עובדות | רגשות | יתרונות | חסרונות | יצירתיות | מבט מלמעלה. כתוב 2-3 נקודות לכל כובע." },
      { title: "הנחת היסוד ההפוכה", duration: "20 דקות", desc: "בחר אמונה מקצועית חזקה שלך. כתוב: מה ההנחה ההפוכה? מה יהיה נכון בה? איך היה נראה עולם שבו ההפך הוא הנכון?" },
      { title: "מפת קשרים מערכתית", duration: "35 דקות", desc: "קח נושא/אתגר ממקצועך. ציר עליו מפה: מי מושפע? מה גורם למה? אילו כוחות פועלים? מה הדפוסים החוזרים?" }
    ]
  },
  {
    id: "resilience", name: "חוסן פסיכולוגי", icon: "💪", color: "#E74C3C", shortName: "חוסן",
    questions: [
      "לאחר כישלון, אני מצליח לקום ולנסות שוב תוך זמן סביר",
      "אני מסוגל לנהל את הרגשות שלי בזמן לחץ גבוה",
      "אני רואה בטעויות שלי הזדמנות ללמידה ולא ראיה לכישלון",
      "אני מפריד בין ביצועים לזהות – כישלון בפרויקט לא מגדיר אותי",
      "אני מוצא משמעות גם בתקופות קשות",
      "יש לי כלים מעשיים שאני מפעיל כשאני מרגיש שאני נשבר"
    ],
    exercises: [
      { title: "ניתוח כישלון ב-3 שלבים", duration: "30 דקות", desc: "בחר כישלון שעדיין תקוע בך. שלב 1: מה בדיוק קרה (עובדות בלבד)? שלב 2: מה למדתי? שלב 3: מה אני מכיר טובה לעצמי?" },
      { title: "ארגז כלים לרגעי משבר", duration: "25 דקות", desc: "בנה רשימה: 3 דברים שמרגיעים אותי מיד, 3 משפטים שאני אומר לעצמי בקושי, 3 אנשים שאני יכול להתקשר אליהם, 3 פעולות שמחזירות אותי לעצמי." },
      { title: "מכתב חוסן עתידי", duration: "20 דקות", desc: "כתוב מכתב מעצמך בעוד שנה לעצמך של היום: איזה קשיים עברת? מה גיליתי שיש בי? מה הפך אותי לחזק יותר?" }
    ]
  },
  {
    id: "communication", name: "תקשורת אפקטיבית", icon: "💬", color: "#27AE60", shortName: "תקשורת",
    questions: [
      "כשמישהו מדבר אליי, אני מקשיב לגמרי ולא מתכנן תגובה בראש",
      "אני מסוגל להביע את עמדתי בצלול ובתמציתיות",
      "אני מתאים את סגנון התקשורת לקהל שמולי",
      "אני מסוגל לנהל שיחת קונפליקט מבלי להרוס את הקשר",
      "אני נותן פידבק בונה שמישהו יכול לעשות איתו משהו",
      "אני יכול לקבל ביקורת מבלי להתגונן מיד"
    ],
    exercises: [
      { title: "תרגיל הקשבה עמוקה", duration: "20 דקות", desc: "בשיחה הבאה: אסור לך לדבר על עצמך. רק שאל שאלות ושקף. אחרי השיחה כתוב: מה הבנתי שלא ידעתי? איפה רציתי להיכנס ולא נכנסתי?" },
      { title: "Elevator Pitch ב-3 גרסאות", duration: "30 דקות", desc: "כתוב תשובה ל'ספר על עצמך' בגרסאות: 30 שניות, 2 דקות, 5 דקות. לכל אחת: מי אתה, מה מיוחד בך, מה אתה מציע. תרגל בקול רם." },
      { title: "פידבק בשיטת SBI", duration: "25 דקות", desc: "S=Situation, B=Behavior, I=Impact. בחר 3 סיטואציות מהחיים שלך ונסח פידבק לכל אחת. ודא שהפידבק מדויק, ספציפי ולא שיפוטי." }
    ]
  },
  {
    id: "self_learning", name: "למידה עצמית מתמשכת", icon: "📚", color: "#F39C12", shortName: "למידה",
    questions: [
      "אני לומד משהו חדש משמעותי לפחות פעם בשבוע",
      "יש לי מערכת אישית לארגון הידע שאני רוכש",
      "אני שואל שאלות שעדיין אין לי תשובה עליהן",
      "אני מסוגל למצוא ידע מהימן באופן עצמאי",
      "אני חוזר על חוויות ומפיק מהן לקחים מובנים",
      "אני מעדכן את הכישורים שלי באופן יזום ולא רק כשנדרש"
    ],
    exercises: [
      { title: "מפת ידע אישית", duration: "45 דקות", desc: "שרטט עיגולים: מה אני יודע טוב מאוד? מה אני יודע בינוני? מה אני לא יודע ויודע שאני לא? מה אני לא יודע שאני לא יודע? מה אני לומד עכשיו?" },
      { title: "מפת למידה שנתית", duration: "40 דקות", desc: "בחר 3 כישורים לשנה. לכל כישור: מה רמת הבסיס שלי? מה המטרה? אילו משאבים? מה יהיה הסימן שהגעתי? מה המחסומים הצפויים?" },
      { title: "שיטת Feynman", duration: "30 דקות", desc: "בחר מושג שלמדת לאחרונה. הסבר אותו כאילו אתה מסביר לילד בן 10. איפה נתקעת? זה מה שעדיין לא הבנת לגמרי. חזור ולמד שוב רק את הנקודות האלו." }
    ]
  },
  {
    id: "entrepreneurial", name: "חשיבה יזמית", icon: "🚀", color: "#E67E22", shortName: "יזמות",
    questions: [
      "אני מזהה הזדמנויות שאחרים לא רואים",
      "אני מסוגל לפעול גם כשלא כל המידע בידי",
      "יש לי הצעת ערך ברורה – אני יודע מה מיוחד בי",
      "אני לא נשבר מדחייה ומוצא דרכים חלופיות",
      "אני מתחיל קטן, לומד ומגדיל – לא מחכה לתנאים מושלמים",
      "אני רואה בעיות כהזדמנויות ולא רק כמכשולים"
    ],
    exercises: [
      { title: "אתגר 30 לא", duration: "30 ימים", desc: "כל יום – בקש משהו שאתה חושב שיגידו לך לא. המטרה: להתרגל לדחייה. רשום: ביקשתי / קיבלתי / מה למדתי." },
      { title: "כרטיס ערך ייחודי (USP)", duration: "35 דקות", desc: "ענה: מה אני עושה שאחרים לא? מי הלקוח האידיאלי שלי? מה הבעיה שאני פותר טוב מכולם? איזו תוצאה אני מייצר? נסח משפט USP אחד." },
      { title: "MVP אישי – 7 ימים", duration: "שבוע", desc: "בחר רעיון שדחיית אותו. הגדר: מה הגרסה הכי קטנה שאפשר לבדוק? השקע שעה ביום למשך 7 ימים. בסוף: מה למדת? מה הוכחת?" }
    ]
  },
  {
    id: "eq", name: "בינה רגשית", icon: "❤️", color: "#EC407A", shortName: "EQ",
    questions: [
      "אני מזהה את רגשות האחרים גם כשהם לא אומרים זאת מפורשות",
      "אני בונה קשרים אמיתיים שנשמרים לאורך זמן",
      "המוטיבציה שלי מגיעה מתוכי ולא רק מתגמולים חיצוניים",
      "אני שולט בתגובותיי הרגשיות גם בסיטואציות מעצבנות",
      "אני קורא נכון את הדינמיקה הקבוצתית בחדר",
      "יש לי אמפתיה אמיתית – אני מסוגל להיכנס לנעליים של האחר"
    ],
    exercises: [
      { title: "יומן רגשי שבועי", duration: "10 דקות/יום", desc: "כל ערב: רשום 3 רגשות שחווית היום. לכל רגש: מה עורר אותו? מה עשיתי איתו? מה הייתי רוצה לעשות אחרת? בסוף שבוע – מה הדפוסים?" },
      { title: "עמידה בנעלי האחר", duration: "30 דקות", desc: "בחר קונפליקט שיש לך עם מישהו. כתוב מנקודת המבט שלו: מה הוא מרגיש? מה הוא צריך? מה הפחד שמאחורי העמדה שלו? מה שיכנע אותו?" },
      { title: "מפת מוטיבציה אישית", duration: "40 דקות", desc: "רשום: מה גורם לי לקום בהתלהבות? מה מרוקן אותי? מה גורם לי לתחושת זרימה? מה ה'למה' הגדול שלי? כיצד הסביבה הנוכחית תומכת/פוגעת בי?" }
    ]
  },
  {
    id: "self_management", name: "ניהול עצמי ואחריות", icon: "⚙️", color: "#607D8B", shortName: "ניהול עצמי",
    questions: [
      "אני מתעדף משימות לפי חשיבות ולא רק לפי דחיפות",
      "אני עומד בהתחייבויות שנתתי לאחרים ולעצמי",
      "אני יודע לומר 'לא' כשמשהו לא מתאים לסדרי העדיפויות שלי",
      "יש לי שגרות יומיות שתומכות במטרות שלי",
      "אני מתפקד ביעילות גם בתנאי לחץ ועומס",
      "אני לוקח אחריות מלאה על תוצאות גם כשלא הכל תלוי בי"
    ],
    exercises: [
      { title: "מטריצת אייזנהאואר – שבוע ניסוי", duration: "שבוע", desc: "כל בוקר מיין משימות: חשוב+דחוף / חשוב+לא דחוף / לא חשוב+דחוף / לא חשוב+לא דחוף. בסוף שבוע: כמה זמן בילית בכל ריבוע?" },
      { title: "עיצוב שגרת בוקר תומכת", duration: "21 ימים", desc: "בחר 3-5 פעולות שתעשה כל בוקר. הגדר מתי ואיך. תרגל 21 יום. שנה רק דבר אחד בכל פעם. בסוף – מה ההשפעה על הפרודוקטיביות?" },
      { title: "אחריות אישית ל-3 החלטות", duration: "45 דקות", desc: "בחר 3 תוצאות שאתה לא מרוצה מהן. לכל אחת: מה תרמתי לתוצאה? מה היה בשליטתי? מה יכולתי לעשות אחרת? כתוב התחייבות ספציפית." }
    ]
  },
  {
    id: "networking", name: "רשת קשרים", icon: "🤝", color: "#00ACC1", shortName: "נטוורקינג",
    questions: [
      "יש לי קשרים מקצועיים אמיתיים שנותנים ומקבלים ערך הדדי",
      "אני נוכח ומוכר בקהילות מקצועיות רלוונטיות",
      "יש לי מנטור שמלווה אותי ואני מלווה אחרים",
      "אני יודע עם מי להתחבר וכיצד ליצור שיתוף פעולה",
      "מה שאומרים עליי כשאני עוזב את החדר – תואם את מה שאני רוצה",
      "אני מטפח קשרים גם כשאיני צריך משהו ספציפי"
    ],
    exercises: [
      { title: "מיפוי רשת הקשרים הנוכחית", duration: "40 דקות", desc: "ציר מעגלים: מרכז=אתה. מעגל 1: קשרים חזקים. מעגל 2: קשרים בינוניים. מעגל 3: היכרויות. מי חסר? מי מרחיב אותי? מי מרוקן?" },
      { title: "שיחת מנטורינג יזומה", duration: "45 דקות", desc: "זהה מישהו שאתה מעריך. פנה אליו בהצעה ספציפית לשיחה. הכן 5 שאלות מובנות. אחרי השיחה: שלח תודה + מה למדת. הצע ערך בחזרה." },
      { title: "ייצור תוכן מקצועי אחד", duration: "שבוע", desc: "צור פוסט/מאמר קצר בנושא שאתה מומחה בו. פרסם בפלטפורמה רלוונטית. שתף עם 3 אנשים מהרשת שלך. בדוק: מה קיבלתי? מה התגובות?" }
    ]
  },
  {
    id: "branding", name: "מיצוב ונראות", icon: "⭐", color: "#FDD835", shortName: "מיתוג",
    questions: [
      "יש לי הצעת ערך ברורה שאני יכול לנסח תוך 30 שניות",
      "המסרים שלי עקביים בכל הפלטפורמות",
      "אני מוכר ומזוהה בתחומי המקצועי",
      "אני יוצר תוכן שמוכיח מומחיות ולא רק מצהיר עליה",
      "אני יודע ומנהל מה כתוב עליי ברשת",
      "אנשים פונים אליי עקב המוניטין שבניתי"
    ],
    exercises: [
      { title: "ניתוח מותג אישי נוכחי", duration: "30 דקות", desc: "חפש את עצמך בגוגל. שאל 3 קולגות: אם היית ממליץ עליי, מה היית אומר? השווה: מה אני רוצה שיגידו VS מה אומרים בפועל. מה הפער?" },
      { title: "Bio מקצועי ב-3 גרסאות", duration: "35 דקות", desc: "כתוב Bio: קצר (2 שורות), בינוני (פסקה), מלא (עמוד). כל גרסה: מי אתה, מה המומחיות, מה הערך הייחודי, קריאה לפעולה." },
      { title: "תוכנית תוכן חודשית", duration: "מדי חודש", desc: "הגדר: נושא מרכזי לחודש. 4 פוסטים שבועיים. לכל תוכן: מה המסר? למי? באיזה פלטפורמה? מה הפורמט? בסוף חודש: מה עבד?" }
    ]
  }
];

const SCORE_LABELS = [
  { min: 0, max: 33, label: "זקוק לפיתוח", color: "#EF5350" },
  { min: 34, max: 66, label: "בפיתוח", color: "#FFA726" },
  { min: 67, max: 100, label: "חזק", color: "#66BB6A" }
];

function getScoreInfo(pct) {
  return SCORE_LABELS.find(s => pct >= s.min && pct <= s.max) || SCORE_LABELS[0];
}

// localStorage helpers
function lsGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function Ring({ pct, size = 72, color, stroke = 7 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)", strokeLinecap: "round" }} />
    </svg>
  );
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080f1e; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 3px; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; transition: all 0.2s ease; }
  .card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.16); transform: translateY(-2px); }
  .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 20px; border-radius: 10px; font-size: 15px; font-weight: 600; transition: all 0.2s; }
  .tab-btn.active { background: rgba(201,168,76,0.18); color: #c9a84c; }
  .tab-btn:not(.active) { color: rgba(255,255,255,0.45); }
  .tab-btn:not(.active):hover { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.05); }
  .rating-btn { border: 2px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); cursor: pointer; border-radius: 10px; width: 44px; height: 44px; font-size: 16px; font-weight: 700; transition: all 0.18s; }
  .rating-btn:hover { border-color: rgba(201,168,76,0.6); color: #e8d5a3; background: rgba(201,168,76,0.1); }
  .rating-btn.sel { border-color: #c9a84c; background: rgba(201,168,76,0.2); color: #c9a84c; }
  .btn-primary { background: linear-gradient(135deg,#c9a84c,#e8d5a3); color: #0a1628; border: none; border-radius: 12px; padding: 13px 32px; font-size: 15px; font-weight: 800; cursor: pointer; transition: opacity 0.2s; }
  .btn-primary:hover { opacity: 0.88; }
  .btn-ghost { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 9px 20px; font-size: 14px; cursor: pointer; transition: all 0.18s; }
  .btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }
  textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #e8e8e8; padding: 14px; font-size: 14px; width: 100%; resize: vertical; outline: none; font-family: inherit; line-height: 1.7; direction: rtl; }
  textarea:focus { border-color: rgba(201,168,76,0.5); }
  .ex-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 14px; padding: 18px; margin-bottom: 12px; }
  .ex-card.done { border-color: rgba(102,187,106,0.4); background: rgba(102,187,106,0.05); }
  .check-btn { width: 26px; height: 26px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.2); background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.18s; flex-shrink: 0; }
  .check-btn.checked { border-color: #66BB6A; background: rgba(102,187,106,0.2); }
`;

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selId, setSelId] = useState(null);
  const [tab, setTab] = useState("diagnose");
  const [scores, setScores] = useState(() => lsGet("emp_scores") || {});
  const [exDone, setExDone] = useState(() => lsGet("emp_ex") || {});
  const [notes, setNotes] = useState(() => lsGet("emp_notes") || {});
  const [answers, setAnswers] = useState({});
  const [saved, setSaved] = useState(false);

  const openComp = (id) => {
    setSelId(id);
    const comp = COMPETENCIES.find(c => c.id === id);
    const prev = scores[id]?.answers || {};
    setAnswers(Object.fromEntries(comp.questions.map((_, i) => [i, prev[i] || 0])));
    setTab("diagnose");
    setScreen("comp");
    setSaved(false);
  };

  const saveScore = () => {
    const total = Object.values(answers).reduce((a, b) => a + b, 0);
    const maxPossible = COMPETENCIES.find(c => c.id === selId).questions.length * 5;
    const pct = Math.round((total / maxPossible) * 100);
    const newScores = { ...scores, [selId]: { answers: { ...answers }, total, pct, date: new Date().toLocaleDateString("he-IL") } };
    setScores(newScores);
    lsSet("emp_scores", newScores);
    setSaved(true);
  };

  const toggleEx = (compId, idx) => {
    const key = `${compId}_${idx}`;
    const newEx = { ...exDone, [key]: !exDone[key] };
    setExDone(newEx);
    lsSet("emp_ex", newEx);
  };

  const saveNote = (compId, val) => {
    const newNotes = { ...notes, [compId]: val };
    setNotes(newNotes);
    lsSet("emp_notes", newNotes);
  };

  const radarData = COMPETENCIES.map(c => ({
    subject: c.shortName,
    value: scores[c.id]?.pct || 0,
    fullMark: 100
  }));

  const allScored = COMPETENCIES.filter(c => scores[c.id]);
  const avgScore = allScored.length ? Math.round(allScored.reduce((a, c) => a + scores[c.id].pct, 0) / allScored.length) : 0;
  const totalEx = Object.values(exDone).filter(Boolean).length;
  const maxEx = COMPETENCIES.reduce((a, c) => a + c.exercises.length, 0);

  const selComp = COMPETENCIES.find(c => c.id === selId);
  const allAnswered = selComp && Object.values(answers).every(v => v > 0);

  return (
    <div dir="rtl" style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", background: "#080f1e", minHeight: "100vh", color: "#e8e8e8", direction: "rtl" }}>
      <style>{css}</style>

      {screen === "home" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 60px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 13, color: "#c9a84c", letterSpacing: 3, fontWeight: 700, marginBottom: 8 }}>מפת פיתוח אישי</div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>מסע התעסוקתיות שלי</h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>10 כישורים × מיפוי + אבחון + תרגול + מעקב</p>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            {[
              { label: "ממוצע כללי", val: allScored.length ? `${avgScore}%` : "—", color: "#c9a84c" },
              { label: "תחומים נבדקו", val: `${allScored.length}/${COMPETENCIES.length}`, color: "#4A90D9" },
              { label: "תרגילים הושלמו", val: `${totalEx}/${maxEx}`, color: "#66BB6A" },
            ].map((s, i) => (
              <div key={i} className="card" style={{ flex: 1, minWidth: 120, padding: "14px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {allScored.length >= 3 && (
            <div className="card" style={{ padding: "20px 10px", marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 8 }}>מפת חוזקות</div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                  <Radar name="ציון" dataKey="value" stroke="#c9a84c" fill="#c9a84c" fillOpacity={0.18} strokeWidth={2} dot={{ fill: "#c9a84c", r: 3 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {COMPETENCIES.map(c => {
              const sc = scores[c.id];
              const pct = sc?.pct ?? null;
              const info = pct !== null ? getScoreInfo(pct) : null;
              const doneCount = c.exercises.filter((_, i) => exDone[`${c.id}_${i}`]).length;
              return (
                <div key={c.id} className="card" onClick={() => openComp(c.id)}
                  style={{ padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Ring pct={pct ?? 0} size={68} color={pct !== null ? info.color : "rgba(255,255,255,0.12)"} stroke={6} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{c.icon}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 3 }}>{c.name}</div>
                    {pct !== null
                      ? <div style={{ fontSize: 13, color: info.color, fontWeight: 700 }}>{pct}% · {info.label}</div>
                      : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>טרם נבדק</div>}
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{doneCount}/{c.exercises.length} תרגילים ✓</div>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 16 }}>◄</div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: 36, color: "rgba(255,255,255,0.2)", fontSize: 12 }}>© כל הזכויות שמורות | מ.רצקר</div>
        </div>
      )}

      {screen === "comp" && selComp && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <button className="btn-ghost" onClick={() => setScreen("home")}>◄ חזרה</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <span style={{ fontSize: 28 }}>{selComp.icon}</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 20, color: "#fff" }}>{selComp.name}</div>
                {scores[selId] && (
                  <div style={{ fontSize: 12, color: getScoreInfo(scores[selId].pct).color }}>
                    ציון אחרון: {scores[selId].pct}% · {scores[selId].date}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 5, marginBottom: 24 }}>
            {[["diagnose", "🎯 אבחון"], ["exercises", "🏋️ תרגול"], ["track", "📝 מעקב"]].map(([id, label]) => (
              <button key={id} className={`tab-btn${tab === id ? " active" : ""}`} onClick={() => setTab(id)} style={{ flex: 1 }}>{label}</button>
            ))}
          </div>

          {tab === "diagnose" && (
            <div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 20 }}>דרג כל משפט מ-1 (כלל לא) עד 5 (תמיד)</div>
              {selComp.questions.map((q, i) => (
                <div key={i} className="card" style={{ padding: "16px 18px", marginBottom: 12 }}>
                  <div style={{ marginBottom: 12, fontSize: 14.5, color: "#ddd", lineHeight: 1.6 }}>{q}</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>תמיד</span>
                    {[5, 4, 3, 2, 1].map(v => (
                      <button key={v} className={`rating-btn${answers[i] === v ? " sel" : ""}`} onClick={() => setAnswers(a => ({ ...a, [i]: v }))}>{v}</button>
                    ))}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginRight: 4 }}>כלל לא</span>
                  </div>
                </div>
              ))}
              {allAnswered && (
                <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
                  <button className="btn-primary" onClick={saveScore}>{saved ? "✓ נשמר!" : "שמור ציון"}</button>
                </div>
              )}
              {saved && scores[selId] && (
                <div className="card" style={{ padding: "20px", marginTop: 18, textAlign: "center", borderColor: getScoreInfo(scores[selId].pct).color + "50" }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: getScoreInfo(scores[selId].pct).color }}>{scores[selId].pct}%</div>
                  <div style={{ fontSize: 16, color: getScoreInfo(scores[selId].pct).color, marginTop: 4 }}>{getScoreInfo(scores[selId].pct).label}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
                    {scores[selId].pct < 34 && "המיומנות הזו היא הזדמנות גדולה לצמיחה. התחל עם תרגיל אחד קטן."}
                    {scores[selId].pct >= 34 && scores[selId].pct < 67 && "אתה בדרך הנכונה! המשך לתרגל ולהעמיק."}
                    {scores[selId].pct >= 67 && "זו חוזקה אמיתית שלך. העמק אותה והפץ אותה לאחרים."}
                  </div>
                  <button className="btn-ghost" onClick={() => setTab("exercises")} style={{ marginTop: 14 }}>עבור לתרגילים ◄</button>
                </div>
              )}
            </div>
          )}

          {tab === "exercises" && (
            <div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 18 }}>3 תרגילים לפיתוח המיומנות</div>
              {selComp.exercises.map((ex, i) => {
                const key = `${selId}_${i}`;
                const done = !!exDone[key];
                return (
                  <div key={i} className={`ex-card${done ? " done" : ""}`}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <button className={`check-btn${done ? " checked" : ""}`} onClick={() => toggleEx(selId, i)}>
                        {done && <span style={{ color: "#66BB6A", fontSize: 14, fontWeight: 900 }}>✓</span>}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: done ? "#66BB6A" : "#fff" }}>{ex.title}</span>
                          <span style={{ fontSize: 11, background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 20, color: "rgba(255,255,255,0.45)" }}>⏱ {ex.duration}</span>
                        </div>
                        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{ex.desc}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "track" && (
            <div>
              {scores[selId] && (
                <div className="card" style={{ padding: "18px", marginBottom: 20, display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <Ring pct={scores[selId].pct} size={80} color={getScoreInfo(scores[selId].pct).color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: getScoreInfo(scores[selId].pct).color }}>{scores[selId].pct}%</div>
                    <div style={{ color: getScoreInfo(scores[selId].pct).color, fontSize: 14 }}>{getScoreInfo(scores[selId].pct).label}</div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>נבדק: {scores[selId].date}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {selComp.questions.map((q, i) => (
                      <div key={i} style={{ marginBottom: 5 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <div style={{ height: 6, flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                            <div style={{ height: "100%", width: `${(scores[selId].answers[i] / 5) * 100}%`, background: selComp.color, borderRadius: 3, transition: "width 0.8s ease" }} />
                          </div>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", minWidth: 12 }}>{scores[selId].answers[i]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>הערות והתחייבויות אישיות</div>
              <textarea rows={7}
                placeholder="כתוב כאן את המשאלות, הלקחים, ההתחייבויות והיעדים שלך..."
                value={notes[selId] || ""}
                onChange={e => saveNote(selId, e.target.value)}
              />
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6, textAlign: "left" }}>נשמר אוטומטית</div>
              {!scores[selId] && (
                <div style={{ textAlign: "center", marginTop: 30 }}>
                  <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: 14, fontSize: 14 }}>טרם ביצעת אבחון</div>
                  <button className="btn-ghost" onClick={() => setTab("diagnose")}>עבור לאבחון ◄</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
