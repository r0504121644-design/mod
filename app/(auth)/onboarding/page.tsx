"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { SanitizedInput } from "@/components/ui/SanitizedInput";
import { WarningBanner } from "@/components/ui/WarningBanner";
import { Avatar } from "@/components/ui/Avatar";
import { Footer } from "@/components/shell/Footer";
import { ALIAS_ONLY_HINT } from "@/lib/sanitize";
import type { FamilyMember, FamilyRole } from "@/lib/types";
import { HeartHandshake, Plus, Trash2, UserPlus } from "lucide-react";

const ROLES: FamilyRole[] = ["מנהל משפחה", "מטפל עיקרי", "בן משפחה", "משתמש מוגבל", "מטפל מקצועי"];
const PALETTE = ["#1E3A8A", "#0D9488", "#D97706", "#7C3AED", "#DB2777", "#059669"];

export default function OnboardingPage() {
  const router = useRouter();
  const familySpace = useAppStore((s) => s.familySpace);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [parentAlias, setParentAlias] = useState(familySpace.parentAlias);
  const [aliasValid, setAliasValid] = useState(true);
  const [birthYear, setBirthYear] = useState(familySpace.birthYear ?? "");
  const [city, setCity] = useState(familySpace.city ?? "");
  const [members, setMembers] = useState<FamilyMember[]>(familySpace.members);

  const [newName, setNewName] = useState("");
  const [newNameValid, setNewNameValid] = useState(true);
  const [newRole, setNewRole] = useState<FamilyRole>("בן משפחה");
  const [newContact, setNewContact] = useState("");

  function addMember() {
    if (!newName.trim() || !newNameValid) return;
    const member: FamilyMember = {
      id: `member_${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      color: PALETTE[members.length % PALETTE.length],
      avatarInitial: newName.trim()[0],
      phone: newContact || undefined,
    };
    setMembers([...members, member]);
    setNewName("");
    setNewContact("");
  }

  function removeMember(id: string) {
    setMembers(members.filter((m) => m.id !== id));
  }

  function finish() {
    if (!parentAlias.trim() || !aliasValid) return;
    completeOnboarding({ parentAlias: parentAlias.trim(), birthYear, city, members });
    router.push("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 px-4 py-10">
        <div className="mx-auto w-full max-w-xl animate-fade-up">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-royal-gradient text-white shadow-glow">
              <HeartHandshake size={26} />
            </div>
            <h1 className="text-xl font-bold text-navy">בואו נקים את המרחב המשפחתי</h1>
            <p className="mt-1 text-sm text-navy/50">כמה פרטים בסיסיים כדי להתחיל ללוות יחד</p>
          </div>

          <div className="space-y-5 rounded-3xl bg-white p-6 shadow-soft border border-navy/5">
            <section>
              <h2 className="mb-3 text-sm font-bold text-navy">פרטי ההורה המטופל/ת</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <SanitizedInput
                  label="כינוי (למשל: אמא, אבא, סבתא רבקה)"
                  value={parentAlias}
                  onChange={(v, valid) => {
                    setParentAlias(v);
                    setAliasValid(valid);
                  }}
                  placeholder="אמא"
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy/80">שנת לידה (אופציונלי)</label>
                  <input
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="1943"
                    className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-royal/20"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-navy/80">עיר מגורים (אופציונלי)</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="רמת גן"
                  className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-royal/20"
                />
              </div>
              <div className="mt-3">
                <WarningBanner text={ALIAS_ONLY_HINT} />
              </div>
            </section>

            <hr className="border-navy/5" />

            <section>
              <h2 className="mb-3 text-sm font-bold text-navy">בני משפחה ומטפלים</h2>
              <ul className="mb-4 space-y-2">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-navy/5 bg-cream/60 px-3 py-2.5"
                  >
                    <Avatar initial={m.avatarInitial} color={m.color} size={32} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-navy">{m.name}</p>
                      <p className="text-xs text-navy/45">{m.role}</p>
                    </div>
                    <button
                      onClick={() => removeMember(m.id)}
                      className="rounded-full p-1.5 text-navy/30 hover:bg-red-50 hover:text-red-500 transition-colors"
                      aria-label="הסרה"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="rounded-2xl border border-dashed border-navy/15 p-4">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <SanitizedInput
                    value={newName}
                    onChange={(v, valid) => {
                      setNewName(v);
                      setNewNameValid(valid);
                    }}
                    placeholder="שם פרטי או כינוי"
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as FamilyRole)}
                    className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-royal/20 bg-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="טלפון או אימייל להזמנה (אופציונלי)"
                  className="mt-2.5 w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-royal/20"
                  dir="ltr"
                />
                <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={addMember}>
                  <UserPlus size={15} />
                  הוספת בן משפחה
                </Button>
              </div>
            </section>

            <Button size="lg" className="w-full" onClick={finish}>
              <Plus size={17} />
              סיום הגדרה וכניסה למרחב המשפחתי
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
