// אימות מקומי להדגמת הפיילוט בלבד — ראו README לגבי המגבלה (אין שרת, אין הצפנה אמיתית).
export function weakHash(text) {
  let h = 0;
  const s = `lev-hamaar::${text}`;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

export function genInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
