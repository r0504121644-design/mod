import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { byParent, sortByDateDesc } from '../lib/store';
import { DOCUMENT_TYPES } from '../lib/constants';
import { Modal, Field, EmptyState, Badge, ConfirmDialog } from '../components/UI';

export default function DocumentsScreen() {
  const { entities, currentFamily, currentParent, currentUser, upsert, remove, can, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [compareDoc, setCompareDoc] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  if (!currentParent) return null;

  const docs = sortByDateDesc(byParent(entities, 'documents', currentParent.id), 'createdAt');
  const canEditDocs = can('documents');

  function addDoc({ type, fileName }) {
    const doc = upsert('documents', {
      familyId: currentFamily.id, parentId: currentParent.id, type, fileName,
      uploadedBy: currentUser.displayName,
      agentSummary: `מסמך מסוג "${type}" הועלה. הפקת תקציר תוכן אוטומטי אינה זמינה בגרסת הפיילוט — יש לעיין במסמך המקורי.`,
    });
    setShowAdd(false);
    notify('המסמך נשמר');
    if (type === 'סיכום אשפוז') setCompareDoc(doc);
  }

  if (docs.length === 0 && !showAdd) {
    return <EmptyState emoji="📁" title="עדיין לא הועלו מסמכים" text="שמירת מסמכים במקום אחד חוסכת חיפוש בזמן הצורך." actionLabel="+ העלאת מסמך" onAction={() => setShowAdd(true)} />;
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1>מסמכים — {currentParent.nickname}</h1>
        {canEditDocs && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ העלאת מסמך</button>}
      </div>

      {docs.map((d) => (
        <div className="list-row" key={d.id}>
          <div>
            <strong>{d.fileName}</strong> <Badge tone="muted">{d.type}</Badge>
            <p className="small muted" style={{ margin: '4px 0 0' }}>{d.agentSummary}</p>
          </div>
          <div className="row">
            {d.type === 'סיכום אשפוז' && <button className="btn btn-sm btn-secondary" onClick={() => setCompareDoc(d)}>השוואה מול רשימת תרופות</button>}
            {canEditDocs && <button className="btn btn-sm btn-danger" onClick={() => setToDelete(d)}>מחיקה</button>}
          </div>
        </div>
      ))}

      {showAdd && <UploadForm onCancel={() => setShowAdd(false)} onSave={addDoc} />}
      {compareDoc && <CompareModal doc={compareDoc} parentId={currentParent.id} entities={entities} onClose={() => setCompareDoc(null)} onCreateTask={(text) => {
        upsert('tasks', { familyId: currentFamily.id, parentId: currentParent.id, title: 'לעבור על עדכון תרופות ממסמך', details: text, category: 'תרופות', urgency: 'גבוה', status: 'דורש בירור', source: 'הצעת סוכן' }, { audit: false });
        notify('נוצרה משימת בירור לאחראי התרופות');
      }} />}
      {toDelete && (
        <ConfirmDialog title="מחיקת מסמך" message={`למחוק את "${toDelete.fileName}"? הפעולה תתועד ביומן הפעילות.`} confirmLabel="מחיקה" danger
          onConfirm={() => { remove('documents', toDelete.id, { note: 'מסמך נמחק' }); setToDelete(null); }}
          onCancel={() => setToDelete(null)} />
      )}
    </div>
  );
}

function UploadForm({ onCancel, onSave }) {
  const [type, setType] = useState(DOCUMENT_TYPES[0]);
  const [fileName, setFileName] = useState('');
  return (
    <Modal title="העלאת מסמך" onClose={onCancel}>
      <p className="small" style={{ color: 'var(--warning)' }}>מומלץ להשחיר מספר זהות, כתובת, מספר תיק וכל פרט שאינו דרוש, לפני ההעלאה.</p>
      <Field label="סוג מסמך"><select value={type} onChange={(e) => setType(e.target.value)}>{DOCUMENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="בחירת קובץ" hint="בגרסת הפיילוט נשמר שם הקובץ בלבד, ללא תוכן — לצורך הדגמה בטוחה.">
        <input type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
      </Field>
      {fileName && <p className="small">נבחר: {fileName}</p>}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel}>ביטול</button>
        <button className="btn btn-primary" disabled={!fileName} onClick={() => onSave({ type, fileName })}>שמירה</button>
      </div>
    </Modal>
  );
}

function CompareModal({ doc, parentId, entities, onClose, onCreateTask }) {
  const [docMedsText, setDocMedsText] = useState('');
  const activeMeds = Object.values(entities.medications).filter((m) => m.parentId === parentId && m.status !== 'הופסקה');
  const docMeds = docMedsText.split('\n').map((s) => s.trim()).filter(Boolean);
  const compared = docMeds.map((name) => ({
    name, foundInActive: activeMeds.some((m) => m.name.trim().toLowerCase() === name.toLowerCase()),
  }));
  const missingFromDoc = activeMeds.filter((m) => !docMeds.some((n) => n.toLowerCase() === m.name.trim().toLowerCase()));

  return (
    <Modal title={`השוואה: ${doc.fileName} מול הרשימה הפעילה`} onClose={onClose} wide>
      <Field label="הקלידו את שמות התרופות המופיעות במסמך (שורה לכל תרופה)">
        <textarea value={docMedsText} onChange={(e) => setDocMedsText(e.target.value)} rows={5} />
      </Field>
      {docMeds.length > 0 && (
        <>
          <p className="small" style={{ color: 'var(--warning)' }}>נמצאו הבדלים אפשריים בין המסמך לרשימה הפעילה. מומלץ לעבור על ההבדלים ולאשר מה עדכני. אין עדכון אוטומטי.</p>
          <table className="data-table">
            <thead><tr><th>תרופה במסמך</th><th>קיימת ברשימה הפעילה?</th></tr></thead>
            <tbody>
              {compared.map((c, i) => (
                <tr key={i}><td>{c.name}</td><td>{c.foundInActive ? <Badge tone="success">כן</Badge> : <Badge tone="warning">לא — ייתכן שינוי</Badge>}</td></tr>
              ))}
            </tbody>
          </table>
          {missingFromDoc.length > 0 && (
            <p className="small">ברשימה הפעילה אך לא אותרו במסמך: {missingFromDoc.map((m) => m.name).join(', ')}</p>
          )}
          <button className="btn btn-primary" onClick={() => { onCreateTask(`השוואה מול ${doc.fileName}: ${JSON.stringify(compared)}`); onClose(); }}>
            יצירת משימת בירור לאחראי התרופות
          </button>
        </>
      )}
    </Modal>
  );
}
