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

// Get all cover allocations (optionally filter by date/staff)
export async function getCoverAllocations(req: Request, res: Response) {
  const { date, staff_id } = req.query;
  let sql = `SELECT * FROM cover_allocations WHERE 1=1`;
  const params: any[] = [];
  if (date) { sql += ` AND date = $${params.length + 1}`; params.push(date); }
  if (staff_id) { sql += ` AND (absent_staff_id = $${params.length + 1} OR cover_staff_id = $${params.length + 1})`; params.push(staff_id); }
  sql += ' ORDER BY date DESC, created_at DESC';
  const result = await pool.query(sql, params);
  res.json(result.rows);
}

// Add a cover allocation
export async function addCoverAllocation(req: Request, res: Response) {
  const { timetable_id, absent_staff_id, cover_staff_id, date, notes } = req.body;
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO cover_allocations (id, timetable_id, absent_staff_id, cover_staff_id, date, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, timetable_id, absent_staff_id, cover_staff_id, date, notes]
  );
  res.status(201).json({ success: true, id });
}

// Delete a cover allocation
export async function deleteCoverAllocation(req: Request, res: Response) {
  const { id } = req.params;
  await pool.query('DELETE FROM cover_allocations WHERE id = $1', [id]);
  res.json({ success: true });
}

// POST /staff-absences
export async function addStaffAbsence(req: Request, res: Response) {
  const { staff_id, start_date, end_date, reason, notes } = req.body;
  const id = crypto.randomUUID();
  await pool.query(
    'INSERT INTO staff_absences (id, staff_id, start_date, end_date, reason, notes) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, staff_id, start_date, end_date, reason, notes]
  );
  res.status(201).json({ success: true, id });
}

// DELETE /staff-absences/:id
export async function deleteStaffAbsence(req: Request, res: Response) {
  const { id } = req.params;
  await pool.query('DELETE FROM staff_absences WHERE id = $1', [id]);
  res.json({ success: true });
}

// GET /staff-absences
export async function getStaffAbsences(req: Request, res: Response) {
  const result = await pool.query(
    `SELECT a.*, s.first_name, s.last_name FROM staff_absences a
     JOIN staff s ON a.staff_id = s.id
     ORDER BY start_date DESC`
  );
  res.json(result.rows);
}

// GET available cover staff for a given date and timetable period
export async function getAvailableCoverStaff(req: Request, res: Response) {
  const { date, timetable_id } = req.query;

  // Get the period and day_of_week for this timetable entry
  const { rows: timetableRows } = await pool.query(
    'SELECT day_of_week, period FROM timetable WHERE id = $1',
    [timetable_id]
  );
  if (timetableRows.length === 0) {
    return res.status(400).json({ error: 'Invalid timetable_id' });
  }
  const { day_of_week, period } = timetableRows[0];

  // Find available cover staff
  const result = await pool.query(`
    SELECT s.*
    FROM staff s
    WHERE s.is_cover_staff = true
      AND s.id NOT IN (
        SELECT t.teacher_id
        FROM timetable t
        WHERE t.day_of_week = $1 AND t.period = $2
      )
      AND s.id NOT IN (
        SELECT sa.staff_id
        FROM staff_appointments sa
        WHERE sa.day_of_week = $1 AND sa.period = $2
      )
      AND s.id NOT IN (
        SELECT ca.cover_staff_id
        FROM cover_allocations ca
        WHERE ca.date = $3 AND ca.timetable_id = $4
      )
      AND s.id NOT IN (
        SELECT sa.staff_id
        FROM staff_absences sa
        WHERE $3 BETWEEN sa.start_date AND sa.end_date
      )
  `, [day_of_week, period, date, timetable_id]);
  res.json(result.rows);
}