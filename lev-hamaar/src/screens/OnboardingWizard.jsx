import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LIVING_SITUATIONS, ISRAELI_CITIES, CONSENT_STATUS, AUTOMATION_DEFS } from '../lib/constants';
import { genInviteCode } from '../lib/auth';
import { Field } from '../components/UI';

const STEPS = ['ברוכים הבאים', 'ההורה שלנו', 'הסכמה והרשאה', 'תרופות ראשונות', 'תור קרוב', 'הזמנת בני משפחה', 'תזכורות ומצב שבת', 'סיום'];

export default function OnboardingWizard() {
  const { currentUser, upsert, setSession, notify } = useApp();
  const [step, setStep] = useState(0);
  const [familyId, setFamilyId] = useState(null);
  const [parentId, setParentId] = useState(null);

  const [familyName, setFamilyName] = useState('המשפחה שלנו');
  const [nickname, setNickname] = useState('אמא');
  const [living, setLiving] = useState(LIVING_SITUATIONS[0]);

  const [consentKnown, setConsentKnown] = useState('כן');
  const [consentStatus, setConsentStatus] = useState('ניתנה');
  const [consentAuthority, setConsentAuthority] = useState('');

  const [meds, setMeds] = useState([{ name: '', dose: '', times: '08:00' }]);

  const [apptType, setApptType] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptClinic, setApptClinic] = useState('');

  const [invites, setInvites] = useState([]);
  const [inviteRole, setInviteRole] = useState('FAMILY_MEMBER');

  const [city, setCity] = useState(ISRAELI_CITIES[0].name);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [medsOnShabbat, setMedsOnShabbat] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  function commitFamilyAndParent() {
    const family = upsert('familySpaces', {
      name: familyName || 'המשפחה שלנו',
      settings: {
        city, shabbatModeEnabled: true, medRemindersOnShabbat: false,
        dailyReminderTime: '08:00', weeklySummaryDay: 5,
      },
    }, { actor: currentUser, note: 'נוצר מרחב משפחתי' });
    const parent = upsert('parents', {
      familyId: family.id, nickname, livingSituation: living, notes: '', importantRoutine: '',
    }, { actor: currentUser });
    upsert('memberships', {
      familyId: family.id, userId: currentUser.id, roleKeys: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER'],
      status: 'פעיל', joinedAt: new Date().toISOString(),
    }, { actor: currentUser });
    AUTOMATION_DEFS.forEach((def) => {
      upsert('automationRules', {
        id: `autorule_${family.id}_${def.id}`, familyId: family.id, ruleId: def.id,
        enabled: def.enabledDefault, recipients: [], lastTriggeredAt: null,
      }, { audit: false });
    });
    setFamilyId(family.id);
    setParentId(parent.id);
    return { family, parent };
  }

  function commitConsent(family, parent) {
    upsert('consents', {
      familyId: family.id, parentId: parent.id, givenBy: currentUser.displayName,
      authority: consentAuthority, parentKnows: consentKnown, status: consentStatus,
      scope: 'מידע טיפולי כללי', canView: 'בני המשפחה הפעילים במרחב', grantedAt: new Date().toISOString(),
      canRevoke: true,
    }, { actor: currentUser });
  }

  function commitMeds(family, parent) {
    meds.filter((m) => m.name.trim()).forEach((m) => {
      const med = upsert('medications', {
        familyId: family.id, parentId: parent.id, name: m.name.trim(), dose: m.dose,
        frequency: 'קבועה', times: m.times.split(',').map((t) => t.trim()).filter(Boolean),
        isPRN: false, status: 'פעיל', lastUpdateSource: 'עודכן ידנית', certainty: 'ודאי',
      }, { actor: currentUser });
      upsert('inventory', {
        familyId: family.id, parentId: parent.id, medicationId: med.id, quantity: 20, thresholdAlert: 5,
      }, { actor: currentUser, audit: false });
    });
  }

  function commitAppointment(family, parent) {
    if (!apptType.trim() || !apptDate) return;
    upsert('appointments', {
      familyId: family.id, parentId: parent.id, type: apptType, date: apptDate, time: apptTime,
      clinic: apptClinic, escort: '', questions: [], documents: [],
    }, { actor: currentUser });
  }

  function commitInvites(family) {
    invites.forEach((inv) => {
      upsert('memberships', {
        familyId: family.id, userId: null, roleKeys: [inv.role], status: 'ממתין',
        inviteCode: inv.code, inviteName: inv.name,
      }, { actor: currentUser, audit: false });
    });
  }

  function commitSettings(family) {
    upsert('familySpaces', {
      id: family.id,
      settings: {
        city, shabbatModeEnabled: true, medRemindersOnShabbat: medsOnShabbat,
        dailyReminderTime: reminderTime, weeklySummaryDay: 5,
      },
    }, { actor: currentUser, audit: false });
  }

  function addInvite() {
    setInvites((arr) => [...arr, { name: '', role: inviteRole, code: genInviteCode() }]);
  }

  function finish() {
    const { family, parent } = familyId ? { family: { id: familyId }, parent: { id: parentId } } : commitFamilyAndParent();
    commitConsent(family, parent);
    commitMeds(family, parent);
    commitAppointment(family, parent);
    commitInvites(family);
    commitSettings(family);
    setSession({ currentFamilyId: family.id, currentParentId: parent.id, onboardingComplete: true });
    notify('מסך הבית שלכם מוכן! 🎉');
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div style={{ maxWidth: 640, margin: '30px auto', padding: '0 16px' }}>
      <div className="row" style={{ marginBottom: 8 }}>
        <span className="step-badge">{step + 1}</span>
        <div className="progress-track" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <p className="small muted" style={{ marginBottom: 20 }}>שלב {step + 1} מתוך {STEPS.length} — {STEPS[step]}</p>

      <div className="card">
        {step === 0 && (
          <div className="stack">
            <h2>ברוכים הבאים ל־לב המעבר 💙</h2>
            <p>נבנה יחד, בכמה צעדים קצרים, מרחב משפחתי לניהול הטיפול. אפשר לדלג על כל שלב ולהשלים אותו מאוחר יותר.</p>
            <Field label="איך נקרא למרחב המשפחתי?"><input value={familyName} onChange={(e) => setFamilyName(e.target.value)} /></Field>
          </div>
        )}

        {step === 1 && (
          <div className="stack">
            <h2>בואו נכיר — ההורה שלנו</h2>
            <p className="muted">בלי שמות מלאים או תעודת זהות — כינוי בלבד מספיק.</p>
            <Field label="איך לקרוא להורה באפליקציה?">
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="אמא, אבא, סבתא..." />
            </Field>
            <Field label="מסגרת מגורים">
              <select value={living} onChange={(e) => setLiving(e.target.value)}>
                {LIVING_SITUATIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="stack">
            <h2>הסכמה והרשאה</h2>
            <p className="muted">חשוב לנו לוודא שהמרחב נפתח מתוך כבוד לרצון ולזכויות ההורה.</p>
            <Field label={`האם ${nickname} יודע/ת על פתיחת המרחב?`}>
              <select value={consentKnown} onChange={(e) => setConsentKnown(e.target.value)}>
                <option>כן</option><option>לא</option><option>חלקית</option>
              </select>
            </Field>
            <Field label="סטטוס ההסכמה">
              <select value={consentStatus} onChange={(e) => setConsentStatus(e.target.value)}>
                {CONSENT_STATUS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="על סמך איזו סמכות פועלת המשפחה?" hint="לדוגמה: הסכמת ההורה, ייפוי כוח מתמשך, אפוטרופסות — אפשר להשאיר ריק אם עוד לא ברור.">
              <input value={consentAuthority} onChange={(e) => setConsentAuthority(e.target.value)} />
            </Field>
            {consentStatus === 'דורשת בירור' && (
              <p className="small" style={{ color: 'var(--warning)' }}>עד להסדרה, המערכת תגביל העלאת מסמכים ושיתוף מידע רפואי רגיש.</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="stack">
            <h2>בואו נוסיף את התרופות של {nickname}</h2>
            {meds.map((m, i) => (
              <div key={i} className="row">
                <input placeholder="שם התרופה" value={m.name} onChange={(e) => setMeds((arr) => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <input placeholder="מינון" value={m.dose} onChange={(e) => setMeds((arr) => arr.map((x, j) => j === i ? { ...x, dose: e.target.value } : x))} style={{ maxWidth: 110 }} />
                <input placeholder="שעות, לדוגמה 08:00,20:00" value={m.times} onChange={(e) => setMeds((arr) => arr.map((x, j) => j === i ? { ...x, times: e.target.value } : x))} />
              </div>
            ))}
            {meds.length < 5 && (
              <button className="btn btn-secondary btn-sm" onClick={() => setMeds((arr) => [...arr, { name: '', dose: '', times: '08:00' }])}>+ תרופה נוספת</button>
            )}
            <p className="small muted">אפשר לדלג ולהוסיף תרופות מאוחר יותר במסך "תרופות ומלאי".</p>
          </div>
        )}

        {step === 4 && (
          <div className="stack">
            <h2>יש תור קרוב?</h2>
            <div className="grid grid-2">
              <Field label="סוג התור"><input value={apptType} onChange={(e) => setApptType(e.target.value)} placeholder="לדוגמה: קרדיולוג" /></Field>
              <Field label="תאריך"><input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} /></Field>
              <Field label="שעה"><input type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} /></Field>
              <Field label="מרפאה"><input value={apptClinic} onChange={(e) => setApptClinic(e.target.value)} /></Field>
            </div>
            <p className="small muted">אפשר להשאיר ריק ולדלג.</p>
          </div>
        )}

        {step === 5 && (
          <div className="stack">
            <h2>הזמנת בני משפחה</h2>
            <p className="muted">מומלץ להזמין לפחות שני בני משפחה נוספים כדי לחלוק את העומס.</p>
            {invites.map((inv, i) => (
              <div key={i} className="list-row">
                <input placeholder="שם (לזיהוי בלבד)" value={inv.name} onChange={(e) => setInvites((arr) => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <span className="badge">קוד הזמנה: {inv.code}</span>
              </div>
            ))}
            <div className="row">
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="PRIMARY_CAREGIVER">מטפל משפחתי עיקרי</option>
                <option value="MEDS_OWNER">אחראי תרופות</option>
                <option value="APPOINTMENTS_OWNER">אחראי תורים</option>
                <option value="FAMILY_MEMBER">בן משפחה</option>
                <option value="VIEWER">צפייה בלבד</option>
              </select>
              <button className="btn btn-secondary btn-sm" onClick={addInvite}>+ יצירת קוד הזמנה</button>
            </div>
            <p className="small muted">שתפו את הקוד עם בן/בת המשפחה — הם יזינו אותו בעת ההרשמה כדי להצטרף.</p>
          </div>
        )}

        {step === 6 && (
          <div className="stack">
            <h2>תזכורות ומצב שבת</h2>
            <Field label="עיר (לחישוב זמני כניסת שבת)">
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                {ISRAELI_CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="שעת תזכורת יומית ראשונה"><input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} /></Field>
            <label className="row small" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={medsOnShabbat} onChange={(e) => setMedsOnShabbat(e.target.checked)} />
              לשלוח תזכורות תרופה גם בשבת (חריג בטיחותי)
            </label>
          </div>
        )}

        {step === 7 && (
          <div className="stack center">
            <div style={{ fontSize: '2.4rem' }}>🎉</div>
            <h2>הכול מוכן!</h2>
            <p className="muted">מסך הבית שלכם יעלה עם התוכן שהזנתם. אפשר להוסיף עוד בכל שלב.</p>
          </div>
        )}

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 22 }}>
          <button className="btn btn-secondary" onClick={back} disabled={step === 0}>הקודם</button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={next}>הבא</button>
          ) : (
            <button className="btn btn-gold" onClick={finish}>כניסה למסך הבית</button>
          )}
        </div>
      </div>
    </div>
  );
}
