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

// Get registration for a set/timetable/date
export async function getRegistration(req: Request, res: Response) {
  const { setId, timetableId, date, pupilId } = req.query;
  let sql = `
    SELECT r.*, t.period
    FROM registration r
    LEFT JOIN timetable t ON r.timetable_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Restrict to staff's sets unless superuser
  if (req.user && !req.user.is_superuser) {
    sql += `
      AND r.set_id IN (
        SELECT set_id FROM set_teachers WHERE staff_id = $${params.length + 1}
      )
    `;
    params.push(req.user.staff_id);
  }

  if (setId) { sql += ' AND r.set_id = $' + (params.length + 1); params.push(setId); }
  if (timetableId) { sql += ' AND r.timetable_id = $' + (params.length + 1); params.push(timetableId); }
  if (date) { sql += ' AND r.date = $' + (params.length + 1); params.push(date); }
  if (pupilId) { sql += ' AND r.pupil_id = $' + (params.length + 1); params.push(pupilId); }
  sql += ' ORDER BY t.period';
  const result = await pool.query(sql, params);
  res.json(result.rows);
}

// Save/update registration
export async function saveRegistration(req: Request, res: Response) {
  // Convert blank strings to null for UUID fields
  const set_id = req.body.set_id === '' ? null : req.body.set_id;
  const timetable_id = req.body.timetable_id === '' ? null : req.body.timetable_id;
  const staff_id = req.body.staff_id === '' ? null : req.body.staff_id;
  const pupil_id = req.body.pupil_id === '' ? null : req.body.pupil_id;
  const date = req.body.date;
  const status = req.body.status;
  const notes = req.body.notes;
  const minutes_late = req.body.minutes_late === '' ? null : req.body.minutes_late;
  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO registration (id, set_id, timetable_id, date, staff_id, pupil_id, status, notes, minutes_late)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (set_id, timetable_id, date, pupil_id)
     DO UPDATE SET status = $7, notes = $8, minutes_late = $9`,
    [id, set_id, timetable_id, date, staff_id, pupil_id, status, notes, minutes_late]
  );
  res.json({ success: true });
}

// GET all codes
export async function getAllRegistrationCodes(req: Request, res: Response) {
  const result = await pool.query('SELECT * FROM registration_codes ORDER BY status, code');
  res.json(result.rows);
}

// POST (replace all codes)
export async function postRegistrationCodes(req: Request, res: Response) {
  const codes = req.body; // array of {status, code, description}
  await pool.query('DELETE FROM registration_codes');
  for (const c of codes) {
    await pool.query(
      'INSERT INTO registration_codes (status, code, description) VALUES ($1, $2, $3)',
      [c.status, c.code, c.description]
    );
  }
  res.json({ success: true });
}

export class RegistrationManagement {
    // Placeholder for registration logic
}