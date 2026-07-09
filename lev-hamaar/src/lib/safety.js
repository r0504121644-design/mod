import { EMERGENCY_KEYWORDS } from './constants';

export function detectEmergency(text) {
  if (!text) return false;
  const normalized = text.replace(/["'׳״]/g, '');
  return EMERGENCY_KEYWORDS.some((kw) => normalized.includes(kw.replace(/["'׳״]/g, '')));
}
