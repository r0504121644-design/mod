"use client";

import { useMemo, useState } from "react";
import { useAppStore, getMemberById } from "@/lib/store";
import { AppHeader } from "@/components/shell/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { WarningBanner } from "@/components/ui/WarningBanner";
import { todayIso } from "@/lib/format";
import type { DoseStatus } from "@/lib/types";
import { Check, X as XIcon, Clock3, PackageSearch, ShoppingCart, ClipboardCopy } from "lucide-react";
import { cn } from "@/lib/cn";

export default function MedicationsPage() {
  const medications = useAppStore((s) => s.medications);
  const doses = useAppStore((s) => s.doses);
  const markDose = useAppStore((s) => s.markDose);
  const restockMedication = useAppStore((s) => s.restockMedication);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const familySpace = useAppStore((s) => s.familySpace);

  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [shoppingListOpen, setShoppingListOpen] = useState(false);

  const me = getMemberById(familySpace.members, currentUserId);
  const today = todayIso();

  const todaysDoses = useMemo(
    () =>
      doses
        .filter((d) => d.date === today)
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((d) => ({ dose: d, med: medications.find((m) => m.id === d.medicationId) })),
    [doses, medications, today]
  );

  const lowStockMeds = medications.filter((m) => m.stock <= m.lowStockThreshold);

  function setStatus(doseId: string, status: DoseStatus) {
    if (status === "נדחה") {
      setReasonFor(doseId);
      setReasonText("");
      return;
    }
    markDose(doseId, status, undefined, me?.name);
  }

  function confirmPostpone() {
    if (!reasonFor) return;
    markDose(reasonFor, "נדחה", reasonText || undefined, me?.name);
    setReasonFor(null);
  }

  const shoppingListText = lowStockMeds
    .map((m) => `• ${m.name} (${m.dosage}) — נותרו ${m.stock} ${m.unit}`)
    .join("\n");

  return (
    <div>
      <AppHeader title="ניהול תרופות ומלאי" subtitle={`מעקב יומי עבור ${familySpace.parentAlias}`} />

      <div className="p-4 lg:p-6 space-y-5">
        {lowStockMeds.length > 0 && (
          <WarningBanner
            tone="privacy"
            text={`המלאי של ${lowStockMeds.map((m) => m.name).join(", ")} עומד להיגמר — כדאי לתכנן חידוש בקרוב.`}
          />
        )}

        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="mb-0">ציר זמן מנות היום</CardTitle>
            <Badge tone="navy">{today.split("-").reverse().join("/")}</Badge>
          </div>
          <ul className="space-y-2.5">
            {todaysDoses.map(({ dose, med }) => {
              if (!med) return null;
              const isPending = dose.status === "לא נלקח";
              return (
                <li
                  key={dose.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-xl border p-3.5",
                    isPending ? "border-amber-200 bg-amber-50/50" : "border-navy/5"
                  )}
                >
                  <div className="flex items-center gap-2 text-navy/50 text-xs font-semibold min-w-[52px]">
                    <Clock3 size={14} />
                    {dose.time}
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm font-semibold text-navy">{med.name}</p>
                    <p className="text-xs text-navy/45">{med.dosage}</p>
                    {dose.status === "נדחה" && dose.reason && (
                      <p className="mt-0.5 text-xs text-navy/45">סיבה: {dose.reason}</p>
                    )}
                    {dose.markedBy && <p className="mt-0.5 text-[11px] text-navy/35">סומן ע״י {dose.markedBy}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setStatus(dose.id, "נלקח")}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                        dose.status === "נלקח" ? "bg-emerald-100 text-emerald-700" : "bg-navy/5 text-navy/50 hover:bg-emerald-50"
                      )}
                    >
                      <Check size={13} /> נלקח
                    </button>
                    <button
                      onClick={() => setStatus(dose.id, "נדחה")}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                        dose.status === "נדחה" ? "bg-amber-100 text-amber-700" : "bg-navy/5 text-navy/50 hover:bg-amber-50"
                      )}
                    >
                      נדחה
                    </button>
                    <button
                      onClick={() => setStatus(dose.id, "לא נלקח")}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                        dose.status === "לא נלקח" ? "bg-navy/10 text-navy/60" : "bg-navy/5 text-navy/40 hover:bg-navy/10"
                      )}
                    >
                      <XIcon size={13} /> ממתין
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-navy/35">
            "המשימה עדיין ממתינה לביצוע" — אין צורך לדווח, פשוט סמנו כשתוכלו.
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="mb-0 flex items-center gap-2">
              <PackageSearch size={17} className="text-royal" /> מעקב מלאי
            </CardTitle>
            <Button size="sm" variant="gold" onClick={() => setShoppingListOpen(true)}>
              <ShoppingCart size={14} />
              רשימת קניות
            </Button>
          </div>
          <div className="space-y-3">
            {medications.map((m) => {
              const low = m.stock <= m.lowStockThreshold;
              const pct = Math.min(100, (m.stock / (m.lowStockThreshold * 2)) * 100);
              return (
                <div key={m.id} className="rounded-xl border border-navy/5 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-navy">{m.name}</p>
                      <p className="text-xs text-navy/45">
                        {m.dosage} · {m.times.join(", ")}
                        {m.prescriptionEndsInDays !== undefined && (
                          <span className="text-gold"> · המרשם מסתיים בעוד {m.prescriptionEndsInDays} ימים</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {low && <Badge tone="gold">מלאי נמוך</Badge>}
                      <Button size="sm" variant="secondary" onClick={() => restockMedication(m.id, 20)}>
                        חידוש מלאי
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2.5 h-2 w-full rounded-full bg-navy/5 overflow-hidden">
                    <div className={cn("h-full rounded-full", low ? "bg-gold" : "bg-turquoise")} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-navy/40">נותרו {m.stock} {m.unit}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {reasonFor && (
        <Modal open onClose={() => setReasonFor(null)} title="מה גרם לדחיית המנה?" maxWidth="max-w-sm">
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="למשל: היא ישנה, נדחה לשעה מאוחרת יותר…"
            rows={3}
            className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm"
          />
          <Button size="lg" className="mt-3 w-full" onClick={confirmPostpone}>
            שמירה
          </Button>
        </Modal>
      )}

      {shoppingListOpen && (
        <Modal open onClose={() => setShoppingListOpen(false)} title="רשימת קניות לבית המרקחת">
          {lowStockMeds.length === 0 ? (
            <p className="text-sm text-navy/50">אין כרגע תרופות במלאי נמוך.</p>
          ) : (
            <>
              <textarea readOnly value={shoppingListText} rows={lowStockMeds.length + 1} className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm bg-cream" />
              <Button
                size="lg"
                className="mt-3 w-full"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(shoppingListText).catch(() => {});
                  }
                }}
              >
                <ClipboardCopy size={16} />
                העתקת הרשימה
              </Button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
