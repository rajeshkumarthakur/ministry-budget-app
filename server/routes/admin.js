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
        COALESCE(SUM((fd.data->>'total_budget')::numeric), 0) as total
      FROM ministry_forms mf
      LEFT JOIN form_data fd ON mf.id = fd.form_id AND fd.section = 'section7'
      WHERE mf.status = 'approved'
        AND fd.data->>'total_budget' IS NOT NULL
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
        m.ministry_leader_id,
        m.assigned_pillars,
        m.description,
        m.active,
        m.created_at,
        m.updated_at,
        ml.name as ministry_leader_name,
        ml.email as ministry_leader_email,
        (
          SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email))
          FROM users u
          WHERE u.id = ANY(m.assigned_pillars)
        ) as assigned_pillar_details
      FROM ministries m
      LEFT JOIN users ml ON m.ministry_leader_id = ml.id
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
    const { name, ministry_leader_id, assigned_pillars, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Ministry name is required' });
    }

    // Verify ministry leader exists if provided
    if (ministry_leader_id) {
      const leaderCheck = await pool.query(
        "SELECT id, role FROM users WHERE id = $1",
        [ministry_leader_id]
      );
      if (leaderCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid ministry leader ID' });
      }
    }

    // Verify assigned pillars exist if provided
    if (assigned_pillars && assigned_pillars.length > 0) {
      const pillarsCheck = await pool.query(
        'SELECT id FROM users WHERE id = ANY($1) AND role != $2 AND active = true',
        [assigned_pillars, 'admin']
      );
      if (pillarsCheck.rows.length !== assigned_pillars.length) {
        return res.status(400).json({ error: 'Some assigned pillar IDs are invalid' });
      }
    }

    const result = await pool.query(
      `INSERT INTO ministries (name, ministry_leader_id, assigned_pillars, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        name.trim(), 
        ministry_leader_id || null, 
        assigned_pillars || [],
        description || null
      ]
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
    const { name, ministry_leader_id, assigned_pillars, description, active } = req.body;

    console.log('Update ministry request:', { ministryId, name, ministry_leader_id, assigned_pillars, description, active });

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Ministry name is required' });
    }

    // Verify ministry leader exists if provided
    if (ministry_leader_id) {
      const leaderCheck = await pool.query(
        "SELECT id, role FROM users WHERE id = $1",
        [ministry_leader_id]
      );
      console.log('Ministry leader check result:', leaderCheck.rows);
      if (leaderCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid ministry leader ID - user not found' });
      }
    }

    // Verify assigned pillars exist if provided
    if (assigned_pillars && assigned_pillars.length > 0) {
      const pillarsCheck = await pool.query(
        'SELECT id FROM users WHERE id = ANY($1) AND role != $2 AND active = true',
        [assigned_pillars, 'admin']
      );
      if (pillarsCheck.rows.length !== assigned_pillars.length) {
        return res.status(400).json({ error: 'Some assigned pillar IDs are invalid' });
      }
    }

    const result = await pool.query(
      `UPDATE ministries 
       SET name = $1,
           ministry_leader_id = $2,
           assigned_pillars = $3,
           description = $4,
           active = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        name.trim(),
        ministry_leader_id || null,
        assigned_pillars || [],
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
    console.error('Error details:', error.message, error.code);
    res.status(500).json({ error: 'Server error updating ministry: ' + error.message });
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
    // Get users with their ministries aggregated
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.name as full_name, 
        u.email, 
        u.role, 
        u.active, 
        u.created_at,
        STRING_AGG(DISTINCT m.name, ', ') FILTER (WHERE m.id IS NOT NULL) as ministries
       FROM users u
       LEFT JOIN ministries m ON m.ministry_leader_id = u.id
       GROUP BY u.id, u.name, u.email, u.role, u.active, u.created_at
       ORDER BY u.name`
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

    console.log('Creating user with data:', { full_name, email, role, pin: '****', active });

    if (!full_name || !email || !role || !pin) {
      return res.status(400).json({ error: 'Full name, email, role, and PIN are required' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    // Map frontend role to database role
    let dbRole = role;
    if (role === 'ministry' || role === 'ministry_leader') {
      dbRole = 'ministry_leader';
    }

    console.log('Role mapping:', { frontend: role, database: dbRole });

    // Check for duplicate email
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Just insert user into users table - NO ministry assignment here
    // Ministry assignment happens separately in "Manage Ministries"
    const result = await pool.query(
      `INSERT INTO users (name, email, role, pin, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name as full_name, email, role, active, created_at`,
      [full_name.trim(), email.toLowerCase().trim(), dbRole, pin, active !== false]
    );

    const newUser = result.rows[0];
    console.log('✅ User created successfully in database:', newUser);

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'user_created', `Created user: ${email}`]
    );

    console.log('✅ Returning response to frontend:', newUser);
    res.status(201).json(newUser);
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

    // Map frontend role to database role
    let dbRole = role;
    if (role === 'ministry' || role === 'ministry_leader') {
      dbRole = 'ministry_leader';
    }

    let query, params;
    if (pin && pin.length === 4 && /^\d{4}$/.test(pin)) {
      // Update with new PIN
      query = `UPDATE users 
               SET name = $1, email = $2, role = $3, pin = $4, active = $5
               WHERE id = $6
               RETURNING id, name as full_name, email, role, active, created_at`;
      params = [full_name.trim(), email.toLowerCase().trim(), dbRole, pin, active !== undefined ? active : true, userId];
    } else {
      // Update without changing PIN
      query = `UPDATE users 
               SET name = $1, email = $2, role = $3, active = $4
               WHERE id = $5
               RETURNING id, name as full_name, email, role, active, created_at`;
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

    console.log('✅ User updated successfully:', result.rows[0]);
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
  const client = await pool.connect();
  
  try {
    const userId = parseInt(req.params.id);

    await client.query('BEGIN');

    // Get user info before deletion
    const userResult = await client.query(
      'SELECT id, name as full_name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Unlink user from ministries (set ministry_leader_id to NULL)
    const ministriesUpdate = await client.query(
      'UPDATE ministries SET ministry_leader_id = NULL WHERE ministry_leader_id = $1 RETURNING id, name',
      [userId]
    );

    // Unlink user from forms (set ministry_leader_id to NULL)
    const formsUpdate = await client.query(
      'UPDATE ministry_forms SET ministry_leader_id = NULL WHERE ministry_leader_id = $1 RETURNING id, form_number',
      [userId]
    );

    // Unlink user from audit logs (set user_id to NULL to preserve history)
    const auditUpdate = await client.query(
      'UPDATE audit_log SET user_id = NULL WHERE user_id = $1 RETURNING id',
      [userId]
    );

    // Unlink user from approvals (set user_id to NULL to preserve approval history)
    const approvalsUpdate = await client.query(
      'UPDATE approvals SET user_id = NULL WHERE user_id = $1 RETURNING id',
      [userId]
    );

    // Delete the user
    await client.query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );

    await client.query('COMMIT');

    // Log audit with details
    const auditDetails = {
      deleted_user: user.full_name,
      email: user.email,
      unlinked_ministries: ministriesUpdate.rows.length,
      unlinked_forms: formsUpdate.rows.length,
      unlinked_approvals: approvalsUpdate.rows.length,
      unlinked_audit_logs: auditUpdate.rows.length
    };

    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'user_deleted', JSON.stringify(auditDetails)]
    );

    res.json({ 
      message: 'User deleted successfully',
      unlinked_ministries: ministriesUpdate.rows.length,
      unlinked_forms: formsUpdate.rows.length,
      unlinked_approvals: approvalsUpdate.rows.length,
      unlinked_audit_logs: auditUpdate.rows.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  } finally {
    client.release();
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
