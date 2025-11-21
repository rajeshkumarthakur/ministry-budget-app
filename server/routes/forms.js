// server/routes/forms.js
// Form management routes - Phase 2.5 with ministry routing

const express = require('express');
const router = express.Router();
const {
  validateFormCreation,
  validateApproval,
  canEditForm,
  canApproveForm,
  generateFormNumber
} = require('../middleware/validation');

// Initialize with pool from server.js
let pool;
const initializeRouter = (dbPool) => {
  pool = dbPool;
};

// ============================================
// GET /api/forms - List all forms (filtered by role)
// ============================================
router.get('/', async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let query;
    let params;

    if (role === 'admin' || role === 'pastor') {
      // Admin and Pastor see all forms
      query = `
        SELECT 
          f.id, f.form_number, f.status, f.ministry_leader_id,
          f.created_at, f.updated_at, f.submitted_at,
          m.name as ministry_name, m.assigned_pillars,
          u.name as leader_name, u.email as leader_email
        FROM ministry_forms f
        LEFT JOIN ministries m ON f.ministry_id = m.id
        LEFT JOIN users u ON f.ministry_leader_id = u.id
        ORDER BY f.updated_at DESC
      `;
      params = [];
    } else if (role === 'pillar') {
      // Pillars see forms from their assigned ministries
      query = `
        SELECT 
          f.id, f.form_number, f.status, f.ministry_leader_id,
          f.created_at, f.updated_at, f.submitted_at,
          m.name as ministry_name, m.assigned_pillars,
          u.name as leader_name, u.email as leader_email
        FROM ministry_forms f
        LEFT JOIN ministries m ON f.ministry_id = m.id
        LEFT JOIN users u ON f.ministry_leader_id = u.id
        WHERE f.status NOT IN ('draft')
        ORDER BY f.updated_at DESC
      `;
      params = [];
    } else if (role === 'ministry_leader') {
      // Ministry leaders see all forms but can only edit their own
      query = `
        SELECT 
          f.id, f.form_number, f.status, f.ministry_leader_id,
          f.created_at, f.updated_at, f.submitted_at,
          m.name as ministry_name, m.assigned_pillars,
          u.name as leader_name, u.email as leader_email
        FROM ministry_forms f
        LEFT JOIN ministries m ON f.ministry_id = m.id
        LEFT JOIN users u ON f.ministry_leader_id = u.id
        ORDER BY f.updated_at DESC
      `;
      params = [];
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Server error fetching forms' });
  }
});

// ============================================
// GET /api/forms/:id - Get specific form with all data
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { role, id: userId } = req.user;

    // Get form basic info with ministry and pillar details
    const formResult = await pool.query(
      `SELECT 
        f.*, 
        m.name as ministry_name,
        u.name as leader_name, 
        u.email as leader_email
      FROM ministry_forms f
      LEFT JOIN ministries m ON f.ministry_id = m.id
      LEFT JOIN users u ON f.ministry_leader_id = u.id
      WHERE f.id = $1`,
      [formId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const form = formResult.rows[0];

    // Check if user has permission to view
    if (role === 'ministry_leader' && form.ministry_leader_id !== userId) {
      return res.status(403).json({ error: 'You can only view your own forms' });
    }

    // Pillars can view all submitted forms
    if (role === 'pillar' && form.status === 'draft') {
      return res.status(403).json({ error: 'You can only view submitted forms' });
    }

    // Get form sections data
    const sectionsResult = await pool.query(
      'SELECT section, data FROM form_data WHERE form_id = $1',
      [formId]
    );

    const sections = {};
    sectionsResult.rows.forEach(row => {
      sections[row.section] = row.data;
    });

    // Get events - handle missing expected_attendance column gracefully
    let eventsResult;
    try {
      eventsResult = await pool.query(
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
        eventsResult = await pool.query(
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

    // Get goals - handle SMART goal fields gracefully
    let goalsResult;
    try {
      goalsResult = await pool.query(
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
          goalsResult = await pool.query(
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
          goalsResult.rows = goalsResult.rows.map(row => ({
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
          // Return empty array if goals table doesn't exist or other error
          goalsResult = { rows: [] };
        }
      } else {
        console.error('Error fetching goals:', dbError);
        // Return empty array on other errors to prevent form load failure
        goalsResult = { rows: [] };
      }
    }

    // Get approvals history
    const approvalsResult = await pool.query(
      `SELECT 
        a.*, 
        u.name as approver_name
      FROM approvals a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.form_id = $1
      ORDER BY a.approved_at DESC`,
      [formId]
    );

    // Combine all data
    const fullForm = {
      ...form,
      sections,
      events: eventsResult.rows,
      goals: goalsResult.rows,
      approvals: approvalsResult.rows
    };

    res.json(fullForm);

  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Server error fetching form' });
  }
});

// ============================================
// POST /api/forms - Create new form
// ============================================
router.post('/', async (req, res) => {
  try {
    const { ministry_id } = req.body;
    const { id: userId, role } = req.user;

    // Only ministry leaders and admins can create forms
    if (role !== 'ministry_leader' && role !== 'admin') {
      return res.status(403).json({ error: 'Only ministry leaders can create forms' });
    }

    if (!ministry_id) {
      return res.status(400).json({ error: 'Ministry is required' });
    }

    // Verify ministry exists
    const ministryCheck = await pool.query(
      'SELECT id, name FROM ministries WHERE id = $1 AND active = true',
      [ministry_id]
    );

    if (ministryCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid ministry' });
    }

    const ministry = ministryCheck.rows[0];

    // Generate unique form number
    const formNumber = await generateFormNumber(pool);

    // Create form
    const result = await pool.query(
      `INSERT INTO ministry_forms (form_number, ministry_id, ministry_name, ministry_leader_id, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [formNumber, ministry_id, ministry.name, userId]
    );

    const newForm = result.rows[0];

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [newForm.id, userId, 'form_created', `Created form ${formNumber} for ${ministry.name}`]
    );

    res.status(201).json(newForm);

  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Server error creating form' });
  }
});

// PUT, DELETE, SUBMIT routes remain the same as Phase 2...
// (copying from previous forms.js)

router.put('/:id', async (req, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { section, data, sections } = req.body;
    const { id: userId, role } = req.user;

    const editCheck = await canEditForm(pool, userId, role, formId);
    if (!editCheck.allowed) {
      return res.status(403).json({ error: editCheck.reason });
    }

    // Handle bulk section updates (from FormBuilder)
    if (sections && typeof sections === 'object') {
      const sectionKeys = Object.keys(sections);
      for (const sectionKey of sectionKeys) {
        await pool.query(
          `INSERT INTO form_data (form_id, section, data)
           VALUES ($1, $2, $3)
           ON CONFLICT (form_id, section)
           DO UPDATE SET data = $3, updated_at = CURRENT_TIMESTAMP`,
          [formId, sectionKey, JSON.stringify(sections[sectionKey])]
        );
      }
      
      await pool.query(
        'UPDATE ministry_forms SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [formId]
      );

      await pool.query(
        'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [formId, userId, 'form_updated', `Updated ${sectionKeys.length} section(s)`]
      );

      res.json({ message: 'Form updated successfully' });
    }
    // Handle single section update (backward compatibility)
    else if (section && data) {
      await pool.query(
        `INSERT INTO form_data (form_id, section, data)
         VALUES ($1, $2, $3)
         ON CONFLICT (form_id, section)
         DO UPDATE SET data = $3, updated_at = CURRENT_TIMESTAMP`,
        [formId, section, JSON.stringify(data)]
      );

      await pool.query(
        'UPDATE ministry_forms SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [formId]
      );

      await pool.query(
        'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [formId, userId, 'form_updated', `Updated section: ${section}`]
      );

      res.json({ message: 'Form updated successfully' });
    } else {
      return res.status(400).json({ error: 'Either section/data or sections object is required' });
    }

  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Server error updating form' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { id: userId, role } = req.user;

    // Get form details
    const formResult = await pool.query(
      'SELECT ministry_leader_id, status, form_number FROM ministry_forms WHERE id = $1',
      [formId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const form = formResult.rows[0];

    // Check delete permissions
    // Admin can delete any form
    // Form creator can only delete their own draft forms
    if (role !== 'admin') {
      if (role !== 'ministry_leader' || form.ministry_leader_id !== userId) {
        return res.status(403).json({ error: 'You can only delete your own forms' });
      }
      if (form.status !== 'draft') {
        return res.status(403).json({ error: 'You can only delete draft forms' });
      }
    }

    await pool.query('DELETE FROM ministry_forms WHERE id = $1', [formId]);

    await pool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'form_deleted', `Deleted form ${form.form_number}`]
    );

    res.json({ message: 'Form deleted successfully' });

  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Server error deleting form' });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { id: userId, role } = req.user;

    const editCheck = await canEditForm(pool, userId, role, formId);
    if (!editCheck.allowed) {
      return res.status(403).json({ error: editCheck.reason });
    }

    // Get form details including ministry info
    const formResult = await pool.query(
      `SELECT mf.form_number, mf.ministry_id, m.name as ministry_name, u.name as submitter_name
       FROM ministry_forms mf
       LEFT JOIN ministries m ON mf.ministry_id = m.id
       LEFT JOIN users u ON mf.ministry_leader_id = u.id
       WHERE mf.id = $1`,
      [formId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const { form_number, ministry_id, ministry_name, submitter_name } = formResult.rows[0];

    await pool.query(
      `UPDATE ministry_forms 
       SET status = 'pending_pillar', 
           current_approver_role = 'pillar',
           submitted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [formId]
    );

    await pool.query(
      'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [formId, userId, 'form_submitted', 'Form submitted for pillar approval']
    );

    // Create notifications for pillar users with affiliated ministry
    const pillarResult = await pool.query(
      `SELECT id, name, email 
       FROM users 
       WHERE role = 'pillar' 
       AND active = true
`,
      []
    );

    // Insert notifications for each matching pillar
    for (const pillar of pillarResult.rows) {
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, form_id, type, title, message)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, form_id, type) DO NOTHING`,
          [
            pillar.id,
            formId,
            'form_submitted',
            'New Form Awaiting Approval',
            `Form ${form_number} from ${ministry_name} has been submitted and is waiting for your approval.`
          ]
        );
      } catch (notifError) {
        console.error(`Failed to create notification for pillar ${pillar.id}:`, notifError);
        // Continue with other notifications even if one fails
      }
    }

    res.json({ message: 'Form submitted successfully for pillar approval' });

  } catch (error) {
    console.error('Submit form error:', error);
    res.status(500).json({ error: 'Server error submitting form' });
  }
});

// ============================================
// POST /api/forms/:id/approve - Updated with pillar-specific routing
// ============================================
router.post('/:id/approve', validateApproval, async (req, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { action, comments, signature } = req.body;
    const { id: userId, role } = req.user;

    // Get form details
    const formResult = await pool.query(
      `SELECT f.status
       FROM ministry_forms f
       WHERE f.id = $1`,
      [formId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const { status: currentStatus } = formResult.rows[0];

    // Standard approval check (includes affiliated ministry check for pillars)
    const approveCheck = await canApproveForm(pool, userId, role, formId);
    if (!approveCheck.allowed) {
      return res.status(403).json({ error: approveCheck.reason });
    }

    let newStatus;
    let auditAction;
    let auditDetails;

    if (action === 'approve') {
      if (currentStatus === 'pending_pillar') {
        newStatus = 'pending_pastor';
        auditAction = 'pillar_approved';
        auditDetails = 'Form approved by pillar, sent to pastor';
        
        await pool.query(
          `UPDATE ministry_forms 
           SET status = $1, 
               current_approver_role = 'pastor',
               pillar_approved_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [newStatus, formId]
        );
      } else if (currentStatus === 'pending_pastor') {
        newStatus = 'approved';
        auditAction = 'pastor_approved';
        auditDetails = 'Form approved by pastor - FINAL APPROVAL';
        
        await pool.query(
          `UPDATE ministry_forms 
           SET status = $1, 
               current_approver_role = NULL,
               pastor_approved_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [newStatus, formId]
        );
      }

      await pool.query(
        `INSERT INTO approvals (form_id, user_id, role, action, signature, comments)
         VALUES ($1, $2, $3, 'approved', $4, $5)`,
        [formId, userId, role, signature || null, comments || null]
      );

    } else if (action === 'reject') {
      newStatus = 'rejected';
      auditAction = `${role}_rejected`;
      auditDetails = `Form rejected by ${role}: ${comments}`;

      await pool.query(
        `UPDATE ministry_forms 
         SET status = 'rejected',
             current_approver_role = NULL,
             rejection_reason = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [comments, formId]
      );

      await pool.query(
        `INSERT INTO approvals (form_id, user_id, role, action, comments)
         VALUES ($1, $2, $3, 'rejected', $4)`,
        [formId, userId, role, comments]
      );
    }

    await pool.query(
      'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [formId, userId, auditAction, auditDetails]
    );

    res.json({ 
      message: `Form ${action}d successfully`,
      newStatus
    });

  } catch (error) {
    console.error('Approve/reject form error:', error);
    res.status(500).json({ error: 'Server error processing approval' });
  }
});

// ============================================
// POST /api/forms/:id/revoke - Pillar/Pastor revoke their own decision
// ============================================
router.post('/:id/revoke', async (req, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { id: userId, role } = req.user;

    // Admin, pillar, and pastor can revoke decisions
    if (role !== 'admin' && role !== 'pillar' && role !== 'pastor') {
      return res.status(403).json({ error: 'Only admin, pillar, and pastor users can revoke decisions' });
    }

    // Get form details
    const formResult = await pool.query(
      `SELECT mf.status, mf.form_number, mf.ministry_id, m.name as ministry_name 
       FROM ministry_forms mf
       LEFT JOIN ministries m ON mf.ministry_id = m.id
       WHERE mf.id = $1`,
      [formId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const { status, form_number, ministry_id, ministry_name } = formResult.rows[0];

    // Handle admin revoke - can revoke any form at any status (except draft)
    if (role === 'admin') {
      if (status === 'draft') {
        return res.status(400).json({ error: 'Cannot revoke a draft form' });
      }
      
      // Reset form to pending_pillar status
      await pool.query(
        `UPDATE ministry_forms 
         SET status = 'pending_pillar',
             current_approver_role = 'pillar',
             pillar_approved_at = NULL,
             pastor_approved_at = NULL,
             rejection_reason = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [formId]
      );

      // Delete all approval records
      await pool.query(
        'DELETE FROM approvals WHERE form_id = $1',
        [formId]
      );

      // Notify all pillar users
      const pillarResult = await pool.query(
        `SELECT id FROM users WHERE role = 'pillar' AND active = true`
      );

      for (const pillar of pillarResult.rows) {
        try {
          await pool.query(
            `INSERT INTO notifications (user_id, form_id, type, title, message)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, form_id, type) DO UPDATE
             SET message = EXCLUDED.message, is_read = FALSE, created_at = CURRENT_TIMESTAMP`,
            [
              pillar.id,
              formId,
              'decision_revoked',
              'Decision Revoked by Admin',
              `Admin revoked decision for Form ${form_number} (${ministry_name}). Please review again.`
            ]
          );
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }

      // Log audit
      await pool.query(
        'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [formId, userId, 'admin_decision_revoked', `Admin revoked decision for form ${form_number}`]
      );

      res.json({ 
        message: 'Decision revoked successfully. Form reset to pending pillar approval.',
        newStatus: 'pending_pillar'
      });
      return;
    }
    
    // Handle pillar revoke
    if (role === 'pillar') {
      // Pillar can revoke any form (except draft)
      if (status === 'draft') {
        return res.status(400).json({ error: 'Cannot revoke a draft form' });
      }

      // Reset form to pending_pillar status
      await pool.query(
        `UPDATE ministry_forms 
         SET status = 'pending_pillar',
             current_approver_role = 'pillar',
             pillar_approved_at = NULL,
             pastor_approved_at = NULL,
             rejection_reason = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [formId]
      );

      // Delete the pillar approval/rejection record
      await pool.query(
        'DELETE FROM approvals WHERE form_id = $1 AND role = $2',
        [formId, 'pillar']
      );

      // Delete pastor approval if exists
      await pool.query(
        'DELETE FROM approvals WHERE form_id = $1 AND role = $2',
        [formId, 'pastor']
      );

      // Notify all pillar users
      const pillarResult = await pool.query(
        `SELECT id FROM users WHERE role = 'pillar' AND active = true`
      );

      for (const pillar of pillarResult.rows) {
        try {
          await pool.query(
            `INSERT INTO notifications (user_id, form_id, type, title, message)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, form_id, type) DO UPDATE
             SET message = EXCLUDED.message, is_read = FALSE, created_at = CURRENT_TIMESTAMP`,
            [
              pillar.id,
              formId,
              'decision_revoked',
              'Decision Revoked',
              `Pillar decision for Form ${form_number} (${ministry_name}) has been revoked. Please review again.`
            ]
          );
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }

      // Log audit
      await pool.query(
        'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [formId, userId, 'pillar_decision_revoked', `Pillar revoked their decision for form ${form_number}`]
      );

      res.json({ 
        message: 'Decision revoked successfully. Form reset to pending pillar approval.',
        newStatus: 'pending_pillar'
      });
    }
    // Handle pastor revoke
    else if (role === 'pastor') {
      // Pastor can revoke any form (except draft and pending_pillar)
      if (status === 'draft' || status === 'pending_pillar') {
        return res.status(400).json({ error: 'Cannot revoke forms in draft or pending pillar status' });
      }

      // Reset form to pending_pastor status
      await pool.query(
        `UPDATE ministry_forms 
         SET status = 'pending_pastor',
             current_approver_role = 'pastor',
             pastor_approved_at = NULL,
             rejection_reason = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [formId]
      );

      // Delete the pastor approval/rejection record
      await pool.query(
        'DELETE FROM approvals WHERE form_id = $1 AND role = $2',
        [formId, 'pastor']
      );

      // Notify all pastor users
      const pastorResult = await pool.query(
        `SELECT id FROM users WHERE role = 'pastor' AND active = true`
      );

      for (const pastor of pastorResult.rows) {
        try {
          await pool.query(
            `INSERT INTO notifications (user_id, form_id, type, title, message)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, form_id, type) DO UPDATE
             SET message = EXCLUDED.message, is_read = FALSE, created_at = CURRENT_TIMESTAMP`,
            [
              pastor.id,
              formId,
              'decision_revoked',
              'Decision Revoked',
              `Pastor decision for Form ${form_number} (${ministry_name}) has been revoked. Please review again.`
            ]
          );
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }

      // Log audit
      await pool.query(
        'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [formId, userId, 'pastor_decision_revoked', `Pastor revoked their decision for form ${form_number}`]
      );

      res.json({ 
        message: 'Decision revoked successfully. Form reset to pending pastor approval.',
        newStatus: 'pending_pastor'
      });
    }

  } catch (error) {
    console.error('Revoke approval error:', error);
    res.status(500).json({ error: 'Server error revoking decision' });
  }
});

// ============================================
// POST /api/forms/:id/query - Pastor raise query
// ============================================
router.post('/:id/query', async (req, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { description } = req.body;
    const { id: userId, role } = req.user;

    // Only pastors can raise queries
    if (role !== 'pastor') {
      return res.status(403).json({ error: 'Only pastors can raise queries' });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Query description is required' });
    }

    // Get form details
    const formResult = await pool.query(
      `SELECT mf.status, mf.form_number, mf.ministry_id, m.name as ministry_name, u.name as pastor_name
       FROM ministry_forms mf
       LEFT JOIN ministries m ON mf.ministry_id = m.id
       LEFT JOIN users u ON u.id = $2
       WHERE mf.id = $1`,
      [formId, userId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const { status, form_number, ministry_id, ministry_name, pastor_name } = formResult.rows[0];

    // Automatically revoke if form is approved or pending pastor
    let needsRevoke = false;
    if (status === 'pending_pastor' || status === 'approved' || status === 'rejected') {
      needsRevoke = true;

      // Reset form to pending_pillar status
      await pool.query(
        `UPDATE ministry_forms 
         SET status = 'pending_pillar',
             current_approver_role = 'pillar',
             pillar_approved_at = NULL,
             pastor_approved_at = NULL,
             rejection_reason = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [formId]
      );

      // Delete approval records
      await pool.query(
        'DELETE FROM approvals WHERE form_id = $1',
        [formId]
      );
    }

    // Find all pillar users for this ministry (affiliated or general)
    const pillarResult = await pool.query(
      `SELECT id, name, email 
       FROM users 
       WHERE role = 'pillar' 
       AND active = true
`,
      []
    );

    // Create notifications for pillar users
    for (const pillar of pillarResult.rows) {
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, form_id, type, title, message)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, form_id, type) DO UPDATE
           SET message = EXCLUDED.message, is_read = FALSE, created_at = CURRENT_TIMESTAMP`,
          [
            pillar.id,
            formId,
            'pastor_query',
            'Pastor Query on Form',
            `${pastor_name} raised a query on Form ${form_number} (${ministry_name}): "${description.substring(0, 200)}${description.length > 200 ? '...' : ''}"`
          ]
        );
      } catch (notifError) {
        console.error(`Failed to create notification for pillar ${pillar.id}:`, notifError);
      }
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (form_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [formId, userId, 'pastor_query', `Pastor raised query: ${description}`]
    );

    res.json({ 
      message: 'Query sent successfully to pillar leaders',
      revoked: needsRevoke,
      newStatus: needsRevoke ? 'pending_pillar' : status,
      notifiedPillars: pillarResult.rows.length
    });

  } catch (error) {
    console.error('Pastor query error:', error);
    res.status(500).json({ error: 'Server error raising query' });
  }
});

router.get('/:id/pdf', async (req, res) => {
  res.json({ message: 'PDF generation coming in Phase 6' });
});

module.exports = { router, initializeRouter };
