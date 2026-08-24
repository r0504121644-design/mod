"use client";

import { useState } from "react";
import { useAppStore, getMemberById } from "@/lib/store";
import { AppHeader } from "@/components/shell/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { WarningBanner } from "@/components/ui/WarningBanner";
import { SanitizedInput } from "@/components/ui/SanitizedInput";
import { DOCUMENT_UPLOAD_WARNING, ALIAS_ONLY_HINT } from "@/lib/sanitize";
import { formatIsraeliDate } from "@/lib/format";
import type { DocumentCategory } from "@/lib/types";
import { FolderHeart, Upload, Phone, UserRound, MessageSquarePlus } from "lucide-react";

const CATEGORIES: DocumentCategory[] = ["סיכום שחרור", "בדיקות מעבדה", "מסמכים משפטיים", "אחר"];
const UPDATE_CHIPS = ["התרופה נלקחה", "הגעתי לביקור", "הכל בסדר", "צריך תשומת לב"];

export default function DocumentsPage() {
  const documents = useAppStore((s) => s.documents);
  const addDocument = useAppStore((s) => s.addDocument);
  const professionals = useAppStore((s) => s.professionals);
  const addProfessional = useAppStore((s) => s.addProfessional);
  const updates = useAppStore((s) => s.updates);
  const postUpdate = useAppStore((s) => s.postUpdate);
  const familySpace = useAppStore((s) => s.familySpace);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const [docName, setDocName] = useState("");
  const [docNameValid, setDocNameValid] = useState(true);
  const [docCategory, setDocCategory] = useState<DocumentCategory>("אחר");

  const [profName, setProfName] = useState("");
  const [profNameValid, setProfNameValid] = useState(true);
  const [profRole, setProfRole] = useState("");
  const [profPhone, setProfPhone] = useState("");

  const [updateText, setUpdateText] = useState("");
  const [updateTextValid, setUpdateTextValid] = useState(true);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  const me = getMemberById(familySpace.members, currentUserId);

  function submitDocument() {
    if (!docName.trim() || !docNameValid) return;
    addDocument({ name: docName.trim(), category: docCategory, uploadedBy: me?.name ?? "" });
    setDocName("");
  }

  function submitProfessional() {
    if (!profName.trim() || !profNameValid) return;
    addProfessional({ name: profName.trim(), role: profRole || "איש מקצוע", phone: profPhone });
    setProfName("");
    setProfRole("");
    setProfPhone("");
  }

  function submitUpdate() {
    if (!selectedChip && !updateText.trim()) return;
    if (updateText.trim() && !updateTextValid) return;
    postUpdate({ authorId: currentUserId, text: updateText.trim(), chip: selectedChip ?? undefined });
    setUpdateText("");
    setSelectedChip(null);
  }

  return (
    <div>
      <AppHeader title="מסמכים, אנשי מקצוע ועדכונים" subtitle={`לוח המשפחה עבור ${familySpace.parentAlias}`} />

      <div className="p-4 lg:p-6 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card>
            <CardTitle className="flex items-center gap-2">
              <FolderHeart size={17} className="text-royal" /> ארון מסמכים
            </CardTitle>
            <WarningBanner text={DOCUMENT_UPLOAD_WARNING} className="mb-3.5" />
            <div className="space-y-2 mb-4">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-navy/5 p-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">{d.name}</p>
                    <p className="text-xs text-navy/40">
                      {formatIsraeliDate(d.date)} · הועלה ע״י {d.uploadedBy}
                    </p>
                  </div>
                  <Badge tone="navy">{d.category}</Badge>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-dashed border-navy/15 p-4 space-y-2.5">
              <SanitizedInput
                value={docName}
                onChange={(v, valid) => {
                  setDocName(v);
                  setDocNameValid(valid);
                }}
                placeholder="שם המסמך (למשל: בדיקת דם מרץ)"
              />
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="secondary" className="w-full" onClick={submitDocument}>
                <Upload size={14} />
                העלאת מסמך (סימולציה)
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle className="flex items-center gap-2">
              <Phone size={17} className="text-royal" /> פנקס אנשי מקצוע
            </CardTitle>
            <div className="space-y-2 mb-4">
              {professionals.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-navy/5 p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lightblue text-royal">
                      <UserRound size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy">{p.name}</p>
                      <p className="text-xs text-navy/40">{p.role}</p>
                    </div>
                  </div>
                  <a href={`tel:${p.phone}`} className="text-xs font-semibold text-royal" dir="ltr">
                    {p.phone}
                  </a>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-dashed border-navy/15 p-4 space-y-2.5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <SanitizedInput
                  value={profName}
                  onChange={(v, valid) => {
                    setProfName(v);
                    setProfNameValid(valid);
                  }}
                  placeholder="שם"
                />
                <input
                  value={profRole}
                  onChange={(e) => setProfRole(e.target.value)}
                  placeholder="תפקיד (רופא/ה, מטפל/ת...)"
                  className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm"
                />
              </div>
              <input
                value={profPhone}
                onChange={(e) => setProfPhone(e.target.value)}
                placeholder="טלפון"
                className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm"
                dir="ltr"
              />
              <Button size="sm" variant="secondary" className="w-full" onClick={submitProfessional}>
                הוספה לפנקס
              </Button>
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus size={17} className="text-royal" /> עדכוני משפחה
          </CardTitle>
          <div className="mb-4 rounded-2xl border border-navy/5 p-4 space-y-2.5">
            <div className="flex flex-wrap gap-2">
              {UPDATE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setSelectedChip(selectedChip === chip ? null : chip)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedChip === chip ? "border-turquoise bg-turquoise text-white" : "border-navy/10 text-navy/60 hover:border-turquoise/40"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <SanitizedInput
              value={updateText}
              onChange={(v, valid) => {
                setUpdateText(v);
                setUpdateTextValid(valid);
              }}
              placeholder="הוסיפו כמה מילים (אופציונלי)…"
              multiline
              rows={2}
            />
            <p className="text-xs text-navy/35">{ALIAS_ONLY_HINT}</p>
            <Button size="sm" className="w-full" onClick={submitUpdate}>
              פרסום עדכון
            </Button>
          </div>

          <ul className="space-y-3">
            {updates.map((u) => {
              const author = getMemberById(familySpace.members, u.authorId);
              if (!author) return null;
              return (
                <li key={u.id} className="flex items-start gap-2.5">
                  <Avatar initial={author.avatarInitial} color={author.color} size={30} />
                  <div className="flex-1 rounded-2xl bg-cream/70 border border-navy/5 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-navy">{author.name}</p>
                      <span className="text-[11px] text-navy/35">
                        {new Date(u.timestamp).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                    </div>
                    {u.chip && (
                      <Badge tone="turquoise" className="mt-1">
                        {u.chip}
                      </Badge>
                    )}
                    {u.text && <p className="mt-1 text-sm text-navy/70">{u.text}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
