import crypto from 'crypto';

export function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}
