// server/routes/admin.js
// Admin management routes for ministries and event types

const express = require('express');
const router = express.Router();

// Initialize with pool from server.js
let pool;
const initializeRouter = (dbPool) => {
  pool = dbPool;
};

// ============================================
// ADMIN STATISTICS
// ============================================

// GET /api/admin/stats - Get system statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total forms
    const formsResult = await pool.query('SELECT COUNT(*) as count FROM ministry_forms');
    const totalForms = parseInt(formsResult.rows[0].count);

    // Get pending forms
    const pendingResult = await pool.query(
      "SELECT COUNT(*) as count FROM ministry_forms WHERE status IN ('pending_pillar', 'pending_pastor')"
    );
    const pendingForms = parseInt(pendingResult.rows[0].count);

    // Get approved forms
    const approvedResult = await pool.query(
      "SELECT COUNT(*) as count FROM ministry_forms WHERE status = 'approved'"
    );
    const approvedForms = parseInt(approvedResult.rows[0].count);

    // Get total budget (sum from section7 total_budget)
    const budgetResult = await pool.query(`
      SELECT 
        COALESCE(SUM((sections->'section7'->>'total_budget')::numeric), 0) as total
      FROM ministry_forms
      WHERE status = 'approved'
        AND sections->'section7'->>'total_budget' IS NOT NULL
    `);
    const totalBudget = parseFloat(budgetResult.rows[0].total || 0);

    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Get total ministries
    const ministriesResult = await pool.query('SELECT COUNT(*) as count FROM ministries');
    const totalMinistries = parseInt(ministriesResult.rows[0].count);

    // Get active ministries
    const activeMinistriesResult = await pool.query(
      'SELECT COUNT(*) as count FROM ministries WHERE active = true'
    );
    const activeMinistries = parseInt(activeMinistriesResult.rows[0].count);

    // Get total event types
    const eventTypesResult = await pool.query('SELECT COUNT(*) as count FROM event_types');
    const totalEventTypes = parseInt(eventTypesResult.rows[0].count);

    // Get active users
    const activeUsersResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE active = true'
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].count);

    // Get recent activity from audit log
    const activityResult = await pool.query(`
      SELECT 
        al.details as description,
        u.name as user,
        al.created_at,
        CASE 
          WHEN al.action LIKE '%approve%' THEN 'approval'
          WHEN al.action LIKE '%submit%' THEN 'submission'
          WHEN al.action LIKE '%reject%' THEN 'rejection'
          ELSE 'other'
        END as type
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action IN ('form_submit', 'form_approve', 'form_reject')
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    res.json({
      totalForms,
      pendingForms,
      approvedForms,
      totalBudget,
      totalUsers,
      totalMinistries,
      activeMinistries,
      totalEventTypes,
      activeUsers,
      recentActivity: activityResult.rows
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
});

// ============================================
// MINISTRIES MANAGEMENT
// ============================================

// GET /api/admin/ministries - List all ministries
router.get('/ministries', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        m.id,
        m.name,
        m.pillar_id,
        m.description,
        m.active,
        m.created_at,
        m.updated_at,
        u.name as pillar_name,
        u.email as pillar_email
      FROM ministries m
      LEFT JOIN users u ON m.pillar_id = u.id
      ORDER BY m.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get ministries error:', error);
    res.status(500).json({ error: 'Server error fetching ministries' });
  }
});

// POST /api/admin/ministries - Create new ministry
router.post('/ministries', async (req, res) => {
  try {
    const { name, pillar_id, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Ministry name is required' });
    }

    // Verify pillar exists
    if (pillar_id) {
      const pillarCheck = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'pillar'",
        [pillar_id]
      );
      if (pillarCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid pillar ID' });
      }
    }

    const result = await pool.query(
      `INSERT INTO ministries (name, pillar_id, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), pillar_id || null, description || null]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'ministry_created', `Created ministry: ${name}`]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Ministry name already exists' });
    }
    console.error('Create ministry error:', error);
    res.status(500).json({ error: 'Server error creating ministry' });
  }
});

// PUT /api/admin/ministries/:id - Update ministry
router.put('/ministries/:id', async (req, res) => {
  try {
    const ministryId = parseInt(req.params.id);
    const { name, pillar_id, description, active } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Ministry name is required' });
    }

    // Verify pillar exists if provided
    if (pillar_id) {
      const pillarCheck = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'pillar'",
        [pillar_id]
      );
      if (pillarCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid pillar ID' });
      }
    }

    const result = await pool.query(
      `UPDATE ministries 
       SET name = $1,
           pillar_id = $2,
           description = $3,
           active = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        name.trim(),
        pillar_id || null,
        description || null,
        active !== undefined ? active : true,
        ministryId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ministry not found' });
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'ministry_updated', `Updated ministry: ${name}`]
    );

    res.json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ministry name already exists' });
    }
    console.error('Update ministry error:', error);
    res.status(500).json({ error: 'Server error updating ministry' });
  }
});

// DELETE /api/admin/ministries/:id - Delete ministry
router.delete('/ministries/:id', async (req, res) => {
  try {
    const ministryId = parseInt(req.params.id);

    // Check if any forms use this ministry
    const formsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM ministry_forms WHERE ministry_id = $1',
      [ministryId]
    );

    if (parseInt(formsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete ministry with existing forms. Deactivate it instead.' 
      });
    }

    const result = await pool.query(
      'DELETE FROM ministries WHERE id = $1 RETURNING name',
      [ministryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ministry not found' });
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'ministry_deleted', `Deleted ministry: ${result.rows[0].name}`]
    );

    res.json({ message: 'Ministry deleted successfully' });

  } catch (error) {
    console.error('Delete ministry error:', error);
    res.status(500).json({ error: 'Server error deleting ministry' });
  }
});

// ============================================
// EVENT TYPES MANAGEMENT
// ============================================

// GET /api/admin/event-types - List all event types
router.get('/event-types', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM event_types ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get event types error:', error);
    res.status(500).json({ error: 'Server error fetching event types' });
  }
});

// POST /api/admin/event-types - Create new event type
router.post('/event-types', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Event type name is required' });
    }

    const result = await pool.query(
      `INSERT INTO event_types (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name.trim(), description || null]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'event_type_created', `Created event type: ${name}`]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Event type already exists' });
    }
    console.error('Create event type error:', error);
    res.status(500).json({ error: 'Server error creating event type' });
  }
});

// PUT /api/admin/event-types/:id - Update event type
router.put('/event-types/:id', async (req, res) => {
  try {
    const eventTypeId = parseInt(req.params.id);
    const { name, description, active } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Event type name is required' });
    }

    const result = await pool.query(
      `UPDATE event_types 
       SET name = $1,
           description = $2,
           active = $3
       WHERE id = $4
       RETURNING *`,
      [
        name.trim(),
        description || null,
        active !== undefined ? active : true,
        eventTypeId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'event_type_updated', `Updated event type: ${name}`]
    );

    res.json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Event type name already exists' });
    }
    console.error('Update event type error:', error);
    res.status(500).json({ error: 'Server error updating event type' });
  }
});

// DELETE /api/admin/event-types/:id - Delete event type
router.delete('/event-types/:id', async (req, res) => {
  try {
    const eventTypeId = parseInt(req.params.id);

    // Check if any events use this type
    const eventsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM events WHERE event_type = (SELECT name FROM event_types WHERE id = $1)',
      [eventTypeId]
    );

    if (parseInt(eventsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete event type in use. Deactivate it instead.' 
      });
    }

    const result = await pool.query(
      'DELETE FROM event_types WHERE id = $1 RETURNING name',
      [eventTypeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'event_type_deleted', `Deleted event type: ${result.rows[0].name}`]
    );

    res.json({ message: 'Event type deleted successfully' });

  } catch (error) {
    console.error('Delete event type error:', error);
    res.status(500).json({ error: 'Server error deleting event type' });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name as full_name, email, 
              CASE WHEN role = 'ministry_leader' THEN 'ministry' ELSE role END as role, 
              active, created_at 
       FROM users 
       ORDER BY name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// POST /api/admin/users - Create new user
router.post('/users', async (req, res) => {
  try {
    const { full_name, email, role, pin, active } = req.body;

    if (!full_name || !email || !role || !pin) {
      return res.status(400).json({ error: 'Full name, email, role, and PIN are required' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    // Map frontend role 'ministry' to database role 'ministry_leader'
    const dbRole = role === 'ministry' ? 'ministry_leader' : role;

    // Check for duplicate email
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const result = await pool.query(
      `INSERT INTO users (name, email, role, pin, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name as full_name, email, CASE WHEN role = 'ministry_leader' THEN 'ministry' ELSE role END as role, active, created_at`,
      [full_name.trim(), email.toLowerCase().trim(), dbRole, pin, active !== false]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'user_created', `Created user: ${email}`]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { full_name, email, role, pin, active } = req.body;

    if (!full_name || !email || !role) {
      return res.status(400).json({ error: 'Full name, email, and role are required' });
    }

    // Check for duplicate email (excluding current user)
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
      [email, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Map frontend role 'ministry' to database role 'ministry_leader'
    const dbRole = role === 'ministry' ? 'ministry_leader' : role;

    let query, params;
    if (pin && pin.length === 4 && /^\d{4}$/.test(pin)) {
      // Update with new PIN
      query = `UPDATE users 
               SET name = $1, email = $2, role = $3, pin = $4, active = $5
               WHERE id = $6
               RETURNING id, name as full_name, email, CASE WHEN role = 'ministry_leader' THEN 'ministry' ELSE role END as role, active, created_at`;
      params = [full_name.trim(), email.toLowerCase().trim(), dbRole, pin, active !== undefined ? active : true, userId];
    } else {
      // Update without changing PIN
      query = `UPDATE users 
               SET name = $1, email = $2, role = $3, active = $4
               WHERE id = $5
               RETURNING id, name as full_name, email, CASE WHEN role = 'ministry_leader' THEN 'ministry' ELSE role END as role, active, created_at`;
      params = [full_name.trim(), email.toLowerCase().trim(), dbRole, active !== undefined ? active : true, userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'user_updated', `Updated user: ${email}`]
    );

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// PUT /api/admin/users/:id/pin - Update user PIN
router.put('/users/:id/pin', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { pin } = req.body;

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    const result = await pool.query(
      'UPDATE users SET pin = $1 WHERE id = $2 RETURNING id',
      [pin, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'user_pin_changed', `Changed PIN for user ID: ${userId}`]
    );

    res.json({ message: 'PIN updated successfully' });
  } catch (error) {
    console.error('Update PIN error:', error);
    res.status(500).json({ error: 'Server error updating PIN' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user created any forms
    const formsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM ministry_forms WHERE ministry_leader_id = $1',
      [userId]
    );

    if (parseInt(formsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user. They have created forms in the system.' 
      });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name as full_name',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'user_deleted', `Deleted user: ${result.rows[0].full_name}`]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// ============================================
// GET PILLAR LIST (for dropdowns)
// ============================================
router.get('/pillars', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name as full_name, email 
       FROM users 
       WHERE role = 'pillar' AND active = true
       ORDER BY name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get pillars error:', error);
    res.status(500).json({ error: 'Server error fetching pillars' });
  }
});

module.exports = { router, initializeRouter };
