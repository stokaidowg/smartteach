import { Request, Response } from 'express';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'school_user',
  host: 'localhost',
  database: 'smartTeach',
  password: '123',
  port: 5432,
});

// BUILDINGS

export async function getAllBuildings(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM buildings ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function addBuilding(req: Request, res: Response) {
  const { id, name } = req.body;
  try {
    await pool.query('INSERT INTO buildings (id, name) VALUES ($1, $2)', [id, name]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function deleteBuilding(req: Request, res: Response) {
  try {
    await pool.query('DELETE FROM buildings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

// ROOMS

export async function getRoomsByBuilding(req: Request, res: Response) {
  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE building_id = $1 ORDER BY room_code',
      [req.params.buildingId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function addRoom(req: Request, res: Response) {
  const {
    id, building_id, room_code, room_name,
    is_teaching_room, is_cover_room, capacity, notes
  } = req.body;
  try {
    await pool.query(
      `INSERT INTO rooms (
        id, building_id, room_code, room_name, is_teaching_room, is_cover_room, capacity, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, building_id, room_code, room_name, is_teaching_room, is_cover_room, capacity, notes]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function updateRoom(req: Request, res: Response) {
  const {
    id, building_id, room_code, room_name,
    is_teaching_room, is_cover_room, capacity, notes
  } = req.body;
  try {
    await pool.query(
      `UPDATE rooms SET
        building_id=$2, room_code=$3, room_name=$4, is_teaching_room=$5, is_cover_room=$6, capacity=$7, notes=$8
      WHERE id=$1`,
      [id, building_id, room_code, room_name, is_teaching_room, is_cover_room, capacity, notes]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function deleteRoom(req: Request, res: Response) {
  try {
    await pool.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function getTeachingRooms(req: Request, res: Response) {
  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE is_teaching_room = true ORDER BY room_code'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export class RoomManagement {
    // Placeholder for room management logic
}