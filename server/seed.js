import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { newId } from './utils/ids.js';

const DEMO_PASSWORD = 'Demo1234!';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}
function dateOnly(iso) {
  return iso.slice(0, 10);
}

export function isSeeded() {
  const row = db.prepare('SELECT COUNT(*) as c FROM School').get();
  return row.c > 0;
}

export function seedDemoData() {
  const schoolId = newId('school');
  db.prepare('INSERT INTO School (id, name, is_demo) VALUES (?, ?, 1)').run(schoolId, 'תיכון הראל (בית ספר דמו)');

  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const users = {
    counselor: { id: newId('user'), name: 'מרים כהן', email: 'counselor@demo.school', role: 'counselor' },
    teacher: { id: newId('user'), name: 'נועה לוי', email: 'teacher@demo.school', role: 'teacher' },
    teacher2: { id: newId('user'), name: 'יעל ברק', email: 'teacher2@demo.school', role: 'teacher' },
    principal: { id: newId('user'), name: 'רונית אברהם', email: 'principal@demo.school', role: 'principal' },
    admin: { id: newId('user'), name: 'דני שפירא', email: 'admin@demo.school', role: 'admin' },
  };
  const insertUser = db.prepare('INSERT INTO User (id, school_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)');
  for (const u of Object.values(users)) {
    insertUser.run(u.id, schoolId, u.name, u.email, hash, u.role);
  }

  const classA = newId('cls');
  const classB = newId('cls');
  db.prepare('INSERT INTO Class (id, school_id, name, grade, homeroom_teacher_id) VALUES (?, ?, ?, ?, ?)').run(classA, schoolId, "י'1", "י'", users.teacher.id);
  db.prepare('INSERT INTO Class (id, school_id, name, grade, homeroom_teacher_id) VALUES (?, ?, ?, ?, ?)').run(classB, schoolId, "י'2", "י'", users.teacher2.id);

  const studentNames = [
    ['תמר', 'אזולאי', classA],
    ['איתי', 'בן־דוד', classA],
    ['שירה', 'גולן', classA],
    ['עומר', 'דהן', classA],
    ['נועם', 'וייס', classB],
    ['מאיה', 'זוהר', classB],
    ['ליאור', 'חכמון', classB],
    ['רוני', 'טל', classB],
  ];
  const insertStudent = db.prepare(
    `INSERT INTO Student (id, school_id, class_id, first_name, last_name, gender, status, strengths_resources)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
  );
  const students = studentNames.map(([first, last, classId], i) => {
    const id = newId('stu');
    insertStudent.run(id, schoolId, classId, first, last, i % 2 === 0 ? 'נקבה' : 'זכר',
      i === 0 ? 'חברותית, אחראית, פעילה בוועד הכיתה' : i === 1 ? 'יצירתי, טוב בספורט, תומך בחברים' : null);
    return { id, first, last, classId };
  });
  const [tamar, itai, shira, omer, noam, maya, lior, roni] = students;

  // --- Counseling case for תמר (confidential) ---
  const case1 = newId('case');
  db.prepare(
    `INSERT INTO CounselingCase (id, school_id, student_id, title, status, summary, confidential, opened_by, opened_at)
     VALUES (?, ?, ?, ?, 'in_progress', ?, 1, ?, ?)`
  ).run(case1, schoolId, tamar.id, 'קושי חברתי ותחושת בדידות בכיתה', 'התלמידה פנתה ביזמתה. בתהליך ליווי שבועי, שיפור הדרגתי נצפה.', users.counselor.id, daysAgo(21));

  // --- Counseling case for איתי (not confidential) ---
  const case2 = newId('case');
  db.prepare(
    `INSERT INTO CounselingCase (id, school_id, student_id, title, status, summary, confidential, opened_by, opened_at)
     VALUES (?, ?, ?, ?, 'open', ?, 0, ?, ?)`
  ).run(case2, schoolId, itai.id, 'ירידה בהישגים ומוטיבציה', 'מעקב אחר שיפור נוכחות והרגלי למידה בשיתוף המחנכת.', users.counselor.id, daysAgo(5));

  // --- Meetings ---
  const insertMeeting = db.prepare(
    `INSERT INTO Meeting (id, school_id, student_id, case_id, type, meeting_date, participants, purpose, topics, decisions, follow_up, confidential, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertMeeting.run(
    newId('meet'), schoolId, tamar.id, case1, 'student', new Date().toISOString(),
    'תמר אזולאי, יועצת', 'שיח מעקב שבועי', 'תחושות בדידות, קשיים בהפסקות', 'להמשיך מפגשים שבועיים, לשלב בפעילות קבוצתית', 'מעקב בעוד שבוע', 1, users.counselor.id
  );
  insertMeeting.run(
    newId('meet'), schoolId, itai.id, case2, 'teacher', daysAgo(2),
    'איתי בן־דוד (לא נכח), נועה לוי, מרים כהן', 'תיאום בין מחנכת ליועצת', 'ירידה בציונים, נוכחות חסרה', 'פגישת הורים בשבוע הקרוב', 'לקבוע פגישת הורים', 0, users.counselor.id
  );
  insertMeeting.run(
    newId('meet'), schoolId, itai.id, case2, 'parents', daysFromNow(3),
    'הורי איתי, מרים כהן, נועה לוי', 'עדכון הורים על המצב ותכנית פעולה', '', '', '', 0, users.counselor.id
  );
  insertMeeting.run(
    newId('meet'), schoolId, null, null, 'management', daysFromNow(1),
    'הנהלה, יועצת', 'סקירת מקרים פעילים ברמת בית הספר', 'מקרים חדשים, תקציב ליווי פרטני', '', '', 0, users.counselor.id
  );

  // --- Tasks ---
  const insertTask = db.prepare(
    `INSERT INTO Task (id, school_id, title, description, assignee_id, due_date, priority, status, student_id, case_id, created_by, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertTask.run(newId('task'), schoolId, 'שיחת מעקב עם תמר', 'לבדוק איך עבר השבוע בהפסקות', users.counselor.id, dateOnly(new Date().toISOString()), 'high', 'todo', tamar.id, case1, users.counselor.id, null);
  insertTask.run(newId('task'), schoolId, 'להכין סיכום לפגישת הורים', 'סיכום מצב לקוח לקראת פגישת ההורים של איתי', users.counselor.id, dateOnly(new Date().toISOString()), 'medium', 'todo', itai.id, case2, users.counselor.id, null);
  insertTask.run(newId('task'), schoolId, 'לתאם עם רכזת שכבה', null, users.counselor.id, dateOnly(daysAgo(2)), 'medium', 'todo', null, null, users.counselor.id, null);
  insertTask.run(newId('task'), schoolId, 'למלא יומן נוכחות שבועי', 'מעקב נוכחות איתי', users.teacher.id, dateOnly(daysFromNow(4)), 'low', 'todo', itai.id, case2, users.counselor.id, null);
  insertTask.run(newId('task'), schoolId, 'לשלוח טופס הסכמת הורים', null, users.counselor.id, dateOnly(daysAgo(10)), 'high', 'done', tamar.id, case1, users.counselor.id, daysAgo(9));

  // --- Observations ---
  const insertObs = db.prepare(
    `INSERT INTO Observation (id, school_id, student_id, case_id, observation_date, content, confidential, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertObs.run(newId('obs'), schoolId, tamar.id, case1, dateOnly(daysAgo(8)), 'נצפתה יושבת לבד בהפסקה, נראית מהורהרת. ניגשתי לשוחח בעדינות.', 1, users.counselor.id);
  insertObs.run(newId('obs'), schoolId, itai.id, case2, dateOnly(daysAgo(4)), 'הגיע לשיעור ללא הכנת שיעורי בית, אך שיתף פעולה בדיון בכיתה.', 0, users.counselor.id);

  // --- Teacher referral (workflow: new, not yet handled) ---
  const referral1 = newId('ref');
  db.prepare(
    `INSERT INTO TeacherReferral (id, school_id, student_id, class_id, referred_by, reason, description, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`
  ).run(referral1, schoolId, shira.id, classA, users.teacher.id, 'שינוי פתאומי בהתנהגות', 'שירה נראית מוסגרת יותר מהרגיל בשבועיים האחרונים ומעדיפה להישאר בכיתה בהפסקות.', daysAgo(1));

  db.prepare(
    `INSERT INTO Notification (id, school_id, user_id, type, message, entity_type, entity_id, is_read)
     VALUES (?, ?, ?, 'new_referral', ?, 'TeacherReferral', ?, 0)`
  ).run(newId('notif'), schoolId, users.counselor.id, `פנייה חדשה ממחנכת עבור ${shira.first} ${shira.last}`, referral1);

  // --- Intervention plan + goals for איתי ---
  const plan1 = newId('plan');
  db.prepare(
    `INSERT INTO InterventionPlan (id, school_id, student_id, case_id, title, status, start_date, created_by)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
  ).run(plan1, schoolId, itai.id, case2, 'שיפור הרגלי למידה ונוכחות', dateOnly(daysAgo(5)), users.counselor.id);
  const insertGoal = db.prepare(
    `INSERT INTO InterventionGoal (id, school_id, plan_id, student_id, description, status, target_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insertGoal.run(newId('goal'), schoolId, plan1, itai.id, 'הגעה מלאה לכל השיעורים למשך חודש', 'in_progress', dateOnly(daysFromNow(20)));
  insertGoal.run(newId('goal'), schoolId, plan1, itai.id, 'הגשת כל מטלות הבית בזמן', 'open', dateOnly(daysFromNow(30)));

  // --- Attachment ---
  db.prepare(
    `INSERT INTO Attachment (id, school_id, student_id, case_id, title, note, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(newId('att'), schoolId, tamar.id, case1, 'טופס הסכמת הורים לליווי', 'נחתם וצולם על ידי ההורים', users.counselor.id);

  console.log('Seed complete.');
  console.log('Demo login credentials (password for all):', DEMO_PASSWORD);
  for (const u of Object.values(users)) console.log(` - ${u.role}: ${u.email}`);

  return { schoolId, users, classA, classB, students: { tamar, itai, shira, omer, noam, maya, lior, roni } };
}

const isMain = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isMain) {
  if (isSeeded()) {
    console.log('Database already seeded. Skipping.');
  } else {
    seedDemoData();
  }
}
