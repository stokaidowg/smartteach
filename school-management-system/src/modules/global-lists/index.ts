import { Request, Response } from 'express';
import { pool } from '../../db';

// =====================================================
// GLOBAL LIST CATEGORIES
// =====================================================

export async function getAllCategories(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM global_list_items WHERE category_id = c.id AND is_active = true) as item_count
      FROM global_list_categories c
      WHERE is_active = true
      ORDER BY sort_order, category_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function getCategoryByKey(req: Request, res: Response) {
  const { key } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM global_list_categories WHERE category_key = $1',
      [key]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

// =====================================================
// GLOBAL LIST ITEMS
// =====================================================

export async function getItemsByCategory(req: Request, res: Response) {
  const { categoryKey } = req.params;
  const { includeInactive } = req.query;
  
  try {
    let query = `
      SELECT gli.* 
      FROM global_list_items gli
      JOIN global_list_categories glc ON gli.category_id = glc.id
      WHERE glc.category_key = $1
    `;
    
    if (!includeInactive || includeInactive === 'false') {
      query += ' AND gli.is_active = true';
    }
    
    query += ' ORDER BY gli.sort_order, gli.item_value';
    
    const result = await pool.query(query, [categoryKey]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function getAllItems(req: Request, res: Response) {
  const { includeInactive } = req.query;
  
  try {
    let query = `
      SELECT gli.*, glc.category_key, glc.category_name
      FROM global_list_items gli
      JOIN global_list_categories glc ON gli.category_id = glc.id
    `;
    
    if (!includeInactive || includeInactive === 'false') {
      query += ' WHERE gli.is_active = true';
    }
    
    query += ' ORDER BY glc.sort_order, gli.sort_order, gli.item_value';
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function addItem(req: Request, res: Response) {
  const {
    category_id,
    item_value,
    item_code,
    description,
    is_active,
    is_default,
    sort_order,
    metadata
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO global_list_items (
        category_id, item_value, item_code, description, is_active, is_default, sort_order, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        category_id,
        item_value,
        item_code || null,
        description || null,
        is_active !== undefined ? is_active : true,
        is_default || false,
        sort_order || 0,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Item already exists in this category' });
    } else {
      res.status(500).json({ error: 'Database error', details: err });
    }
  }
}

export async function updateItem(req: Request, res: Response) {
  const { id } = req.params;
  const {
    item_value,
    item_code,
    description,
    is_active,
    is_default,
    sort_order,
    metadata
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE global_list_items SET
        item_value = $1,
        item_code = $2,
        description = $3,
        is_active = $4,
        is_default = $5,
        sort_order = $6,
        metadata = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [
        item_value,
        item_code || null,
        description || null,
        is_active,
        is_default,
        sort_order,
        metadata ? JSON.stringify(metadata) : null,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Item value already exists in this category' });
    } else {
      res.status(500).json({ error: 'Database error', details: err });
    }
  }
}

export async function deleteItem(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    // Check if item is in use
    const checkPupils = await pool.query(`
      SELECT COUNT(*) as count FROM pupils 
      WHERE status_id = $1 OR gender_id = $1 OR nationality_id = $1 
         OR religion_id = $1 OR ethnicity_id = $1 OR sen_status_id = $1
    `, [id]);
    
    const checkStaff = await pool.query(`
      SELECT COUNT(*) as count FROM staff
      WHERE gender_id = $1 OR nationality_id = $1 OR religion_id = $1
         OR employment_type_id = $1 OR status_id = $1
    `, [id]);
    
    const totalUsage = parseInt(checkPupils.rows[0].count) + parseInt(checkStaff.rows[0].count);
    
    if (totalUsage > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete item',
        message: `This item is currently in use by ${totalUsage} record(s). Please reassign or remove those records first.`,
        usage_count: totalUsage
      });
    }
    
    const result = await pool.query(
      'DELETE FROM global_list_items WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

// Soft delete (set inactive)
export async function deactivateItem(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `UPDATE global_list_items SET 
        is_active = false, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

export async function reactivateItem(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `UPDATE global_list_items SET 
        is_active = true, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}

// Bulk update sort order
export async function updateSortOrder(req: Request, res: Response) {
  const { items } = req.body; // Array of {id, sort_order}
  
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const item of items) {
        await client.query(
          'UPDATE global_list_items SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.sort_order, item.id]
        );
      }
      
      await client.query('COMMIT');
      res.json({ success: true, updated_count: items.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
