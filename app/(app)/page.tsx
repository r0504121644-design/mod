"use client";

import Link from "next/link";
import { useAppStore, getMemberById } from "@/lib/store";
import { AppHeader } from "@/components/shell/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatIsraeliDate, todayIso } from "@/lib/format";
import {
  ListChecks,
  Stethoscope,
  Pill,
  Activity,
  PackageSearch,
  Moon,
  AlertTriangle,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function DashboardPage() {
  const familySpace = useAppStore((s) => s.familySpace);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const tasks = useAppStore((s) => s.tasks);
  const appointments = useAppStore((s) => s.appointments);
  const medications = useAppStore((s) => s.medications);
  const doses = useAppStore((s) => s.doses);
  const vitals = useAppStore((s) => s.vitals);
  const shifts = useAppStore((s) => s.shifts);
  const alerts = useAppStore((s) => s.alerts);

  const me = getMemberById(familySpace.members, currentUserId);
  const nextTask = tasks.find((t) => !t.done);
  const nextAppointment = [...appointments].sort((a, b) => a.date.localeCompare(b.date))[0];

  const today = todayIso();
  const todaysDoses = doses.filter((d) => d.date === today && d.status === "לא נלקח");
  const nextDose = todaysDoses.sort((a, b) => a.time.localeCompare(b.time))[0];
  const nextDoseMed = nextDose ? medications.find((m) => m.id === nextDose.medicationId) : undefined;

  const bpReadings = vitals.filter((v) => v.type === "לחץ דם").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const latestBp = bpReadings[bpReadings.length - 1];
  const prevBp = bpReadings[bpReadings.length - 2];
  const bpTrendUp = latestBp && prevBp ? parseInt(latestBp.value) > parseInt(prevBp.value) : null;

  const lowestStockMed = [...medications].sort((a, b) => a.stock / a.lowStockThreshold - b.stock / b.lowStockThreshold)[0];

  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"] as const;
  const todayDayName = dayNames[new Date().getDay()];
  const tonightShift = shifts.find((s) => s.day === todayDayName && s.slot === "ערב");
  const tonightMember = getMemberById(familySpace.members, tonightShift?.memberId);

  return (
    <div>
      <AppHeader title={`שלום, ${me?.name ?? "שלום"}. הנה תמונת המצב של היום.`} subtitle={`מרחב משפחתי עבור ${familySpace.parentAlias}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4 lg:p-6">
        <Card className="animate-fade-up">
          <CardTitle className="flex items-center gap-2">
            <ListChecks size={17} className="text-royal" /> המשימה הבאה
          </CardTitle>
          {nextTask ? (
            <>
              <p className="text-sm text-navy/80 font-medium">{nextTask.title}</p>
              {nextTask.dueDate && (
                <p className="mt-1 text-xs text-navy/45">עד {formatIsraeliDate(nextTask.dueDate)}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-navy/45">כל המשימות טופלו — כל הכבוד!</p>
          )}
        </Card>

        <Card className="animate-fade-up">
          <CardTitle className="flex items-center gap-2">
            <Stethoscope size={17} className="text-royal" /> התור הקרוב
          </CardTitle>
          {nextAppointment ? (
            <>
              <p className="text-sm text-navy/80 font-medium">
                {nextAppointment.doctorName} · {nextAppointment.specialty}
              </p>
              <p className="mt-1 text-xs text-navy/45">
                {formatIsraeliDate(nextAppointment.date)} בשעה {nextAppointment.time}
              </p>
            </>
          ) : (
            <p className="text-sm text-navy/45">אין תורים קרובים</p>
          )}
        </Card>

        <Card className="animate-fade-up">
          <CardTitle className="flex items-center gap-2">
            <Pill size={17} className="text-royal" /> התרופה הבאה
          </CardTitle>
          {nextDoseMed ? (
            <>
              <p className="text-sm text-navy/80 font-medium">{nextDoseMed.name}</p>
              <p className="mt-1 text-xs text-navy/45">בשעה {nextDose?.time}</p>
            </>
          ) : (
            <p className="text-sm text-navy/45">כל התרופות של היום סומנו</p>
          )}
        </Card>

        <Card className="animate-fade-up">
          <CardTitle className="flex items-center gap-2">
            <Activity size={17} className="text-royal" /> מדד אחרון ומגמה
          </CardTitle>
          {latestBp ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy/80 font-medium">לחץ דם: {latestBp.value}</p>
                <p className="mt-1 text-xs text-navy/45">{formatIsraeliDate(latestBp.date)} · {latestBp.time}</p>
              </div>
              {bpTrendUp !== null && (
                <Badge tone={bpTrendUp ? "red" : "green"}>
                  {bpTrendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {bpTrendUp ? "עלייה" : "ירידה"}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-navy/45">אין מדדים רשומים</p>
          )}
        </Card>

        <Card className="animate-fade-up">
          <CardTitle className="flex items-center gap-2">
            <PackageSearch size={17} className="text-royal" /> מצב מלאי תרופות
          </CardTitle>
          {lowestStockMed && (
            <>
              <p className="text-sm text-navy/80 font-medium">{lowestStockMed.name}</p>
              <div className="mt-2 h-2 w-full rounded-full bg-navy/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    lowestStockMed.stock <= lowestStockMed.lowStockThreshold ? "bg-gold" : "bg-turquoise"
                  }`}
                  style={{ width: `${Math.min(100, (lowestStockMed.stock / (lowestStockMed.lowStockThreshold * 2)) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-navy/45">נותרו {lowestStockMed.stock} {lowestStockMed.unit}</p>
            </>
          )}
        </Card>

        <Card className="animate-fade-up">
          <CardTitle className="flex items-center gap-2">
            <Moon size={17} className="text-royal" /> תורנות הערב
          </CardTitle>
          {tonightMember ? (
            <div className="flex items-center gap-2.5">
              <Avatar initial={tonightMember.avatarInitial} color={tonightMember.color} size={30} />
              <p className="text-sm text-navy/80 font-medium">{tonightMember.name}</p>
            </div>
          ) : (
            <p className="text-sm text-navy/45">עדיין לא שובץ אף אחד — כדאי לבדוק זמינות</p>
          )}
        </Card>

        <Card className="animate-fade-up sm:col-span-2 xl:col-span-3">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={17} className="text-gold" /> התראות חשובות
          </CardTitle>
          {alerts.length === 0 ? (
            <p className="text-sm text-navy/45">אין התראות כרגע</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      a.severity === "critical" ? "bg-red-500" : a.severity === "warning" ? "bg-gold" : "bg-turquoise"
                    }`}
                  />
                  <span className="text-navy/75">{a.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="px-4 lg:px-6 pb-6">
        <Link
          href="/shifts"
          className="flex items-center justify-between rounded-2xl bg-lightblue/60 px-5 py-3.5 text-sm font-semibold text-royal hover:bg-lightblue transition-colors"
        >
          לצפייה בלוח התורנויות המלא
          <ChevronLeft size={17} />
        </Link>
      </div>
    </div>
  );
}
