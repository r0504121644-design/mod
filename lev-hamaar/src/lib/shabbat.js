// חישוב קירוב של זמני כניסת/יציאת שבת וחג — לצורכי הדגמת "מצב שבת וחג" בפיילוט.
// זהו חישוב אסטרונומי מקורב (משוואת הזריחה/שקיעה הכללית) ואינו תחליף ללוח זמנים הלכתי מוסמך.

function toRad(d) { return (d * Math.PI) / 180; }
function toDeg(r) { return (r * 180) / Math.PI; }

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

function isIsraelDst(date) {
  // קירוב: שעון קיץ בישראל פעיל בערך סוף מרץ עד סוף אוקטובר.
  const m = date.getMonth() + 1;
  if (m > 3 && m < 10) return true;
  return false;
}

// מחזיר שעת שקיעה מקומית (שעות עשרוניות) לתאריך/מיקום נתונים.
export function sunsetHour(date, lat, lon) {
  const N = dayOfYear(date);
  const lngHour = lon / 15;
  const t = N + (18 - lngHour) / 24;
  const M = 0.9856 * t - 3.289;
  let L = M + 1.916 * Math.sin(toRad(M)) + 0.02 * Math.sin(toRad(2 * M)) + 282.634;
  L = ((L % 360) + 360) % 360;
  let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))));
  RA = ((RA % 360) + 360) % 360;
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = RA + (Lquadrant - RAquadrant);
  RA = RA / 15;
  const sinDec = 0.39782 * Math.sin(toRad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  const zenith = 90.833;
  const cosH = (Math.cos(toRad(zenith)) - sinDec * Math.sin(toRad(lat))) / (cosDec * Math.cos(toRad(lat)));
  if (cosH > 1 || cosH < -1) return null; // אין שקיעה (קוטבי) — לא רלוונטי בישראל
  const H = 360 - toDeg(Math.acos(cosH));
  const Hh = H / 15;
  const T = Hh + RA - 0.06571 * t - 6.622;
  let UT = T - lngHour;
  UT = ((UT % 24) + 24) % 24;
  const tzOffset = isIsraelDst(date) ? 3 : 2;
  let local = UT + tzOffset;
  local = ((local % 24) + 24) % 24;
  return local;
}

function hoursToLabel(h) {
  if (h == null) return '—';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const mm2 = mm === 60 ? 0 : mm;
  const hh2 = mm === 60 ? hh + 1 : hh;
  return `${String(hh2).padStart(2, '0')}:${String(mm2).padStart(2, '0')}`;
}

function nextFriday(from) {
  const d = new Date(from);
  const day = d.getDay(); // 0=Sun ... 5=Fri, 6=Sat
  const delta = (5 - day + 7) % 7;
  d.setDate(d.getDate() + delta);
  d.setHours(0, 0, 0, 0);
  return d;
}

// מחזיר { candleLighting: Date, havdalah: Date, label } לשבת הקרובה/הנוכחית ביחס לתאריך נתון.
export function getShabbatWindow(now, city) {
  const friday = nextFriday(now);
  const saturday = new Date(friday);
  saturday.setDate(saturday.getDate() + 1);

  const fridaySunset = sunsetHour(friday, city.lat, city.lon);
  const saturdaySunset = sunsetHour(saturday, city.lat, city.lon);

  const candleLighting = new Date(friday);
  if (fridaySunset != null) {
    const totalMin = Math.round(fridaySunset * 60) - city.candleOffset;
    candleLighting.setHours(0, totalMin, 0, 0);
  }

  const havdalah = new Date(saturday);
  if (saturdaySunset != null) {
    const totalMin = Math.round(saturdaySunset * 60) + 42;
    havdalah.setHours(0, totalMin, 0, 0);
  }

  return {
    candleLighting,
    havdalah,
    candleLabel: hoursToLabel(fridaySunset != null ? fridaySunset - city.candleOffset / 60 : null),
    havdalahLabel: hoursToLabel(saturdaySunset != null ? saturdaySunset + 42 / 60 : null),
  };
}

// האם כרגע בתוך חלון שבת (בין הדלקת נרות ליציאת שבת)?
export function isShabbatNow(now, city) {
  const win = getShabbatWindow(now, city);
  return now >= win.candleLighting && now <= win.havdalah;
}

export function shabbatStatusLabel(now, city) {
  const win = getShabbatWindow(now, city);
  if (now >= win.candleLighting && now <= win.havdalah) {
    return { active: true, text: `שבת שלום — יציאת השבת משוערת בשעה ${win.havdalahLabel}` };
  }
  return { active: false, text: `כניסת שבת הקרובה משוערת בשעה ${win.candleLabel}` };
}
