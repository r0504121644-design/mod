import React, { createContext, useContext, useEffect, useMemo, useReducer, useState, useCallback } from 'react';
import { storeReducer, loadState, saveState, uid, nowIso, list, byFamily } from '../lib/store';
import { canEdit, ISRAELI_CITIES } from '../lib/constants';
import { ensureTodayMedicationLogs, evaluateAutomations } from '../lib/automations';
import { getShabbatWindow, isShabbatNow } from '../lib/shabbat';

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(storeReducer, undefined, loadState);
  const [toasts, setToasts] = useState([]);

  useEffect(() => { saveState(state); }, [state]);

  const notify = useCallback((message) => {
    const id = uid('toast');
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const currentUser = state.entities.users[state.session.currentUserId] || null;
  const currentFamily = state.entities.familySpaces[state.session.currentFamilyId] || null;
  const currentParent = state.entities.parents[state.session.currentParentId] || null;

  const membership = useMemo(() => {
    if (!currentUser || !currentFamily) return null;
    return list(state.entities, 'memberships').find(
      (m) => m.userId === currentUser.id && m.familyId === currentFamily.id && m.status === 'פעיל'
    );
  }, [state.entities, currentUser, currentFamily]);

  const roleKeys = membership?.roleKeys || [];
  const can = useCallback((domain) => canEdit(domain, roleKeys), [roleKeys]);

  const city = useMemo(() => {
    const cityName = currentFamily?.settings?.city;
    return ISRAELI_CITIES.find((c) => c.name === cityName) || ISRAELI_CITIES[0];
  }, [currentFamily]);

  const shabbatMode = currentFamily?.settings?.shabbatModeEnabled !== false;
  const now = new Date();
  const shabbatActive = shabbatMode && isShabbatNow(now, city);
  const shabbatWindow = useMemo(() => getShabbatWindow(now, city), [city, now.getDate(), now.getHours()]);

  const auditEntity = useCallback((entity, record, actor, method, note) => {
    const entry = {
      id: uid('audit'),
      familyId: record.familyId || currentFamily?.id || null,
      entity,
      entityId: record.id,
      actorUserId: actor?.id || null,
      actorName: actor?.displayName || 'מערכת',
      method: method || 'ידני',
      note: note || '',
      createdAt: nowIso(),
    };
    dispatch({ type: 'UPSERT', entity: 'auditLog', record: entry });
  }, [currentFamily, dispatch]);

  const upsert = useCallback((entity, record, opts = {}) => {
    const withId = record.id ? record : { ...record, id: uid(entity.slice(0, 3)) };
    dispatch({ type: 'UPSERT', entity, record: withId });
    if (opts.audit !== false) {
      auditEntity(entity, withId, opts.actor || currentUser, opts.method || 'ידני', opts.note);
    }
    return withId;
  }, [dispatch, auditEntity, currentUser]);

  const remove = useCallback((entity, id, opts = {}) => {
    dispatch({ type: 'REMOVE', entity, id });
    if (opts.audit !== false) {
      auditEntity(entity, { id }, opts.actor || currentUser, opts.method || 'ידני', opts.note || 'נמחק');
    }
  }, [dispatch, auditEntity, currentUser]);

  const setSession = useCallback((patch) => dispatch({ type: 'SET_SESSION', patch }), [dispatch]);

  // מריץ אוטומציות ומבטיח רשומות נטילה יומיות עם טעינת האפליקציה ובכל 60 שניות (סימולציית "ג'וב" ללא שרת אחורי).
  useEffect(() => {
    if (!currentFamily) return;
    const tick = () => {
      const n = new Date();
      const sActive = shabbatMode && isShabbatNow(n, city);
      const win = getShabbatWindow(n, city);
      const logDrafts = ensureTodayMedicationLogs(state.entities, currentFamily.id, n);
      logDrafts.forEach((l) => dispatch({ type: 'UPSERT', entity: 'medicationLogs', record: l }));
      const ruleConfig = byFamily(state.entities, 'automationRules', currentFamily.id).reduce((acc, r) => {
        acc[r.ruleId] = r; return acc;
      }, {});
      const alertDrafts = evaluateAutomations({
        entities: state.entities, familyId: currentFamily.id, now: n, ruleConfig,
        shabbat: { active: sActive, havdalahIso: win.havdalah.toISOString() },
      });
      alertDrafts.forEach((a) => dispatch({ type: 'UPSERT', entity: 'alerts', record: a }));
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFamily?.id, state.entities.medications, state.entities.inventory, state.entities.appointments, state.entities.shifts]);

  const value = {
    state, entities: state.entities, session: state.session,
    dispatch, upsert, remove, setSession, notify,
    currentUser, currentFamily, currentParent, membership, roleKeys, can,
    city, shabbatActive, shabbatWindow, shabbatMode,
  };

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => <div className="toast" key={t.id}>{t.message}</div>)}
      </div>
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
