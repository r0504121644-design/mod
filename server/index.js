import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './db.js';
import { isSeeded, seedDemoData } from './seed.js';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import classRoutes from './routes/classes.js';
import caseRoutes from './routes/cases.js';
import meetingRoutes from './routes/meetings.js';
import taskRoutes from './routes/tasks.js';
import observationRoutes from './routes/observations.js';
import referralRoutes from './routes/referrals.js';
import planRoutes from './routes/plans.js';
import attachmentRoutes from './routes/attachments.js';
import notificationRoutes from './routes/notifications.js';
import timelineRoutes from './routes/timeline.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'שגיאת שרת לא צפויה' });
});

if (!isSeeded()) {
  seedDemoData();
}

app.listen(PORT, () => {
  console.log(`יועצת+ API listening on http://localhost:${PORT}`);
});
