// server/routes/events.js
// Events management routes for forms

const express = require('express');
const router = express.Router();
const { canEditForm } = require('../middleware/validation');

// Initialize with pool from server.js
let pool;
const initializeRouter = (dbPool) => {
  pool = dbPool;
};

// ============================================
// GET /api/forms/:formId/events - Get all events for a form
// ============================================
router.get('/:formId/events', async (req, res) => {
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
      return res.status(403).json({ error: 'You can only view events for your own forms' });
    }

    // Try to select with expected_attendance, fallback if column doesn't exist
    let result;
    try {
      result = await pool.query(
        `SELECT 
          id,
          form_id,
          event_date,
          event_name,
          event_type,
          purpose,
          description,
          estimated_expenses,
          estimated_expenses as budget_amount,
          expected_attendance,
          notes,
          created_at
         FROM events 
         WHERE form_id = $1 
         ORDER BY event_date`,
        [formId]
      );
    } catch (dbError) {
      // If expected_attendance column doesn't exist, select without it
      if (dbError.code === '42703' || dbError.message.includes('expected_attendance')) {
        result = await pool.query(
          `SELECT 
            id,
            form_id,
            event_date,
            event_name,
            event_type,
            purpose,
            description,
            estimated_expenses,
            estimated_expenses as budget_amount,
            NULL as expected_attendance,
            notes,
            created_at
           FROM events 
           WHERE form_id = $1 
           ORDER BY event_date`,
          [formId]
        );
      } else {
        throw dbError;
      }
    }

    res.json(result.rows);

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// ============================================
// POST /api/forms/:formId/events - Create new event
// ============================================
router.post('/:formId/events', async (req, res) => {
  try {
    const formId = parseInt(req.params.formId);
    const { id: userId, role } = req.user;
    const { 
      event_date, 
      event_name, 
      event_type, 
      purpose, 
      description, 
      estimated_expenses, 
      budget_amount,  // Support both field names
      expected_attendance,
      notes 
    } = req.body;

    // Check if user can edit this form
    const editCheck = await canEditForm(pool, userId, role, formId);
    if (!editCheck.allowed) {
      return res.status(403).json({ error: editCheck.reason });
    }

    // Use budget_amount if provided, otherwise use estimated_expenses
    const budgetValue = budget_amount !== undefined ? parseFloat(budget_amount) || 0 : (parseFloat(estimated_expenses) || 0);
    
    // Convert expected_attendance to integer if provided
    const attendanceValue = expected_attendance !== undefined && expected_attendance !== null && expected_attendance !== '' 
      ? parseInt(expected_attendance) 
      : null;

    // Try to insert with expected_attendance, fallback if column doesn't exist
    let result;
    try {
      result = await pool.query(
        `INSERT INTO events (form_id, event_date, event_name, event_type, purpose, description, estimated_expenses, expected_attendance, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING 
           id,
           form_id,
           event_date,
           event_name,
           event_type,
           purpose,
           description,
           estimated_expenses,
           estimated_expenses as budget_amount,
           expected_attendance,
           notes,
           created_at`,
        [
          formId, 
          event_date || null, 
          event_name || null, 
          event_type || null, 
          purpose || null, 
          description || null, 
          budgetValue, 
          attendanceValue,
          notes || null
        ]
      );
    } catch (dbError) {
      // If expected_attendance column doesn't exist, insert without it
      if (dbError.code === '42703' || dbError.message.includes('expected_attendance')) {
        console.warn('expected_attendance column not found, inserting without it');
        result = await pool.query(
          `INSERT INTO events (form_id, event_date, event_name, event_type, purpose, description, estimated_expenses, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING 
             id,
             form_id,
             event_date,
             event_name,
             event_type,
             purpose,
             description,
             estimated_expenses,
             estimated_expenses as budget_amount,
             NULL as expected_attendance,
             notes,
             created_at`,
          [
            formId, 
            event_date || null, 
            event_name || null, 
            event_type || null, 
            purpose || null, 
            description || null, 
            budgetValue, 
            notes || null
          ]
        );
      } else {
        throw dbError;
      }
    }

    await pool.query(
      'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [formId, userId, 'event_created', `Created event: ${event_name || 'Untitled'}`]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Server error creating event' });
  }
});

// ============================================
// PUT /api/forms/:formId/events/:id - Update event
// ============================================
router.put('/:formId/events/:id', async (req, res) => {
  try {
    const formId = parseInt(req.params.formId);
    const eventId = parseInt(req.params.id);
    const { id: userId, role } = req.user;
    const { 
      event_date, 
      event_name, 
      event_type, 
      purpose, 
      description, 
      estimated_expenses, 
      budget_amount,  // Support both field names
      expected_attendance,
      notes 
    } = req.body;

    // Check if user can edit this form
    const editCheck = await canEditForm(pool, userId, role, formId);
    if (!editCheck.allowed) {
      return res.status(403).json({ error: editCheck.reason });
    }

    // Verify event belongs to this form
    const eventCheck = await pool.query(
      'SELECT id FROM events WHERE id = $1 AND form_id = $2',
      [eventId, formId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Use budget_amount if provided, otherwise use estimated_expenses
    const budgetValue = budget_amount !== undefined ? parseFloat(budget_amount) || 0 : (parseFloat(estimated_expenses) || 0);
    
    // Convert expected_attendance to integer if provided
    const attendanceValue = expected_attendance !== undefined && expected_attendance !== null && expected_attendance !== '' 
      ? parseInt(expected_attendance) 
      : null;

    // Try to update with expected_attendance, fallback if column doesn't exist
    let result;
    try {
      result = await pool.query(
        `UPDATE events 
         SET event_date = $1, event_name = $2, event_type = $3, purpose = $4, 
             description = $5, estimated_expenses = $6, expected_attendance = $7, notes = $8
         WHERE id = $9 AND form_id = $10
         RETURNING 
           id,
           form_id,
           event_date,
           event_name,
           event_type,
           purpose,
           description,
           estimated_expenses,
           estimated_expenses as budget_amount,
           expected_attendance,
           notes,
           created_at`,
        [
          event_date || null, 
          event_name || null, 
          event_type || null, 
          purpose || null, 
          description || null, 
          budgetValue, 
          attendanceValue,
          notes || null, 
          eventId, 
          formId
        ]
      );
    } catch (dbError) {
      // If expected_attendance column doesn't exist, update without it
      if (dbError.code === '42703' || dbError.message.includes('expected_attendance')) {
        console.warn('expected_attendance column not found, updating without it');
        result = await pool.query(
          `UPDATE events 
           SET event_date = $1, event_name = $2, event_type = $3, purpose = $4, 
               description = $5, estimated_expenses = $6, notes = $7
           WHERE id = $8 AND form_id = $9
           RETURNING 
             id,
             form_id,
             event_date,
             event_name,
             event_type,
             purpose,
             description,
             estimated_expenses,
             estimated_expenses as budget_amount,
             NULL as expected_attendance,
             notes,
             created_at`,
          [
            event_date || null, 
            event_name || null, 
            event_type || null, 
            purpose || null, 
            description || null, 
            budgetValue, 
            notes || null, 
            eventId, 
            formId
          ]
        );
      } else {
        throw dbError;
      }
    }

    await pool.query(
      'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [formId, userId, 'event_updated', `Updated event: ${event_name || 'Untitled'}`]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Server error updating event' });
  }
});

// ============================================
// DELETE /api/forms/:formId/events/:id - Delete event
// ============================================
router.delete('/:formId/events/:id', async (req, res) => {
  try {
    const formId = parseInt(req.params.formId);
    const eventId = parseInt(req.params.id);
    const { id: userId, role } = req.user;

    // Check if user can edit this form
    const editCheck = await canEditForm(pool, userId, role, formId);
    if (!editCheck.allowed) {
      return res.status(403).json({ error: editCheck.reason });
    }

    // Verify event belongs to this form
    const eventCheck = await pool.query(
      'SELECT id, event_name FROM events WHERE id = $1 AND form_id = $2',
      [eventId, formId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await pool.query(
      'DELETE FROM events WHERE id = $1 AND form_id = $2',
      [eventId, formId]
    );

    await pool.query(
      'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [formId, userId, 'event_deleted', `Deleted event: ${eventCheck.rows[0].event_name || 'Untitled'}`]
    );

    res.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Server error deleting event' });
  }
});

module.exports = { router, initializeRouter };

