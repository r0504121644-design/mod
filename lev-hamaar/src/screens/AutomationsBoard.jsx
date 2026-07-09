import React from 'react';
import { useApp } from '../context/AppContext';
import { list } from '../lib/store';
import { AUTOMATION_DEFS, AUTOMATIONS_COMING_SOON } from '../lib/constants';
import { Badge } from '../components/UI';

export default function AutomationsBoard() {
  const { entities, currentFamily, upsert, can, notify } = useApp();
  if (!currentFamily) return null;
  const canEdit = can('automations');

  const rules = list(entities, 'automationRules').filter((r) => r.familyId === currentFamily.id);
  const alerts = list(entities, 'alerts').filter((a) => a.familyId === currentFamily.id);

  function toggle(def) {
    const rule = rules.find((r) => r.ruleId === def.id);
    upsert('automationRules', { id: rule.id, enabled: !rule.enabled }, { note: `אוטומציה ${def.name} ${!rule.enabled ? 'הופעלה' : 'כובתה'}` });
    notify(`האוטומציה "${def.name}" ${!rule.enabled ? 'הופעלה' : 'כובתה'}`);
  }

  return (
    <div className="stack">
      <h1>לוח אוטומציות</h1>
      <p className="muted small">בפיילוט פעילות חמש אוטומציות בלבד. שאר האוטומציות יתווספו בשלב הבא לאחר עמידה ביעדי הפיילוט.</p>

      {AUTOMATION_DEFS.map((def) => {
        const rule = rules.find((r) => r.ruleId === def.id);
        const triggeredCount = alerts.filter((a) => a.dedupeKey?.startsWith(def.id)).length;
        return (
          <div className="card" key={def.id}>
            <div className="section-header">
              <div>
                <h3 style={{ marginBottom: 4 }}>{def.name}</h3>
                <p className="small muted">{def.description}</p>
              </div>
              {canEdit && rule && (
                <button className={`btn btn-sm ${rule.enabled ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggle(def)}>
                  {rule.enabled ? 'פעילה — לחיצה לכיבוי' : 'כבויה — לחיצה להפעלה'}
                </button>
              )}
            </div>
            <p className="small" style={{ background: 'var(--blue-pale)', padding: 10, borderRadius: 8 }}>{def.template}</p>
            <p className="small muted">הופעלה {triggeredCount} פעמים · <Badge tone={rule?.enabled ? 'success' : 'muted'}>{rule?.enabled ? 'פעילה' : 'כבויה'}</Badge></p>
          </div>
        );
      })}

      <div className="card">
        <h3>בקרוב (שלב ב׳)</h3>
        <div className="tag-row">
          {AUTOMATIONS_COMING_SOON.map((c) => <Badge tone="muted" key={c}>{c}</Badge>)}
        </div>
      </div>
    </div>
  );
}
