// server/routes/goals.js
// Goals management routes for forms

const express = require('express');
const router = express.Router();
const { canEditForm } = require('../middleware/validation');

// Initialize with pool from server.js
let pool;
const initializeRouter = (dbPool) => {
  pool = dbPool;
};

// ============================================
// GET /api/forms/:formId/goals - Get all goals for a form
// ============================================
router.get('/:formId/goals', async (req, res) => {
  try {
    const formId = parseInt(req.params.formId);
    const { role, id: userId } = req.user;

    // Verify form exists and user has permission to view
    const formCheck = await pool.query(
      'SELECT ministry_leader_id, status FROM ministry_forms WHERE id = $1',
      [formId]
    );

    if (formCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const form = formCheck.rows[0];

    // Check permissions
    if (role === 'ministry_leader' && form.ministry_leader_id !== userId) {
      return res.status(403).json({ error: 'You can only view goals for your own forms' });
    }

    // Try to select with SMART goal fields, fallback if columns don't exist
    let result;
    try {
      result = await pool.query(
        `SELECT 
          id,
          form_id,
          goal,
          goal_description,
          specific,
          measurable,
          achievable,
          relevant,
          time_bound,
          measure_target,
          due_date,
          created_at
         FROM goals 
         WHERE form_id = $1 
         ORDER BY created_at`,
        [formId]
      );
    } catch (dbError) {
      // If SMART goal columns don't exist, select with legacy format and add SMART fields
      if (dbError.code === '42703' || dbError.message?.includes('goal_description') || dbError.message?.includes('column') || dbError.message?.includes('does not exist')) {
        console.warn('SMART goal columns not found, using legacy format');
        try {
          result = await pool.query(
            `SELECT 
              id,
              form_id,
              goal,
              measure_target,
              due_date,
              created_at
             FROM goals 
             WHERE form_id = $1 
             ORDER BY created_at`,
            [formId]
          );
          // Add SMART fields to response for client compatibility
          result.rows = result.rows.map(row => ({
            ...row,
            goal_description: row.goal || null,
            specific: null,
            measurable: null,
            achievable: null,
            relevant: null,
            time_bound: null
          }));
        } catch (fallbackError) {
          console.error('Error fetching goals with legacy format:', fallbackError);
          result = { rows: [] };
        }
      } else {
        console.error('Error fetching goals:', dbError);
        result = { rows: [] };
      }
    }

    res.json(result.rows);

  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Server error fetching goals' });
  }
});

// ============================================
// POST /api/forms/:formId/goals - Create new goal
// ============================================
router.post('/:formId/goals', async (req, res) => {
  try {
    const formId = parseInt(req.params.formId);
    const { id: userId, role } = req.user;
    const { 
      goal,  // Legacy field
      measure_target,  // Legacy field
      due_date,  // Legacy field
      // SMART goal fields
      goal_description,
      specific,
      measurable,
      achievable,
      relevant,
      time_bound
    } = req.body;

    // Support both legacy format and SMART format
    const goalText = goal_description || goal;
    if (!goalText) {
      return res.status(400).json({ error: 'Goal description is required' });
    }

    // Check if user can edit this form
    const editCheck = await canEditForm(pool, userId, role, formId);
    if (!editCheck.allowed) {
      return res.status(403).json({ error: editCheck.reason });
    }

    // Try to insert with SMART goal fields, fallback to legacy format
    let result;
    try {
      result = await pool.query(
        `INSERT INTO goals (form_id, goal, goal_description, specific, measurable, achievable, relevant, time_bound, measure_target, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          formId, 
          goalText,  // Store in legacy 'goal' field for compatibility
          goal_description || goalText,
          specific || null,
          measurable || null,
          achievable || null,
          relevant || null,
          time_bound || null,
          measure_target || null,
          due_date || null
        ]
      );
    } catch (dbError) {
      // If SMART goal columns don't exist, insert with legacy format
      if (dbError.code === '42703') {
        result = await pool.query(
          `INSERT INTO goals (form_id, goal, measure_target, due_date)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [formId, goalText, measure_target || null, due_date || null]
        );
        // Add SMART fields to response for client compatibility
        result.rows[0].goal_description = goalText;
        result.rows[0].specific = null;
        result.rows[0].measurable = null;
        result.rows[0].achievable = null;
        result.rows[0].relevant = null;
        result.rows[0].time_bound = null;
      } else {
        throw dbError;
      }
    }

    await pool.query(
      'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [formId, userId, 'goal_created', `Created goal: ${goalText.substring(0, 50)}...`]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Server error creating goal' });
  }
});

// ============================================
// PUT /api/forms/:formId/goals/:id - Update goal
// ============================================
router.put('/:formId/goals/:id', async (req, res) => {
  try {
    const formId = parseInt(req.params.formId);
    const goalId = parseInt(req.params.id);
    const { id: userId, role } = req.user;
    const { 
      goal,  // Legacy field
      measure_target,  // Legacy field
      due_date,  // Legacy field
      // SMART goal fields
      goal_description,
      specific,
      measurable,
      achievable,
      relevant,
      time_bound
    } = req.body;

    // Support both legacy format and SMART format
    const goalText = goal_description || goal;
    if (!goalText) {
      return res.status(400).json({ error: 'Goal description is required' });
    }

    // Check if user can edit this form
    const editCheck = await canEditForm(pool, userId, role, formId);
    if (!editCheck.allowed) {
      return res.status(403).json({ error: editCheck.reason });
    }

    // Verify goal belongs to this form
    const goalCheck = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND form_id = $2',
      [goalId, formId]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Try to update with SMART goal fields, fallback to legacy format
    let result;
    try {
      result = await pool.query(
        `UPDATE goals 
         SET goal = $1, goal_description = $2, specific = $3, measurable = $4, 
             achievable = $5, relevant = $6, time_bound = $7, measure_target = $8, due_date = $9
         WHERE id = $10 AND form_id = $11
         RETURNING *`,
        [
          goalText,
          goal_description || goalText,
          specific || null,
          measurable || null,
          achievable || null,
          relevant || null,
          time_bound || null,
          measure_target || null,
          due_date || null,
          goalId,
          formId
        ]
      );
    } catch (dbError) {
      // If SMART goal columns don't exist, update with legacy format
      if (dbError.code === '42703') {
        result = await pool.query(
          `UPDATE goals 
           SET goal = $1, measure_target = $2, due_date = $3
           WHERE id = $4 AND form_id = $5
           RETURNING *`,
          [goalText, measure_target || null, due_date || null, goalId, formId]
        );
        // Add SMART fields to response for client compatibility
        result.rows[0].goal_description = goalText;
        result.rows[0].specific = specific || null;
        result.rows[0].measurable = measurable || null;
        result.rows[0].achievable = achievable || null;
        result.rows[0].relevant = relevant || null;
        result.rows[0].time_bound = time_bound || null;
      } else {
        throw dbError;
      }
    }

    await pool.query(
      'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [formId, userId, 'goal_updated', `Updated goal: ${goalText.substring(0, 50)}...`]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Server error updating goal' });
  }
});

// ============================================
// DELETE /api/forms/:formId/goals/:id - Delete goal
// ============================================
router.delete('/:formId/goals/:id', async (req, res) => {
  try {
    const formId = parseInt(req.params.formId);
    const goalId = parseInt(req.params.id);
    const { id: userId, role } = req.user;

    // Check if user can edit this form
    const editCheck = await canEditForm(pool, userId, role, formId);
    if (!editCheck.allowed) {
      return res.status(403).json({ error: editCheck.reason });
    }

    // Verify goal belongs to this form
    const goalCheck = await pool.query(
      'SELECT id, goal FROM goals WHERE id = $1 AND form_id = $2',
      [goalId, formId]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await pool.query(
      'DELETE FROM goals WHERE id = $1 AND form_id = $2',
      [goalId, formId]
    );

    await pool.query(
      'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [formId, userId, 'goal_deleted', `Deleted goal: ${goalCheck.rows[0].goal.substring(0, 50)}...`]
    );

    res.json({ message: 'Goal deleted successfully' });

  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Server error deleting goal' });
  }
});

module.exports = { router, initializeRouter };

