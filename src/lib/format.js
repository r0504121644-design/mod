export const MEETING_TYPE_LABELS = {
  student: 'תלמידה',
  parents: 'הורים',
  teacher: 'מחנכת',
  staff: 'צוות',
  management: 'הנהלה',
  professional: 'גורם מקצועי',
};

export const TASK_PRIORITY_LABELS = { low: 'נמוכה', medium: 'רגילה', high: 'גבוהה' };
export const TASK_STATUS_LABELS = { todo: 'לביצוע', in_progress: 'בתהליך', done: 'הושלם' };
export const CASE_STATUS_LABELS = { open: 'פתוח', in_progress: 'בטיפול', closed: 'סגור' };
export const REFERRAL_STATUS_LABELS = { new: 'חדשה', in_review: 'בבדיקה', handled: 'טופלה' };

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fullName(obj, firstKey = 'first_name', lastKey = 'last_name') {
  if (!obj) return '';
  return `${obj[firstKey] || ''} ${obj[lastKey] || ''}`.trim();
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}
