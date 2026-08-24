"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Phone, Mail, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/shell/Footer";

type Mode = "phone" | "email";

export default function WelcomePage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  const [mode, setMode] = useState<Mode>("phone");
  const [contact, setContact] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim()) return;
    setOtpSent(true);
  }

  function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.trim().length < 4) return;
    login();
    router.push(hasCompletedOnboarding ? "/" : "/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-royal-gradient text-white shadow-glow">
              <HeartHandshake size={32} />
            </div>
            <h1 className="text-2xl font-bold text-navy">לב המעבר</h1>
            <p className="mt-1.5 text-sm text-navy/50">בכל מצב שמשתנה, יש מי שמלווה.</p>
            <p className="mt-0.5 text-xs text-navy/35">בינה מעברית™</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-soft border border-navy/5">
            {!otpSent ? (
              <form onSubmit={sendOtp} className="space-y-4">
                <div className="flex rounded-xl bg-lightblue/60 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("phone")}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
                      mode === "phone" ? "bg-white text-royal shadow-soft" : "text-navy/50"
                    }`}
                  >
                    <Phone size={15} /> טלפון
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("email")}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
                      mode === "email" ? "bg-white text-royal shadow-soft" : "text-navy/50"
                    }`}
                  >
                    <Mail size={15} /> אימייל
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy/80">
                    {mode === "phone" ? "מספר טלפון נייד" : "כתובת אימייל"}
                  </label>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={mode === "phone" ? "05X-XXXXXXX" : "name@example.com"}
                    className="w-full rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-royal/20"
                    dir="ltr"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  שליחת קוד אימות
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4 animate-fade-up">
                <p className="text-sm text-navy/60">
                  שלחנו קוד בן 4 ספרות ל-<span className="font-semibold text-navy">{contact}</span>
                </p>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="הזינו קוד"
                  className="w-full text-center tracking-[0.5em] text-lg rounded-xl border border-navy/10 px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-royal/20"
                  dir="ltr"
                />
                <Button type="submit" size="lg" className="w-full">
                  כניסה
                </Button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-xs text-navy/40 hover:text-navy/60"
                >
                  שינוי פרטי התקשרות
                </button>
              </form>
            )}
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-turquoise/5 border border-turquoise/15 px-3.5 py-3 text-xs leading-relaxed text-navy/55">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-turquoise" />
            הפרטיות שלכם חשובה לנו: המערכת שומרת כינויים בלבד, ללא שמות משפחה או מספרי זהות.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
