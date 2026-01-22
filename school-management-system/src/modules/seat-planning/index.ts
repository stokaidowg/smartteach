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

export class SeatPlanning {
    // Placeholder for seat planning logic
}

// Get seat plan for a set in a room
export async function getSeatPlan(req: Request, res: Response) {
  const { setId, roomId } = req.query;
  const result = await pool.query(
    'SELECT seat_row, seat_col, pupil_id FROM seat_plans WHERE set_id = $1 AND room_id = $2',
    [setId, roomId]
  );
  res.json(result.rows);
}

// Save/update seat plan for a set in a room
export async function saveSeatPlan(req: Request, res: Response) {
  const { setId, roomId, seats } = req.body; // seats: [{row, col, pupil_id}]
  // Remove existing plan
  await pool.query('DELETE FROM seat_plans WHERE set_id = $1 AND room_id = $2', [setId, roomId]);
  // Insert new plan
  for (const seat of seats) {
    if (seat.pupil_id) {
      await pool.query(
        'INSERT INTO seat_plans (id, set_id, room_id, seat_row, seat_col, pupil_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [crypto.randomUUID(), setId, roomId, seat.row, seat.col, seat.pupil_id]
      );
    }
  }
  res.json({ success: true });
}