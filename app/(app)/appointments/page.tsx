"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { AppHeader } from "@/components/shell/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatIsraeliDate } from "@/lib/format";
import { askAgent, AGENT_ROLE_STATEMENT } from "@/lib/agentService";
import { Stethoscope, MapPin, Car, FileCheck2, Sparkles, HeartHandshake, HeartPulse } from "lucide-react";

export default function AppointmentsPage() {
  const appointments = useAppStore((s) => s.appointments);
  const discharges = useAppStore((s) => s.discharges);
  const updateAppointmentChecklist = useAppStore((s) => s.updateAppointmentChecklist);
  const familySpace = useAppStore((s) => s.familySpace);
  const vitals = useAppStore((s) => s.vitals);
  const medications = useAppStore((s) => s.medications);

  const [prepFor, setPrepFor] = useState<string | null>(null);
  const [prepText, setPrepText] = useState("");
  const [prepLoading, setPrepLoading] = useState(false);

  const [explainFor, setExplainFor] = useState<string | null>(null);
  const [explainText, setExplainText] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);

  async function openPrep(appointmentId: string) {
    setPrepFor(appointmentId);
    setPrepLoading(true);
    setPrepText("");
    const res = await askAgent("סיכום מדדים לקראת תור ונסחו לי שאלות לרופא", {
      parentAlias: familySpace.parentAlias,
      vitals,
      medications,
    });
    setPrepText(res.text);
    setPrepLoading(false);
  }

  async function openExplain(dischargeId: string) {
    const discharge = discharges.find((d) => d.id === dischargeId);
    setExplainFor(dischargeId);
    setExplainLoading(true);
    setExplainText("");
    const res = await askAgent("הסבר לי את סיכום השחרור בשפה פשוטה", {
      parentAlias: familySpace.parentAlias,
      vitals,
      medications,
    });
    setExplainText(
      discharge
        ? `${res.text}\n\nבתמצית: ${discharge.summaryText}`
        : res.text
    );
    setExplainLoading(false);
  }

  return (
    <div>
      <AppHeader title="תורים ואשפוזים" subtitle={`ניהול ביקורים רפואיים עבור ${familySpace.parentAlias}`} />

      <div className="p-4 lg:p-6 space-y-5">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope size={17} className="text-royal" /> תורים קרובים
          </CardTitle>
          <div className="space-y-3">
            {appointments
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((a) => {
                const doneCount = a.documentsChecklist.filter((c) => c.checked).length;
                return (
                  <div key={a.id} className="rounded-2xl border border-navy/5 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-navy">{a.doctorName}</p>
                        <p className="text-sm text-navy/50">{a.specialty}</p>
                      </div>
                      <Badge tone="royal">
                        {formatIsraeliDate(a.date)} · {a.time}
                      </Badge>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-navy/50">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} /> {a.location}
                      </span>
                      {a.transportBy && (
                        <span className="flex items-center gap-1.5">
                          <Car size={13} /> הסעה: {a.transportBy}
                        </span>
                      )}
                      {a.documentsChecklist.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <FileCheck2 size={13} /> מסמכים: {doneCount}/{a.documentsChecklist.length}
                        </span>
                      )}
                    </div>

                    {a.documentsChecklist.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {a.documentsChecklist.map((c) => (
                          <li key={c.id}>
                            <label className="flex items-center gap-2 text-sm text-navy/70">
                              <input
                                type="checkbox"
                                checked={c.checked}
                                onChange={(e) => updateAppointmentChecklist(a.id, c.id, e.target.checked)}
                                className="h-4 w-4 accent-royal"
                              />
                              <span className={c.checked ? "line-through text-navy/35" : ""}>{c.label}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}

                    <Button variant="gold" size="sm" className="mt-3.5" onClick={() => openPrep(a.id)}>
                      <Sparkles size={14} />
                      הכנה לתור עם לב המעבר
                    </Button>
                  </div>
                );
              })}
          </div>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse size={17} className="text-royal" /> מעקב אשפוזים ושחרורים
          </CardTitle>
          <div className="space-y-3">
            {discharges.map((d) => (
              <div key={d.id} className="rounded-2xl border border-navy/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-navy">{d.hospitalName}</p>
                  <Badge tone="navy">שוחרר/ה ב-{formatIsraeliDate(d.dischargeDate)}</Badge>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-turquoise mb-1">תרופות חדשות</p>
                    <ul className="text-navy/70 space-y-0.5">
                      {d.newMedications.map((m) => (
                        <li key={m}>• {m}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-1">תרופות שהופסקו</p>
                    <ul className="text-navy/70 space-y-0.5">
                      {d.discontinuedMedications.map((m) => (
                        <li key={m}>• {m}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-royal mb-1">בדיקות המשך</p>
                    <ul className="text-navy/70 space-y-0.5">
                      {d.followUpTests.map((m) => (
                        <li key={m}>• {m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Button variant="gold" size="sm" className="mt-3.5" onClick={() => openExplain(d.id)}>
                  <HeartHandshake size={14} />
                  הסבר לי את סיכום השחרור
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {prepFor && (
        <Modal open onClose={() => setPrepFor(null)} title="הכנה לתור עם לב המעבר">
          <p className="mb-3 text-xs text-navy/45">{AGENT_ROLE_STATEMENT}</p>
          {prepLoading ? (
            <div className="flex items-center gap-1.5 py-6 justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-pulse-soft" />
              <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-pulse-soft [animation-delay:0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-pulse-soft [animation-delay:0.3s]" />
            </div>
          ) : (
            <p className="whitespace-pre-line rounded-xl bg-cream p-4 text-sm leading-relaxed text-navy/80">{prepText}</p>
          )}
        </Modal>
      )}

      {explainFor && (
        <Modal open onClose={() => setExplainFor(null)} title="הסבר סיכום השחרור">
          <p className="mb-3 text-xs text-navy/45">{AGENT_ROLE_STATEMENT}</p>
          {explainLoading ? (
            <div className="flex items-center gap-1.5 py-6 justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-pulse-soft" />
              <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-pulse-soft [animation-delay:0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-pulse-soft [animation-delay:0.3s]" />
            </div>
          ) : (
            <p className="whitespace-pre-line rounded-xl bg-cream p-4 text-sm leading-relaxed text-navy/80">{explainText}</p>
          )}
        </Modal>
      )}
    </div>
  );
}
