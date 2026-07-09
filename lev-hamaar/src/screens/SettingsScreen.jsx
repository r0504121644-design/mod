import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BRAND, ISRAELI_CITIES, CONSENT_STATUS } from '../lib/constants';
import { byParent, STORAGE_KEY } from '../lib/store';
import { Field, ConfirmDialog } from '../components/UI';

export default function SettingsScreen() {
  const { entities, currentFamily, currentParent, membership, upsert, setSession, notify } = useApp();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const isAdmin = membership?.roleKeys?.includes('FAMILY_ADMIN');
  const consent = currentParent ? byParent(entities, 'consents', currentParent.id)[0] : null;

  function updateSettings(patch) {
    upsert('familySpaces', { id: currentFamily.id, settings: { ...currentFamily.settings, ...patch } }, { note: 'הגדרות משפחה עודכנו' });
  }

  function updateConsent(patch) {
    if (!consent) return;
    upsert('consents', { id: consent.id, ...patch }, { note: 'רשומת הסכמה עודכנה' });
  }

  function exportData() {
    const blob = new Blob([localStorage.getItem(STORAGE_KEY) || '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lev-hamaar-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('הנתונים יוצאו לקובץ');
  }

  function archiveFamily() {
    updateSettings({ archived: true });
    setConfirmArchive(false);
    notify('המרחב הועבר לארכיון — לקריאה בלבד.');
  }

  return (
    <div className="stack">
      <h1>הגדרות ואודות</h1>

      {currentFamily && (
        <div className="card stack">
          <h3>הגדרות משפחה</h3>
          <Field label="עיר (לחישוב זמני שבת)">
            <select value={currentFamily.settings?.city} onChange={(e) => updateSettings({ city: e.target.value })} disabled={!isAdmin}>
              {ISRAELI_CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <label className="row small" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={currentFamily.settings?.shabbatModeEnabled !== false} onChange={(e) => updateSettings({ shabbatModeEnabled: e.target.checked })} disabled={!isAdmin} />
            הפעלת מצב שבת וחג (השתקת התראות, ריכוז לאחר צאת השבת)
          </label>
          <label className="row small" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={!!currentFamily.settings?.medRemindersOnShabbat} onChange={(e) => updateSettings({ medRemindersOnShabbat: e.target.checked })} disabled={!isAdmin} />
            לשלוח תזכורות תרופה גם בשבת
          </label>
          <Field label="יום שליחת הסיכום השבועי">
            <select value={currentFamily.settings?.weeklySummaryDay ?? 5} onChange={(e) => updateSettings({ weeklySummaryDay: Number(e.target.value) })} disabled={!isAdmin}>
              <option value={5}>יום שישי (לפני כניסת השבת)</option>
              <option value={6}>מוצאי שבת</option>
            </select>
          </Field>
        </div>
      )}

      <div className="card stack">
        <h3>נגישות</h3>
        <p className="small muted">ניתן גם להגדיל גופן ולשנות ניגודיות מתפריט העליון בכל מסך.</p>
        <ul className="small">
          <li>ניווט מלא במקלדת ותוויות נגישות בכל הרכיבים</li>
          <li>תמיכה בקורא מסך וסדר מיקוד תקין ב־RTL</li>
          <li>אישור לפני מחיקה בכל פעולה בלתי הפיכה</li>
        </ul>
      </div>

      {consent && currentParent && (
        <div className="card stack">
          <h3>הסכמה והרשאה — {currentParent.nickname}</h3>
          <Field label="סטטוס הסכמה">
            <select value={consent.status} onChange={(e) => updateConsent({ status: e.target.value })} disabled={!isAdmin}>
              {CONSENT_STATUS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <p className="small muted">ניתנה על ידי: {consent.givenBy} · סמכות: {consent.authority || 'לא צוינה'}</p>
        </div>
      )}

      <div className="card stack">
        <h3>נתונים ופרטיות</h3>
        <button className="btn btn-secondary" onClick={exportData}>ייצוא כל הנתונים לקובץ JSON</button>
        {isAdmin && currentFamily && !currentFamily.settings?.archived && (
          <button className="btn btn-danger" onClick={() => setConfirmArchive(true)}>העברת המרחב לארכיון (לאחר פטירת ההורה)</button>
        )}
        <p className="small muted">
          זהו פיילוט טכני להדגמה בדפדפן אחד, ללא שרת אחורי. הנתונים נשמרים במכשיר בלבד ואינם מוצפנים
          ברמה שמתאימה לפיילוט חי עם משפחות אמיתיות — ראו סעיף 41 במסמך האסטרטגיה.
        </p>
      </div>

      <div className="card center">
        <h3>{BRAND.app}</h3>
        <p className="muted">מבית {BRAND.company}</p>
        <p className="small">{BRAND.tagline}</p>
        <p className="small muted">{BRAND.credit}</p>
      </div>

      {confirmArchive && (
        <ConfirmDialog
          title="העברה לארכיון"
          message="הארכיון שומר את כל המידע לקריאה בלבד, מכבה את כל האוטומציות וההתראות מיידית. הפעולה אינה שולחת הודעות אוטומטיות."
          confirmLabel="העברה לארכיון" danger
          onConfirm={archiveFamily}
          onCancel={() => setConfirmArchive(false)}
        />
      )}
    </div>
  );
}
