# 🗺️ מסע התעסוקתיות – הוראות פריסה

## מה זה?
אפליקציית Web עצמאית לפיתוח תעסוקתיות אישי.
10 כישורים × מיפוי + אבחון + תרגול + מעקב.

---

## פריסה ב-Vercel (חינמי, 5 דקות)

### שלב 1 – GitHub
1. פתח חשבון ב-https://github.com
2. צור Repository חדש (שם: `employability-app`)
3. העלה את כל תיקיית הפרויקט

### שלב 2 – Vercel
1. פתח חשבון ב-https://vercel.com
2. לחץ "Add New Project"
3. חבר את ה-GitHub Repository שלך
4. הגדרות Build:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. לחץ **Deploy**
6. תקבל קישור כמו: `my-app.vercel.app` ✅

---

## פריסה ב-Netlify (חלופה)
1. פתח חשבון ב-https://netlify.com
2. גרור את תיקיית הפרויקט ישירות לאתר
3. הפרויקט יבנה ויפורסם אוטומטית ✅

---

## הפעלה מקומית (לבדיקה)
```bash
npm install
npm run dev
```
פתח http://localhost:5173

---

## טכנולוגיות
- React 18
- Vite
- Recharts (גרף רדאר)
- localStorage (שמירת נתונים)

---

© כל הזכויות שמורות | מ.רצקר
