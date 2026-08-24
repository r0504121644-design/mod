"use client";

import { useMemo, useState } from "react";
import { useAppStore, getMemberById } from "@/lib/store";
import { AppHeader } from "@/components/shell/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import type { DayKey, SlotKey } from "@/lib/types";
import { Car, Moon, ShoppingBag, TriangleAlert, ArrowLeftRight, Settings2, Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const DAYS: DayKey[] = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const SLOTS: SlotKey[] = ["בוקר", "צהריים", "ערב", "לילה"];

export default function ShiftsPage() {
  const familySpace = useAppStore((s) => s.familySpace);
  const shifts = useAppStore((s) => s.shifts);
  const assignShift = useAppStore((s) => s.assignShift);
  const availability = useAppStore((s) => s.availability);
  const setAvailability = useAppStore((s) => s.setAvailability);
  const exchangeRequests = useAppStore((s) => s.exchangeRequests);
  const requestExchange = useAppStore((s) => s.requestExchange);
  const resolveExchange = useAppStore((s) => s.resolveExchange);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [cellPicker, setCellPicker] = useState<{ day: DayKey; slot: SlotKey } | null>(null);

  const members = familySpace.members;

  const gapCount = shifts.filter((s) => s.memberId === null).length;

  const fatigueByMember = useMemo(() => {
    const counts: Record<string, { total: number; nights: number }> = {};
    members.forEach((m) => (counts[m.id] = { total: 0, nights: 0 }));
    shifts.forEach((s) => {
      if (!s.memberId || !counts[s.memberId]) return;
      counts[s.memberId].total += 1;
      if (s.slot === "לילה") counts[s.memberId].nights += 1;
    });
    return counts;
  }, [shifts, members]);

  function fatigueLevel(memberId: string): { label: string; tone: "green" | "gold" | "red" } {
    const c = fatigueByMember[memberId];
    if (!c) return { label: "נמוך", tone: "green" };
    if (c.total >= 6 || c.nights >= 2) return { label: "גבוה", tone: "red" };
    if (c.total >= 3) return { label: "בינוני", tone: "gold" };
    return { label: "נמוך", tone: "green" };
  }

  return (
    <div>
      <AppHeader title="תורנויות חכמות" subtitle="לוח שבועי, זמינות ואיזון הוגן בין בני המשפחה" />

      <div className="p-4 lg:p-6 space-y-5">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={() => setAvailabilityOpen(true)}>
            <Settings2 size={15} />
            עדכון הזמינות שלי
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setExchangeOpen(true)}>
            <ArrowLeftRight size={15} />
            בקשת החלפת משמרת
          </Button>
          {gapCount > 0 && (
            <Badge tone="red" className="self-center">
              <TriangleAlert size={12} />
              {gapCount} משבצות ללא שיבוץ
            </Badge>
          )}
        </div>

        <Card>
          <CardTitle>לוח תורנויות שבועי</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-1.5">
              <thead>
                <tr>
                  <th className="w-20"></th>
                  {DAYS.map((d) => (
                    <th key={d} className="text-xs font-semibold text-navy/60 pb-1">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slot) => (
                  <tr key={slot}>
                    <td className="text-xs font-semibold text-navy/50 whitespace-nowrap pe-2">{slot}</td>
                    {DAYS.map((day) => {
                      const assignment = shifts.find((s) => s.day === day && s.slot === slot);
                      const member = getMemberById(members, assignment?.memberId);
                      return (
                        <td key={day}>
                          <button
                            onClick={() => setCellPicker({ day, slot })}
                            className={cn(
                              "flex h-14 w-full min-w-[72px] flex-col items-center justify-center rounded-xl border text-xs transition-colors",
                              member
                                ? "border-transparent"
                                : "border-dashed border-red-200 bg-red-50/60 hover:bg-red-50 text-red-400"
                            )}
                            style={member ? { backgroundColor: `${member.color}1a`, borderColor: `${member.color}33` } : undefined}
                          >
                            {member ? (
                              <>
                                <Avatar initial={member.avatarInitial} color={member.color} size={22} />
                                <span className="mt-0.5 text-[10px] text-navy/70">{member.name}</span>
                              </>
                            ) : (
                              <span>פער</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardTitle>מדד עומס ותשישות</CardTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {members.map((m) => {
              const level = fatigueLevel(m.id);
              const c = fatigueByMember[m.id];
              return (
                <div key={m.id} className="flex items-center gap-2.5 rounded-xl border border-navy/5 bg-cream/60 p-3">
                  <Avatar initial={m.avatarInitial} color={m.color} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">{m.name}</p>
                    <p className="text-[11px] text-navy/40">{c?.total ?? 0} משמרות השבוע</p>
                  </div>
                  <Badge tone={level.tone}>{level.label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardTitle>בקשות החלפת משמרת</CardTitle>
          {exchangeRequests.length === 0 ? (
            <p className="text-sm text-navy/45">אין בקשות ממתינות</p>
          ) : (
            <ul className="space-y-2.5">
              {exchangeRequests.map((r) => {
                const from = getMemberById(members, r.fromMemberId);
                const to = getMemberById(members, r.toMemberId);
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-navy/5 p-3">
                    <div className="flex-1 min-w-[200px] text-sm text-navy/75">
                      <span className="font-semibold text-navy">{from?.name}</span> מבקש/ת ש
                      <span className="font-semibold text-navy">{to?.name ?? "מישהו"}</span> ייקח/תיקח את משמרת {r.day} · {r.slot}
                      {r.note && <p className="mt-0.5 text-xs text-navy/45">"{r.note}"</p>}
                    </div>
                    {r.status === "ממתין" ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => resolveExchange(r.id, "אושר")}>
                          <Check size={14} /> אישור
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => resolveExchange(r.id, "נדחה")}>
                          <XIcon size={14} /> דחייה
                        </Button>
                      </div>
                    ) : (
                      <Badge tone={r.status === "אושר" ? "green" : "gray"}>{r.status}</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>זמינות בני המשפחה</CardTitle>
          <div className="space-y-2">
            {availability.map((a) => {
              const member = getMemberById(members, a.memberId);
              if (!member) return null;
              const slotCount = Object.values(a.slots).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);
              return (
                <div key={a.memberId} className="flex flex-wrap items-center gap-3 rounded-xl border border-navy/5 p-3">
                  <Avatar initial={member.avatarInitial} color={member.color} size={28} />
                  <span className="text-sm font-semibold text-navy">{member.name}</span>
                  <span className="text-xs text-navy/40">{slotCount} משבצות זמינות</span>
                  <div className="flex gap-1.5 ms-auto">
                    {a.canDrive && (
                      <Badge tone="royal">
                        <Car size={11} /> נהיגה
                      </Badge>
                    )}
                    {a.canNightStay && (
                      <Badge tone="navy">
                        <Moon size={11} /> לינת לילה
                      </Badge>
                    )}
                    {a.canPharmacy && (
                      <Badge tone="turquoise">
                        <ShoppingBag size={11} /> בית מרקחת
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {cellPicker && (
        <Modal open onClose={() => setCellPicker(null)} title={`שיבוץ: ${cellPicker.day} · ${cellPicker.slot}`}>
          <div className="space-y-1.5">
            <button
              onClick={() => {
                assignShift(cellPicker.day, cellPicker.slot, null);
                setCellPicker(null);
              }}
              className="w-full rounded-xl border border-dashed border-navy/15 px-3.5 py-2.5 text-start text-sm text-navy/50 hover:bg-navy/5"
            >
              ללא שיבוץ
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  assignShift(cellPicker.day, cellPicker.slot, m.id);
                  setCellPicker(null);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-start text-sm hover:bg-navy/5"
              >
                <Avatar initial={m.avatarInitial} color={m.color} size={26} />
                {m.name}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {availabilityOpen && (
        <AvailabilityModal
          onClose={() => setAvailabilityOpen(false)}
          members={members}
          currentUserId={currentUserId}
          availability={availability}
          setAvailability={setAvailability}
        />
      )}

      {exchangeOpen && (
        <ExchangeModal
          onClose={() => setExchangeOpen(false)}
          members={members}
          currentUserId={currentUserId}
          shifts={shifts}
          requestExchange={requestExchange}
        />
      )}
    </div>
  );
}

function AvailabilityModal({
  onClose,
  members,
  currentUserId,
  availability,
  setAvailability,
}: {
  onClose: () => void;
  members: ReturnType<typeof useAppStore.getState>["familySpace"]["members"];
  currentUserId: string;
  availability: ReturnType<typeof useAppStore.getState>["availability"];
  setAvailability: ReturnType<typeof useAppStore.getState>["setAvailability"];
}) {
  const existing = availability.find((a) => a.memberId === currentUserId);
  const [slots, setSlots] = useState<Partial<Record<DayKey, SlotKey[]>>>(existing?.slots ?? {});
  const [canDrive, setCanDrive] = useState(existing?.canDrive ?? false);
  const [canNightStay, setCanNightStay] = useState(existing?.canNightStay ?? false);
  const [canPharmacy, setCanPharmacy] = useState(existing?.canPharmacy ?? false);

  function toggleSlot(day: DayKey, slot: SlotKey) {
    setSlots((prev) => {
      const current = prev[day] ?? [];
      const next = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot];
      return { ...prev, [day]: next };
    });
  }

  const me = getMemberById(members, currentUserId);

  return (
    <Modal open onClose={onClose} title="עדכון הזמינות שלי" maxWidth="max-w-2xl">
      <p className="mb-4 text-sm text-navy/55">
        {me?.name}, סמנו את הימים והשעות בהן אתם זמינים לטפל ב{" "}
        <span className="font-semibold text-navy">ההורה</span>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-16"></th>
              {DAYS.map((d) => (
                <th key={d} className="text-[11px] font-semibold text-navy/50 pb-1">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot) => (
              <tr key={slot}>
                <td className="text-[11px] font-semibold text-navy/45">{slot}</td>
                {DAYS.map((day) => {
                  const active = slots[day]?.includes(slot);
                  return (
                    <td key={day}>
                      <button
                        onClick={() => toggleSlot(day, slot)}
                        className={cn(
                          "h-8 w-full rounded-lg text-[10px] font-medium transition-colors",
                          active ? "bg-royal text-white" : "bg-navy/5 text-navy/30 hover:bg-navy/10"
                        )}
                      >
                        {active ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-navy/70">
          <input type="checkbox" checked={canDrive} onChange={(e) => setCanDrive(e.target.checked)} className="h-4 w-4 accent-royal" />
          יכול/ה להסיע
        </label>
        <label className="flex items-center gap-2 text-sm text-navy/70">
          <input
            type="checkbox"
            checked={canNightStay}
            onChange={(e) => setCanNightStay(e.target.checked)}
            className="h-4 w-4 accent-royal"
          />
          יכול/ה ללון בלילה
        </label>
        <label className="flex items-center gap-2 text-sm text-navy/70">
          <input
            type="checkbox"
            checked={canPharmacy}
            onChange={(e) => setCanPharmacy(e.target.checked)}
            className="h-4 w-4 accent-royal"
          />
          יכול/ה לאסוף מבית מרקחת
        </label>
      </div>

      <Button
        size="lg"
        className="mt-5 w-full"
        onClick={() => {
          setAvailability({ memberId: currentUserId, slots, canDrive, canNightStay, canPharmacy });
          onClose();
        }}
      >
        שמירת זמינות
      </Button>
    </Modal>
  );
}

function ExchangeModal({
  onClose,
  members,
  currentUserId,
  shifts,
  requestExchange,
}: {
  onClose: () => void;
  members: ReturnType<typeof useAppStore.getState>["familySpace"]["members"];
  currentUserId: string;
  shifts: ReturnType<typeof useAppStore.getState>["shifts"];
  requestExchange: ReturnType<typeof useAppStore.getState>["requestExchange"];
}) {
  const myShifts = shifts.filter((s) => s.memberId === currentUserId);
  const [day, setDay] = useState<DayKey>(myShifts[0]?.day ?? DAYS[0]);
  const [slot, setSlot] = useState<SlotKey>(myShifts[0]?.slot ?? SLOTS[0]);
  const [toMemberId, setToMemberId] = useState(members.find((m) => m.id !== currentUserId)?.id ?? "");
  const [note, setNote] = useState("");

  return (
    <Modal open onClose={onClose} title="בקשת החלפת משמרת">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy/80">יום</label>
            <select value={day} onChange={(e) => setDay(e.target.value as DayKey)} className="w-full rounded-xl border border-navy/10 px-3 py-2.5 text-sm bg-white">
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy/80">משמרת</label>
            <select value={slot} onChange={(e) => setSlot(e.target.value as SlotKey)} className="w-full rounded-xl border border-navy/10 px-3 py-2.5 text-sm bg-white">
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy/80">להעביר ל</label>
          <select value={toMemberId} onChange={(e) => setToMemberId(e.target.value)} className="w-full rounded-xl border border-navy/10 px-3 py-2.5 text-sm bg-white">
            {members
              .filter((m) => m.id !== currentUserId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy/80">הערה (אופציונלי)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm"
          />
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            requestExchange({ day, slot, fromMemberId: currentUserId, toMemberId, note: note || undefined });
            onClose();
          }}
        >
          שליחת בקשה
        </Button>
      </div>
    </Modal>
  );
}
