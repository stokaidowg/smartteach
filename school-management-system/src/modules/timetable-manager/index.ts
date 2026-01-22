import { Request, Response } from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  user: 'school_user',
  host: 'localhost',
  database: 'smartTeach',
  password: '123',
  port: 5432,
});

export class TimetableManager {
  async getPupilTimetable(req: Request, res: Response) {
    const { pupilId } = req.query;
    const result = await pool.query(`
      SELECT t.day_of_week, t.period, s.name AS set_name, sub.name AS subject, r.room_code
      FROM timetable t
      JOIN set_pupils sp ON t.set_id = sp.set_id
      JOIN sets s ON t.set_id = s.id
      JOIN subjects sub ON s.subject_id = sub.id
      LEFT JOIN rooms r ON t.room_id = r.id
      WHERE sp.pupil_id = $1
      ORDER BY t.day_of_week, t.period
    `, [pupilId]);
    res.json(result.rows);
  }

  async getStaffTimetable(req: Request, res: Response) {
    const { staffId } = req.query;
    const result = await pool.query(`
      SELECT t.day_of_week, t.period, s.name AS set_name, sub.name AS subject, r.room_code
      FROM timetable t
      JOIN set_teachers st ON t.set_id = st.set_id
      JOIN sets s ON t.set_id = s.id
      JOIN subjects sub ON s.subject_id = sub.id
      LEFT JOIN rooms r ON t.room_id = r.id
      WHERE st.staff_id = $1
      ORDER BY t.day_of_week, t.period
    `, [staffId]);
    res.json(result.rows);
  }
}

// GET all timetable entries (optionally filter by set, teacher, room, day)
export async function getTimetable(req: Request, res: Response) {
  res.set('Cache-Control', 'no-store');
  const { setId, roomId, dayOfWeek, teacherId } = req.query;
  let sql = `
    SELECT t.*
    FROM timetable t
  `;
  const clauses = [];
  const values: any[] = [];

  if (setId) { clauses.push('t.set_id = $' + (values.length + 1)); values.push(setId); }
  if (roomId) { clauses.push('t.room_id = $' + (values.length + 1)); values.push(roomId); }
  if (dayOfWeek) { clauses.push('t.day_of_week = $' + (values.length + 1)); values.push(dayOfWeek); }
  if (teacherId) { clauses.push('t.teacher_id = $' + (values.length + 1)); values.push(teacherId); }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY t.day_of_week, t.period';
  const result = await pool.query(sql, values);
  res.json(result.rows);
}

// POST create timetable entry
export async function addTimetableEntry(req: Request, res: Response) {
  const { set_id, room_id, day_of_week, period, start_time, end_time } = req.body;
  const id = crypto.randomUUID();

  // Look up the primary teacher for this set
  const teacherResult = await pool.query(
    'SELECT staff_id FROM set_teachers WHERE set_id = $1 AND is_primary = true LIMIT 1',
    [set_id]
  );
  if (teacherResult.rows.length === 0) {
    return res.status(400).json({ error: 'No primary teacher assigned to this set.' });
  }
  const teacher_id = teacherResult.rows[0].staff_id;

  await pool.query(
    `INSERT INTO timetable (id, set_id, teacher_id, room_id, day_of_week, period, start_time, end_time)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, set_id, teacher_id, room_id, day_of_week, period, start_time, end_time]
  );
  res.status(201).json({ success: true, id });
}

// PUT update timetable entry
export async function updateTimetableEntry(req: Request, res: Response) {
  const { id } = req.params;
  const { set_id, teacher_id, room_id, day_of_week, period, start_time, end_time } = req.body;
  await pool.query(
    `UPDATE timetable SET set_id=$1, teacher_id=$2, room_id=$3, day_of_week=$4, period=$5, start_time=$6, end_time=$7 WHERE id=$8`,
    [set_id, teacher_id, room_id, day_of_week, period, start_time, end_time, id]
  );
  res.json({ success: true });
}

// DELETE timetable entry
export async function deleteTimetableEntry(req: Request, res: Response) {
  const { id } = req.params;
  await pool.query('DELETE FROM timetable WHERE id = $1', [id]);
  res.json({ success: true });
}

// GET all appointments for a staff member
export async function getStaffAppointments(req: Request, res: Response) {
  const { staffId } = req.query;
  const result = await pool.query(
    'SELECT * FROM staff_appointments WHERE staff_id = $1 ORDER BY day_of_week, period',
    [staffId]
  );
  res.json(result.rows);
}

// POST add appointment
export async function addStaffAppointment(req: Request, res: Response) {
  const { staff_id, day_of_week, period, title, notes, room_id } = req.body;
  const id = crypto.randomUUID();
  await pool.query(
    'INSERT INTO staff_appointments (id, staff_id, day_of_week, period, title, notes, room_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, staff_id, day_of_week, period, title, notes, room_id]
  );
  res.status(201).json({ success: true, id });
}

// PUT update appointment (if you have one)
export async function updateStaffAppointment(req: Request, res: Response) {
  const { id } = req.params;
  const { staff_id, day_of_week, period, title, notes, room_id } = req.body;
  await pool.query(
    'UPDATE staff_appointments SET staff_id=$1, day_of_week=$2, period=$3, title=$4, notes=$5, room_id=$6 WHERE id=$7',
    [staff_id, day_of_week, period, title, notes, room_id, id]
  );
  res.json({ success: true });
}

// DELETE appointment
export async function deleteStaffAppointment(req: Request, res: Response) {
  const { id } = req.params;
  await pool.query('DELETE FROM staff_appointments WHERE id = $1', [id]);
  res.json({ success: true });
}