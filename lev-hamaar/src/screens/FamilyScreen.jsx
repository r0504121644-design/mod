import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { list } from '../lib/store';
import { ROLES } from '../lib/constants';
import { genInviteCode } from '../lib/auth';
import { Modal, Field, Badge, ConfirmDialog } from '../components/UI';

export default function FamilyScreen() {
  const { entities, currentFamily, currentUser, membership, upsert, notify } = useApp();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState('FAMILY_MEMBER');
  const [inviteName, setInviteName] = useState('');
  const [toRemove, setToRemove] = useState(null);
  const [editingRoles, setEditingRoles] = useState(null);

  if (!currentFamily) return null;
  const isAdmin = membership?.roleKeys?.includes('FAMILY_ADMIN');
  const members = list(entities, 'memberships').filter((m) => m.familyId === currentFamily.id);
  const activeAdmins = members.filter((m) => m.status === 'פעיל' && m.roleKeys?.includes('FAMILY_ADMIN'));

  function createInvite() {
    upsert('memberships', {
      familyId: currentFamily.id, userId: null, roleKeys: [inviteRole], status: 'ממתין',
      inviteCode: genInviteCode(), inviteName: inviteName || 'הזמנה',
    }, { audit: false });
    setShowInvite(false); setInviteName('');
    notify('קוד ההזמנה נוצר. שתפו אותו עם בן/בת המשפחה.');
  }

  function removeMember(m) {
    if (m.roleKeys?.includes('FAMILY_ADMIN') && activeAdmins.length <= 1) {
      notify('לא ניתן להסיר את המנהל היחיד — יש למנות מנהל נוסף קודם.');
      setToRemove(null);
      return;
    }
    upsert('memberships', { id: m.id, status: 'הוסר' }, { note: 'הוסר על ידי מנהל המשפחה' });
    setToRemove(null);
  }

  function toggleRole(m, roleKey) {
    const has = m.roleKeys.includes(roleKey);
    if (has && roleKey === 'FAMILY_ADMIN' && activeAdmins.length <= 1) {
      notify('חייב להישאר לפחות מנהל משפחתי אחד.');
      return;
    }
    const roleKeys = has ? m.roleKeys.filter((r) => r !== roleKey) : [...m.roleKeys, roleKey];
    upsert('memberships', { id: m.id, roleKeys }, { note: `תפקידים עודכנו: ${roleKeys.join(', ')}` });
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1>בני משפחה והרשאות</h1>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowInvite(true)}>+ הזמנת בן משפחה</button>}
      </div>

      {members.filter((m) => m.status !== 'הוסר').map((m) => {
        const user = m.userId ? entities.users[m.userId] : null;
        return (
          <div className="card" key={m.id}>
            <div className="section-header">
              <div>
                <strong>{user ? user.displayName : `${m.inviteName || 'הזמנה'} (ממתין להצטרפות)`}</strong>
                <div className="tag-row" style={{ marginTop: 4 }}>
                  {m.roleKeys.map((r) => <Badge key={r}>{ROLES[r]}</Badge>)}
                  {m.status === 'ממתין' && <Badge tone="warning">קוד: {m.inviteCode}</Badge>}
                  {m.status === 'מושהה' && <Badge tone="muted">מושהה</Badge>}
                </div>
              </div>
              {isAdmin && m.status === 'פעיל' && (
                <div className="row">
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingRoles(editingRoles === m.id ? null : m.id)}>עריכת תפקידים</button>
                  {m.userId !== currentUser.id && <button className="btn btn-danger btn-sm" onClick={() => setToRemove(m)}>הסרה</button>}
                </div>
              )}
            </div>
            {editingRoles === m.id && (
              <div className="tag-row">
                {Object.entries(ROLES).map(([key, label]) => (
                  <button key={key} className={`btn btn-sm ${m.roleKeys.includes(key) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleRole(m, key)}>{label}</button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {showInvite && (
        <Modal title="הזמנת בן משפחה" onClose={() => setShowInvite(false)}>
          <Field label="שם (לזיהוי בלבד)"><input value={inviteName} onChange={(e) => setInviteName(e.target.value)} /></Field>
          <Field label="תפקיד">
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              {Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowInvite(false)}>ביטול</button>
            <button className="btn btn-primary" onClick={createInvite}>יצירת קוד הזמנה</button>
          </div>
        </Modal>
      )}

      {toRemove && (
        <ConfirmDialog
          title="הסרת בן משפחה"
          message="ההסרה שקטה ולא תישלח הודעה לשאר המשפחה. נתונים שהוזנו על ידי המשתמש יישארו במערכת ויתועדו על שמו."
          confirmLabel="הסרה" danger
          onConfirm={() => removeMember(toRemove)}
          onCancel={() => setToRemove(null)}
        />
      )}
    </div>
  );
}
