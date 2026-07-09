import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { list, sortByDateDesc } from '../lib/store';
import { EmptyState, Badge } from '../components/UI';

export default function AuditLogScreen() {
  const { entities, currentFamily } = useApp();
  const [entityFilter, setEntityFilter] = useState('הכל');
  if (!currentFamily) return null;

  const logs = sortByDateDesc(list(entities, 'auditLog').filter((l) => l.familyId === currentFamily.id), 'createdAt');
  const entityTypes = ['הכל', ...new Set(logs.map((l) => l.entity))];
  const visible = entityFilter === 'הכל' ? logs : logs.filter((l) => l.entity === entityFilter);

  if (logs.length === 0) return <EmptyState emoji="🧾" title="יומן הפעילות ריק" text="כל פעולה שתתועד במרחב המשפחתי תופיע כאן." />;

  return (
    <div className="stack">
      <h1>יומן פעילות</h1>
      <p className="muted small">כל פעולה מתועדת: מי, מה, מתי ואופן הביצוע (ידני / סוכן / אוטומציה). מוצג למנהל המשפחתי בלבד.</p>
      <div className="tag-row">
        {entityTypes.map((e) => (
          <button key={e} className={`btn btn-sm ${entityFilter === e ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setEntityFilter(e)}>{e}</button>
        ))}
      </div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>מתי</th><th>מי</th><th>מה</th><th>אופן</th><th>פירוט</th></tr></thead>
          <tbody>
            {visible.slice(0, 200).map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString('he-IL')}</td>
                <td>{l.actorName}</td>
                <td>{l.entity}</td>
                <td><Badge tone="muted">{l.method}</Badge></td>
                <td className="small">{l.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
