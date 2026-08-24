// Agent Bridge: connects the app to the "לב המעבר" AI Agent.
// In production this would call the real agent endpoint; for local/offline
// preview it falls back to grounded mock responses built from app state.

import type { VitalRecord, Medication, ShiftAssignment, FamilyMember } from "./types";

export interface AgentContext {
  parentAlias: string;
  vitals?: VitalRecord[];
  medications?: Medication[];
  shifts?: ShiftAssignment[];
  members?: FamilyMember[];
}

export interface AgentResponse {
  text: string;
  suggestions?: string[];
}

const AGENT_ENDPOINT = process.env.NEXT_PUBLIC_LEV_AGENT_ENDPOINT ?? "";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockVitalsSummary(ctx: AgentContext): string {
  const latest = ctx.vitals?.slice(-4) ?? [];
  if (latest.length === 0) {
    return `עדיין אין מדדים רשומים עבור ${ctx.parentAlias}. אפשר להתחיל לתעד לחץ דם, דופק או סטורציה במסך "מדדים".`;
  }
  const lines = latest.map((v) => `• ${v.type}: ${v.value}${v.unit} (${v.date})`).join("\n");
  return `סיכום המדדים האחרונים של ${ctx.parentAlias}:\n${lines}\n\nהמגמה הכללית נראית יציבה. זכרו — זהו סיכום תומך בלבד ואינו מהווה אבחון רפואי.`;
}

function mockRefillAlerts(ctx: AgentContext): string {
  const low = (ctx.medications ?? []).filter((m) => m.stock <= m.lowStockThreshold);
  if (low.length === 0) {
    return "מלאי התרופות נראה תקין כרגע, אין צורך בחידוש מרשמים דחוף.";
  }
  const lines = low.map((m) => `• ${m.name} — נותרו ${m.stock} ${m.unit} בלבד`).join("\n");
  return `שווה לשים לב למלאי התרופות הבא:\n${lines}\n\nרוצים שאכין רשימת קניות לבית המרקחת?`;
}

function mockDoctorQuestions(ctx: AgentContext): string {
  return `כמה שאלות אפשריות לתור הקרוב עבור ${ctx.parentAlias}:\n• האם יש צורך להתאים את מינון התרופות הקיימות?\n• האם המדדים האחרונים (לחץ דם, סטורציה) תואמים את הציפיות?\n• האם נדרשות בדיקות מעבדה נוספות עד הביקור הבא?\n• האם יש תסמינים חדשים שכדאי לציין?`;
}

function mockShiftBalance(ctx: AgentContext): string {
  const names = (ctx.members ?? []).map((m) => m.name).join(", ");
  return `בהתבסס על התורנויות השבוע, מומלץ לחלק מחדש כמה משמרות כדי לשמור על איזון בין ${names || "בני המשפחה"}. אפשר לפתוח את מסך "תורנויות" כדי לראות פערים ולבצע החלפות בקלות.`;
}

function pickMockResponse(prompt: string, ctx: AgentContext): AgentResponse {
  const p = prompt.trim();
  if (p.includes("מדד") || p.includes("סיכום")) {
    return { text: mockVitalsSummary(ctx) };
  }
  if (p.includes("תרופ") || p.includes("מלאי") || p.includes("חידוש")) {
    return { text: mockRefillAlerts(ctx) };
  }
  if (p.includes("שאל") || p.includes("רופא") || p.includes("תור")) {
    return { text: mockDoctorQuestions(ctx) };
  }
  if (p.includes("משמרת") || p.includes("תורנ") || p.includes("איזון")) {
    return { text: mockShiftBalance(ctx) };
  }
  return {
    text: `אני כאן כדי לעזור לכם לארגן ולהבין את הטיפול ב${ctx.parentAlias}. אפשר לשאול על מדדים, תרופות, תורים או תורנויות — ואני אעזור לסכם ולהציע צעד הבא. חשוב לזכור: אני מלווה ומארגן, ואינני תחליף לייעוץ רפואי או משפטי.`,
  };
}

export async function askAgent(prompt: string, ctx: AgentContext): Promise<AgentResponse> {
  if (AGENT_ENDPOINT) {
    try {
      const res = await fetch(AGENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context: ctx }),
      });
      if (res.ok) {
        return (await res.json()) as AgentResponse;
      }
    } catch {
      // fall through to mock
    }
  }
  await delay(650 + Math.random() * 500);
  return pickMockResponse(prompt, ctx);
}

export const AGENT_PROMPT_SHORTCUTS = [
  "סיכום מדדים אחרונים",
  "התראות חידוש תרופות",
  "נסחו לי שאלות לרופא",
  "עזרו לי לאזן תורנויות",
];

export const AGENT_ROLE_STATEMENT =
  "לב המעבר הוא כלי ליווי וארגון עבור המשפחה — הוא עוזר לסכם, להזכיר ולהציע סדר, אך אינו רופא ואינו נותן ייעוץ רפואי או משפטי. בכל שאלה רפואית דחופה יש לפנות לרופא/ה או להתקשר ל-101.";
