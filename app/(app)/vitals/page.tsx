"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { AppHeader } from "@/components/shell/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WarningBanner } from "@/components/ui/WarningBanner";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatIsraeliDate, todayIso, nowTime24 } from "@/lib/format";
import type { VitalType } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus } from "lucide-react";

const VITAL_CONFIG: Record<VitalType, { unit: string; placeholder: string }> = {
  "לחץ דם": { unit: "", placeholder: "120/80" },
  "דופק": { unit: "פעימות/דקה", placeholder: "72" },
  "סוכר": { unit: "מ״ג/ד״ל", placeholder: "100" },
  "סטורציה": { unit: "%", placeholder: "97" },
  "חום": { unit: "°C", placeholder: "36.6" },
  "משקל": { unit: "ק״ג", placeholder: "68" },
  "כאב": { unit: "/10", placeholder: "3" },
  "שינה": { unit: "שעות", placeholder: "7" },
};

const RANGE_LIMITS: Record<VitalType, { min?: number; max?: number }> = {
  "לחץ דם": { min: 90, max: 160 },
  "דופק": { min: 50, max: 110 },
  "סוכר": { min: 70, max: 180 },
  "סטורציה": { min: 92 },
  "חום": { max: 38 },
  "משקל": {},
  "כאב": { max: 6 },
  "שינה": { min: 4 },
};

function numericValue(type: VitalType, value: string): number {
  if (type === "לחץ דם") return parseInt(value.split("/")[0]) || 0;
  return parseFloat(value) || 0;
}

function isOutOfRange(type: VitalType, value: string): boolean {
  const n = numericValue(type, value);
  const limits = RANGE_LIMITS[type];
  if (limits.min !== undefined && n < limits.min) return true;
  if (limits.max !== undefined && n > limits.max) return true;
  return false;
}

const TYPES = Object.keys(VITAL_CONFIG) as VitalType[];
const RANGES = ["יומי", "שבועי", "חודשי"] as const;

export default function VitalsPage() {
  const vitals = useAppStore((s) => s.vitals);
  const addVital = useAppStore((s) => s.addVital);
  const familySpace = useAppStore((s) => s.familySpace);

  const [type, setType] = useState<VitalType>("לחץ דם");
  const [value, setValue] = useState("");
  const [chartType, setChartType] = useState<VitalType>("לחץ דם");
  const [range, setRange] = useState<(typeof RANGES)[number]>("שבועי");

  const outOfRangeNow = value ? isOutOfRange(type, value) : false;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    addVital({
      type,
      value: value.trim(),
      unit: VITAL_CONFIG[type].unit,
      date: todayIso(),
      time: nowTime24(),
      outOfRange: isOutOfRange(type, value.trim()),
    });
    setValue("");
  }

  const days = range === "יומי" ? 1 : range === "שבועי" ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const chartData = useMemo(() => {
    return vitals
      .filter((v) => v.type === chartType && new Date(v.date) >= cutoff)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .map((v) => ({
        label: `${formatIsraeliDate(v.date).slice(0, 5)}`,
        value: numericValue(chartType, v.value),
      }));
  }, [vitals, chartType, range]); // eslint-disable-line react-hooks/exhaustive-deps

  const recentAlerts = vitals.filter((v) => v.outOfRange).slice(-3).reverse();

  return (
    <div>
      <AppHeader title="מדדים ומגמות" subtitle={`תיעוד ומעקב עבור ${familySpace.parentAlias}`} />

      <div className="p-4 lg:p-6 space-y-5">
        <WarningBanner
          tone="info"
          text="המדדים והתראות המערכת הם כלי מעקב תומך בלבד ואינם מהווים אבחון או ייעוץ רפואי."
        />
        {recentAlerts.length > 0 && (
          <WarningBanner
            tone="emergency"
            text={`התקבל מדד חריג (${recentAlerts[0].type}: ${recentAlerts[0].value}${recentAlerts[0].unit}). במקרה של הרגשה לא טובה או חירום יש להתקשר מיד ל-101.`}
          />
        )}

        <Card>
          <CardTitle>תיעוד מהיר</CardTitle>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <StatusChip key={t} label={t} active={type === t} onClick={() => setType(t)} />
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1.5 block text-sm font-medium text-navy/80">
                  ערך {VITAL_CONFIG[type].unit && `(${VITAL_CONFIG[type].unit})`}
                </label>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={VITAL_CONFIG[type].placeholder}
                  className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-royal/20"
                  dir="ltr"
                />
              </div>
              <Button type="submit" size="md">
                <Plus size={16} />
                הוספת מדד
              </Button>
            </div>
            {outOfRangeNow && (
              <p className="text-xs font-medium text-red-600">
                הערך נראה מחוץ לטווח הרגיל. זהו סימון תומך בלבד — בכל חשש יש לפנות לרופא/ה או להתקשר ל-101.
              </p>
            )}
          </form>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <CardTitle className="mb-0">מגמות</CardTitle>
            <div className="flex gap-1.5">
              {RANGES.map((r) => (
                <StatusChip key={r} label={r} active={range === r} onClick={() => setRange(r)} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {TYPES.map((t) => (
              <StatusChip key={t} label={t} active={chartType === t} onClick={() => setChartType(t)} />
            ))}
          </div>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-navy/40">אין נתונים בטווח שנבחר</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0F1E3610" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#0F1E3680" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#0F1E3680" }} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #0F1E3615", fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="#1E3A8A" strokeWidth={2.5} dot={{ r: 3, fill: "#D97706" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>היסטוריית מדדים</CardTitle>
          <ul className="divide-y divide-navy/5">
            {[...vitals]
              .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
              .slice(0, 12)
              .map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-navy/70">{v.type}</span>
                  <span className="font-semibold text-navy">
                    {v.value}
                    {v.unit}
                  </span>
                  <span className="text-xs text-navy/40">
                    {formatIsraeliDate(v.date)} · {v.time}
                  </span>
                  {v.outOfRange && <Badge tone="red">חריג</Badge>}
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
