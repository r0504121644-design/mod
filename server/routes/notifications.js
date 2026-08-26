import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM Notification WHERE school_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(req.user.schoolId, req.user.id);
  res.json(rows);
});

router.post('/:id/read', (req, res) => {
  const row = db.prepare('SELECT * FROM Notification WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'התראה לא נמצאה' });
  db.prepare('UPDATE Notification SET is_read = 1 WHERE id = ?').run(row.id);
  res.json({ ok: true });
});

router.post('/read-all', (req, res) => {
  db.prepare('UPDATE Notification SET is_read = 1 WHERE user_id = ? AND school_id = ?').run(req.user.id, req.user.schoolId);
  res.json({ ok: true });
});

export default router;
