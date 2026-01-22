import { Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: 'school_user',
  host: 'localhost',
  database: 'smartTeach',
  password: '123',
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export async function loginUser(req: Request, res: Response) {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        staff_id: user.staff_id,
        is_superuser: user.is_superuser,
        display_name: user.display_name,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        staff_id: user.staff_id,
        is_superuser: user.is_superuser,
        display_name: user.display_name,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getUserPermissions(req: Request, res: Response) {
  const userId = req.params.id;
  const result = await pool.query(
    'SELECT module, can_view, can_edit FROM permissions WHERE user_id = $1',
    [userId]
  );
  res.json(result.rows);
}

export async function getAllUsers(req: Request, res: Response) {
  const result = await pool.query('SELECT id, username, display_name, email, is_superuser, staff_id FROM users');
  res.json(result.rows);
}

export async function createUser(req: Request, res: Response) {
  const { username, password, display_name, email, is_superuser, staff_id } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const staffId = !staff_id ? null : staff_id;

  // List of modules to create permissions for
  const MODULES = [
    'PupilManager',
    'StaffManager',
    'RegistrationManager',
    'RoomManager',
    'SeatPlanning',
    'TimetableManager',
    'TeachingManager',
    'ControlPanel'
  ];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      'INSERT INTO users (username, password_hash, display_name, email, is_superuser, staff_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, display_name, email, is_superuser, staff_id',
      [username, hash, display_name, email, is_superuser, staffId]
    );
    const user = userResult.rows[0];

    // Insert default permissions for all modules
    for (const module of MODULES) {
      await client.query(
        'INSERT INTO permissions (user_id, module, can_view, can_edit) VALUES ($1, $2, $3, $4)',
        [user.id, module, false, false]
      );
    }

    await client.query('COMMIT');
    res.json(user);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { display_name, email, is_superuser } = req.body;
  const result = await pool.query(
    'UPDATE users SET display_name = $1, email = $2, is_superuser = $3 WHERE id = $4 RETURNING id, username, display_name, email, is_superuser, staff_id',
    [display_name, email, is_superuser, id]
  );
  res.json(result.rows[0]);
}

export async function getStaffWithoutUser(req: Request, res: Response) {
  const result = await pool.query(`
    SELECT id, first_name, last_name, preferred_name, job_title, department
    FROM staff
    WHERE id NOT IN (SELECT staff_id FROM users WHERE staff_id IS NOT NULL)
    ORDER BY last_name, first_name
  `);
  res.json(result.rows);
}

// Get all permissions for all users (for admin panel)
export async function getAllPermissions(req: Request, res: Response) {
  const result = await pool.query(`
    SELECT p.id, p.user_id, u.username, p.module, p.can_view, p.can_edit
    FROM permissions p
    JOIN users u ON p.user_id = u.id
    ORDER BY u.username, p.module
  `);
  res.json(result.rows);
}

// Update a permission row
export async function updatePermission(req: Request, res: Response) {
  const { id } = req.params;
  const { can_view, can_edit } = req.body;
  const result = await pool.query(
    'UPDATE permissions SET can_view = $1, can_edit = $2 WHERE id = $3 RETURNING *',
    [can_view, can_edit, id]
  );
  res.json(result.rows[0]);
}

// Get all users with their permissions (for user-centric permissions applet)
export async function getUsersWithPermissions(req: Request, res: Response) {
  const result = await pool.query(`
    SELECT u.id as user_id, u.username, u.display_name, p.id as permission_id, p.module, p.can_view, p.can_edit
    FROM users u
    LEFT JOIN permissions p ON u.id = p.user_id
    ORDER BY u.username, p.module
  `);

  type UserWithPermissions = {
    user_id: number;
    username: string;
    display_name: string;
    permissions: {
      id: number;
      module: string;
      can_view: boolean;
      can_edit: boolean;
    }[];
  };
  const users: { [user_id: number]: UserWithPermissions } = {};
  for (const row of result.rows) {
    if (!users[row.user_id]) {
      users[row.user_id] = {
        user_id: row.user_id,
        username: row.username,
        display_name: row.display_name,
        permissions: [],
      };
    }
    if (row.permission_id) {
      users[row.user_id].permissions.push({
        id: row.permission_id,
        module: row.module,
        can_view: row.can_view,
        can_edit: row.can_edit,
      });
    }
  }
  res.json(Object.values(users));
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Delete permissions first (to avoid foreign key constraint errors)
    await client.query('DELETE FROM permissions WHERE user_id = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}

export async function getPermissions(req: Request, res: Response) {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  const result = await pool.query(
    'SELECT * FROM permissions WHERE user_id = $1',
    [user_id]
  );
  res.json(result.rows);
}