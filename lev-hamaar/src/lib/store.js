// לב המעבר — שכבת נתונים מקומית (localStorage).
// הערה: זהו פיילוט טכני חד-דפדפני ללא שרת אחורי. ראו README לגבי המשמעות.

export const STORAGE_KEY = 'lev-hamaar:v1';

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

const ENTITY_KEYS = [
  'familySpaces', 'parents', 'users', 'memberships', 'consents',
  'medications', 'medicationLogs', 'inventory', 'measurements',
  'appointments', 'shifts', 'tasks', 'documents', 'visitReports',
  'alerts', 'automationRules', 'auditLog',
];

export function emptyState() {
  const entities = {};
  ENTITY_KEYS.forEach((k) => { entities[k] = {}; });
  return {
    session: {
      currentUserId: null,
      currentFamilyId: null,
      currentParentId: null,
      fontScale: 1,
      contrast: 'normal',
      onboardingComplete: false,
    },
    entities,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const base = emptyState();
    return {
      session: { ...base.session, ...(parsed.session || {}) },
      entities: { ...base.entities, ...(parsed.entities || {}) },
    };
  } catch (e) {
    console.warn('שגיאה בטעינת נתונים מקומיים, מתחילים ממצב ריק', e);
    return emptyState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('שגיאה בשמירת נתונים מקומיים', e);
  }
}

export function storeReducer(state, action) {
  switch (action.type) {
    case 'UPSERT': {
      const { entity, record } = action;
      const bucket = state.entities[entity] || {};
      const prev = bucket[record.id];
      const merged = {
        ...prev,
        ...record,
        createdAt: prev?.createdAt || record.createdAt || nowIso(),
        updatedAt: nowIso(),
      };
      return {
        ...state,
        entities: { ...state.entities, [entity]: { ...bucket, [merged.id]: merged } },
      };
    }
    case 'REMOVE': {
      const { entity, id } = action;
      const bucket = { ...(state.entities[entity] || {}) };
      delete bucket[id];
      return { ...state, entities: { ...state.entities, [entity]: bucket } };
    }
    case 'SET_SESSION':
      return { ...state, session: { ...state.session, ...action.patch } };
    case 'REPLACE_STATE':
      return action.state;
    default:
      return state;
  }
}

// ---- selectors ----
export const list = (entities, key) => Object.values(entities[key] || {});

export const byFamily = (entities, key, familyId) =>
  list(entities, key).filter((r) => r.familyId === familyId);

export const byParent = (entities, key, parentId) =>
  list(entities, key).filter((r) => r.parentId === parentId);

export function activeMemberships(entities, familyId) {
  return byFamily(entities, 'memberships', familyId).filter((m) => m.status === 'פעיל');
}

export function membershipsForUser(entities, userId) {
  return list(entities, 'memberships').filter((m) => m.userId === userId && m.status !== 'הוסר');
}

export function userRoleKeys(entities, userId, familyId) {
  const m = list(entities, 'memberships').find((m) => m.userId === userId && m.familyId === familyId && m.status === 'פעיל');
  return m?.roleKeys || [];
}

export function sortByDateDesc(arr, field = 'createdAt') {
  return [...arr].sort((a, b) => new Date(b[field]) - new Date(a[field]));
}

export function sortByDateAsc(arr, field = 'createdAt') {
  return [...arr].sort((a, b) => new Date(a[field]) - new Date(b[field]));
}
