import { Request, Response } from 'express';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'school_user',
  host: 'localhost',
  database: 'smartTeach',
  password: '123',
  port: 5432,
});
export async function getAllSets(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM sets');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sets' });
  }
}

// SUBJECTS
export async function getAllSubjects(req: Request, res: Response) {
  const result = await pool.query('SELECT * FROM subjects ORDER BY name');
  res.json(result.rows);
}
export async function addSubject(req: Request, res: Response) {
  const { id, name } = req.body;
  await pool.query('INSERT INTO subjects (id, name) VALUES ($1, $2)', [id, name]);
  res.status(201).json({ success: true });
}

// SETS
export async function getSetsBySubject(req: Request, res: Response) {
  const { subjectId } = req.query;
  const result = await pool.query('SELECT * FROM sets WHERE subject_id = $1', [subjectId]);
  res.json(result.rows);
}
export async function addSet(req: Request, res: Response) {
  const { id, subject_id, name, room_id } = req.body;
  await pool.query(
    'INSERT INTO sets (id, subject_id, name, room_id) VALUES ($1, $2, $3, $4)',
    [id, subject_id, name, room_id || null]
  );
  res.status(201).json({ success: true });
}
export async function editSet(req: Request, res: Response) {
  const { id } = req.params;
  const { name, room_id } = req.body;
  await pool.query(
    'UPDATE sets SET name = $1, room_id = $2 WHERE id = $3',
    [name, room_id || null, id]
  );
  res.json({ success: true });
}
export async function deleteSet(req: Request, res: Response) {
  const { id } = req.params;
  await pool.query('DELETE FROM sets WHERE id = $1', [id]);
  res.json({ success: true });
}
export async function assignRoomToSet(req: Request, res: Response) {
  const { setId, roomId } = req.body;
  await pool.query('UPDATE sets SET room_id = $1 WHERE id = $2', [roomId, setId]);
  res.json({ success: true });
}

// SET TEACHERS
export async function getSetTeachers(req: Request, res: Response) {
  const { setId } = req.query;
  const result = await pool.query('SELECT staff_id, is_primary FROM set_teachers WHERE set_id = $1', [setId]);
  res.json(result.rows);
}
export async function addSetTeacher(req: Request, res: Response) {
  const { set_id, staff_id, is_primary } = req.body;
  await pool.query(
    `INSERT INTO set_teachers (set_id, staff_id, is_primary)
     VALUES ($1, $2, $3)
     ON CONFLICT (set_id, staff_id) DO UPDATE SET is_primary = $3`,
    [set_id, staff_id, is_primary]
  );
  res.status(201).json({ success: true });
}
export async function deleteSetTeacher(req: Request, res: Response) {
  const { setId, staffId } = req.query;
  await pool.query('DELETE FROM set_teachers WHERE set_id = $1 AND staff_id = $2', [setId, staffId]);
  res.json({ success: true });
}

// SET PUPILS
export async function getSetPupils(req: Request, res: Response) {
  const { setId } = req.query;
  const result = await pool.query('SELECT pupil_id FROM set_pupils WHERE set_id = $1', [setId]);
  res.json(result.rows);
}
export async function addSetPupil(req: Request, res: Response) {
  const { set_id, pupil_id } = req.body;
  await pool.query(
    'INSERT INTO set_pupils (set_id, pupil_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [set_id, pupil_id]
  );
  res.status(201).json({ success: true });
}
export async function deleteSetPupil(req: Request, res: Response) {
  const { setId, pupilId } = req.query;
  await pool.query('DELETE FROM set_pupils WHERE set_id = $1 AND pupil_id = $2', [setId, pupilId]);
  res.json({ success: true });
}

// COPY SET PUPILS
export async function copySetPupils(req: Request, res: Response) {
  const { fromSetId, toSetId } = req.body;
  // Get all pupils from source set
  const { rows } = await pool.query('SELECT pupil_id FROM set_pupils WHERE set_id = $1', [fromSetId]);
  if (rows.length === 0) return res.json({ success: true, copied: 0 });
  // Insert pupils into target set, ignore duplicates
  const values = rows.map(r => `('${toSetId}','${r.pupil_id}')`).join(',');
  await pool.query(
    `INSERT INTO set_pupils (set_id, pupil_id) VALUES ${values} ON CONFLICT DO NOTHING`
  );
  res.json({ success: true, copied: rows.length });
}

// LINKED SETS
export async function linkSets(req: Request, res: Response) {
  const { set_id, linked_set_id } = req.body;
  await pool.query(
    'INSERT INTO set_links (set_id, linked_set_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [set_id, linked_set_id]
  );
  res.json({ success: true });
}

export async function getSets(req: Request, res: Response) {
  // Example: req.user.is_superuser and req.user.staff_id are set by your auth middleware
  if (req.user && !req.user.is_superuser) {
    // Only return sets where this staff is allocated (primary or secondary)
    const result = await pool.query(
      `SELECT s.* FROM sets s
       JOIN set_teachers st ON s.id = st.set_id
       WHERE st.staff_id = $1`,
      [req.user.staff_id]
    );
    res.json(result.rows);
  } else {
    // Superuser: return all sets
    const result = await pool.query('SELECT * FROM sets');
    res.json(result.rows);
  }
}

export async function getSetsForPeriod(req: Request, res: Response) {
  const { day_of_week, period } = req.query;
  if (!req.user) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  let result;
  if (req.user.is_superuser) {
    // Superuser: show all sets for this period
    result = await pool.query(
      `SELECT s.*
       FROM sets s
       JOIN timetable t ON s.id = t.set_id
       WHERE t.day_of_week = $1
         AND t.period = $2`,
      [day_of_week, period]
    );
  } else {
    // Teacher: only their sets for this period
    result = await pool.query(
      `SELECT s.*
       FROM sets s
       JOIN set_teachers st ON s.id = st.set_id
       JOIN timetable t ON s.id = t.set_id
       WHERE st.staff_id = $1
         AND t.day_of_week = $2
         AND t.period = $3`,
      [req.user.staff_id, day_of_week, period]
    );
  }
  res.json(result.rows);
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        staff_id: string;
        is_superuser: boolean;
        // add any other properties you use
      };
    }
  }
}