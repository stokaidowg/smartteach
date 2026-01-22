import { Request, Response } from 'express';
import { pool } from '../../db';

// =====================================================
// YEAR GROUPS
// =====================================================

export async function getAllYearGroups(req: Request, res: Response) {
  const { includeInactive } = req.query;
  
  try {
    let query = `
      SELECT yg.*,
        (SELECT COUNT(*) FROM pupils WHERE year_group_id = yg.id) as pupil_count
      FROM year_groups yg
    `;
    
    if (!includeInactive || includeInactive === 'false') {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY sort_order, name';
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function getYearGroupById(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM year_groups WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Year group not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function addYearGroup(req: Request, res: Response) {
  const {
    id,
    name,
    code,
    key_stage,
    sort_order,
    capacity,
    is_active,
    academic_year,
    notes
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO year_groups (
        id, name, code, key_stage, sort_order, capacity, is_active, academic_year, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        id || null, // Will use gen_random_uuid() if null
        name,
        code || null,
        key_stage || null,
        sort_order || 0,
        capacity || null,
        is_active !== undefined ? is_active : true,
        academic_year || null,
        notes || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Year group name or code already exists' });
    } else {
      res.status(500).json({ error: 'Database error', details: err });
    }
  }
}

export async function updateYearGroup(req: Request, res: Response) {
  const { id } = req.params;
  const {
    name,
    code,
    key_stage,
    sort_order,
    capacity,
    is_active,
    academic_year,
    notes
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE year_groups SET
        name = $1,
        code = $2,
        key_stage = $3,
        sort_order = $4,
        capacity = $5,
        is_active = $6,
        academic_year = $7,
        notes = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [name, code, key_stage, sort_order, capacity, is_active, academic_year, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Year group not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Year group name or code already exists' });
    } else {
      res.status(500).json({ error: 'Database error', details: err });
    }
  }
}

export async function deleteYearGroup(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    // Check if year group is in use
    const checkPupils = await pool.query(
      'SELECT COUNT(*) as count FROM pupils WHERE year_group_id = $1',
      [id]
    );
    
    const checkForms = await pool.query(
      'SELECT COUNT(*) as count FROM forms WHERE year_group_id = $1',
      [id]
    );
    
    const totalUsage = parseInt(checkPupils.rows[0].count) + parseInt(checkForms.rows[0].count);
    
    if (totalUsage > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete year group',
        message: `This year group is currently in use by ${totalUsage} record(s). Please reassign or remove those records first.`,
        usage_count: totalUsage
      });
    }
    
    const result = await pool.query(
      'DELETE FROM year_groups WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Year group not found' });
    }
    
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

// =====================================================
// HOUSES
// =====================================================

export async function getAllHouses(req: Request, res: Response) {
  const { includeInactive } = req.query;
  
  try {
    let query = `
      SELECT h.*,
        s.first_name as captain_first_name,
        s.last_name as captain_last_name,
        (SELECT COUNT(*) FROM pupils WHERE house_id = h.id) as pupil_count
      FROM houses h
      LEFT JOIN staff s ON h.house_captain_staff_id = s.id
    `;
    
    if (!includeInactive || includeInactive === 'false') {
      query += ' WHERE h.is_active = true';
    }
    
    query += ' ORDER BY h.name';
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function addHouse(req: Request, res: Response) {
  const {
    id,
    name,
    code,
    color,
    house_captain_staff_id,
    points,
    is_active,
    description
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO houses (
        id, name, code, color, house_captain_staff_id, points, is_active, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id || null,
        name,
        code || null,
        color || null,
        house_captain_staff_id || null,
        points || 0,
        is_active !== undefined ? is_active : true,
        description || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'House name or code already exists' });
    } else {
      res.status(500).json({ error: 'Database error', details: err });
    }
  }
}

export async function updateHouse(req: Request, res: Response) {
  const { id } = req.params;
  const {
    name,
    code,
    color,
    house_captain_staff_id,
    points,
    is_active,
    description
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE houses SET
        name = $1,
        code = $2,
        color = $3,
        house_captain_staff_id = $4,
        points = $5,
        is_active = $6,
        description = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [name, code, color, house_captain_staff_id, points, is_active, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'House name or code already exists' });
    } else {
      res.status(500).json({ error: 'Database error', details: err });
    }
  }
}

export async function deleteHouse(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    // Check if house is in use
    const checkPupils = await pool.query(
      'SELECT COUNT(*) as count FROM pupils WHERE house_id = $1',
      [id]
    );
    
    const totalUsage = parseInt(checkPupils.rows[0].count);
    
    if (totalUsage > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete house',
        message: `This house is currently in use by ${totalUsage} pupil(s). Please reassign or remove those pupils first.`,
        usage_count: totalUsage
      });
    }
    
    const result = await pool.query(
      'DELETE FROM houses WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

// =====================================================
// FORMS
// =====================================================

export async function getAllForms(req: Request, res: Response) {
  const { includeInactive, yearGroupId } = req.query;
  
  try {
    let query = `
      SELECT f.*,
        yg.name as year_group_name,
        s.first_name as tutor_first_name,
        s.last_name as tutor_last_name,
        r.room_code,
        (SELECT COUNT(*) FROM pupils WHERE form_id = f.id) as pupil_count
      FROM forms f
      LEFT JOIN year_groups yg ON f.year_group_id = yg.id
      LEFT JOIN staff s ON f.form_tutor_id = s.id
      LEFT JOIN rooms r ON f.room_id = r.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (!includeInactive || includeInactive === 'false') {
      query += ' AND f.is_active = true';
    }
    
    if (yearGroupId) {
      params.push(yearGroupId);
      query += ` AND f.year_group_id = $${params.length}`;
    }
    
    query += ' ORDER BY yg.sort_order, f.name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function addForm(req: Request, res: Response) {
  const {
    id,
    name,
    code,
    year_group_id,
    form_tutor_id,
    room_id,
    capacity,
    is_active,
    notes
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO forms (
        id, name, code, year_group_id, form_tutor_id, room_id, capacity, is_active, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        id || null,
        name,
        code || null,
        year_group_id || null,
        form_tutor_id || null,
        room_id || null,
        capacity || null,
        is_active !== undefined ? is_active : true,
        notes || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Form name or code already exists' });
    } else {
      res.status(500).json({ error: 'Database error', details: err });
    }
  }
}

export async function updateForm(req: Request, res: Response) {
  const { id } = req.params;
  const {
    name,
    code,
    year_group_id,
    form_tutor_id,
    room_id,
    capacity,
    is_active,
    notes
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE forms SET
        name = $1,
        code = $2,
        year_group_id = $3,
        form_tutor_id = $4,
        room_id = $5,
        capacity = $6,
        is_active = $7,
        notes = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [name, code, year_group_id, form_tutor_id, room_id, capacity, is_active, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Form name or code already exists' });
    } else {
      res.status(500).json({ error: 'Database error', details: err });
    }
  }
}

export async function deleteForm(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    // Check if form is in use
    const checkPupils = await pool.query(
      'SELECT COUNT(*) as count FROM pupils WHERE form_id = $1',
      [id]
    );
    
    const totalUsage = parseInt(checkPupils.rows[0].count);
    
    if (totalUsage > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete form',
        message: `This form is currently in use by ${totalUsage} pupil(s). Please reassign or remove those pupils first.`,
        usage_count: totalUsage
      });
    }
    
    const result = await pool.query(
      'DELETE FROM forms WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

// =====================================================
// DEPARTMENTS
// =====================================================

export async function getAllDepartments(req: Request, res: Response) {
  const { includeInactive } = req.query;
  
  try {
    let query = `
      SELECT d.*,
        s.first_name as hod_first_name,
        s.last_name as hod_last_name,
        (SELECT COUNT(*) FROM staff WHERE department_id = d.id) as staff_count
      FROM departments d
      LEFT JOIN staff s ON d.head_of_department_id = s.id
    `;
    
    if (!includeInactive || includeInactive === 'false') {
      query += ' WHERE d.is_active = true';
    }
    
    query += ' ORDER BY d.name';
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function addDepartment(req: Request, res: Response) {
  const {
    id,
    name,
    code,
    head_of_department_id,
    budget,
    is_active,
    description
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO departments (
        id, name, code, head_of_department_id, budget, is_active, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        id || null,
        name,
        code || null,
        head_of_department_id || null,
        budget || null,
        is_active !== undefined ? is_active : true,
        description || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Department name or code already exists' });
    } else {
      res.status(500).json({ error: 'Database error', details: err });
    }
  }
}

export async function updateDepartment(req: Request, res: Response) {
  const { id } = req.params;
  const {
    name,
    code,
    head_of_department_id,
    budget,
    is_active,
    description
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE departments SET
        name = $1,
        code = $2,
        head_of_department_id = $3,
        budget = $4,
        is_active = $5,
        description = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *`,
      [name, code, head_of_department_id, budget, is_active, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Department name or code already exists' });
    } else {
      res.status(500).json({ error: 'Database error', details: err });
    }
  }
}

export async function deleteDepartment(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    // Check if department is in use
    const checkStaff = await pool.query(
      'SELECT COUNT(*) as count FROM staff WHERE department_id = $1',
      [id]
    );
    
    const totalUsage = parseInt(checkStaff.rows[0].count);
    
    if (totalUsage > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department',
        message: `This department is currently in use by ${totalUsage} staff member(s). Please reassign or remove those staff first.`,
        usage_count: totalUsage
      });
    }
    
    const result = await pool.query(
      'DELETE FROM departments WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
