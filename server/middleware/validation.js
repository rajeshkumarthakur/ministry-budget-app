// server/middleware/validation.js
// Validation and permission checking middleware for forms

/**
 * Check if a user can edit a form
 * @param {Pool} pool - Database connection pool
 * @param {number} userId - User ID
 * @param {string} role - User role
 * @param {number} formId - Form ID
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
const canEditForm = async (pool, userId, role, formId) => {
  try {
    // Get form details with ministry info
    const formResult = await pool.query(
      `SELECT mf.ministry_leader_id, mf.status, mf.ministry_id, m.assigned_pillars 
       FROM ministry_forms mf
       LEFT JOIN ministries m ON mf.ministry_id = m.id
       WHERE mf.id = $1`,
      [formId]
    );

    if (formResult.rows.length === 0) {
      return { allowed: false, reason: 'Form not found' };
    }

    const form = formResult.rows[0];

    // Admin can edit any form at any time
    if (role === 'admin') {
      return { allowed: true };
    }

    // Ministry leader can only edit forms from ministries they lead
    if (role === 'ministry_leader') {
      if (form.ministry_leader_id !== userId) {
        return { allowed: false, reason: 'You can only edit forms from ministries you lead' };
      }
      return { allowed: true };
    }

    // Pillar can only edit forms from ministries they're assigned to
    if (role === 'pillar') {
      // Check if pillar is assigned to this ministry
      if (form.assigned_pillars && Array.isArray(form.assigned_pillars) && form.assigned_pillars.length > 0) {
        if (form.assigned_pillars.includes(userId)) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'You can only edit forms from ministries you are assigned to' };
      }
      // If no assigned pillars for the ministry, don't allow editing
      return { allowed: false, reason: 'No pillars are assigned to this ministry, so you cannot edit this form' };
    }

    // Pastor can edit any form at any time
    if (role === 'pastor') {
      return { allowed: true };
    }

    // All other roles cannot edit forms
    return { allowed: false, reason: 'You do not have permission to edit forms' };

  } catch (error) {
    console.error('canEditForm error:', error);
    return { allowed: false, reason: 'Error checking edit permissions' };
  }
};

/**
 * Check if a role can approve a form
 * @param {Pool} pool - Database connection pool
 * @param {number} userId - User ID
 * @param {string} role - User role
 * @param {number} formId - Form ID
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
const canApproveForm = async (pool, userId, role, formId) => {
  try {
    // Admins can approve any form
    if (role === 'admin') {
      return { allowed: true };
    }

    // Get form status and ministry
    const formResult = await pool.query(
      'SELECT status, ministry_id FROM ministry_forms WHERE id = $1',
      [formId]
    );

    if (formResult.rows.length === 0) {
      return { allowed: false, reason: 'Form not found' };
    }

    const { status, ministry_id } = formResult.rows[0];

  // Pillars can approve forms pending pillar approval
  if (role === 'pillar') {
    if (status !== 'pending_pillar') {
      return { allowed: false, reason: 'Form is not pending pillar approval' };
    }
    
    // Check if this pillar is assigned to the form's ministry
    const ministryResult = await pool.query(
      'SELECT assigned_pillars FROM ministries WHERE id = $1',
      [ministry_id]
    );
    
    if (ministryResult.rows.length === 0) {
      return { allowed: false, reason: 'Ministry not found' };
    }
    
    const { assigned_pillars } = ministryResult.rows[0];
    
    // If ministry has assigned pillars, check if this pillar is one of them
    if (assigned_pillars && assigned_pillars.length > 0) {
      if (!assigned_pillars.includes(userId)) {
        return { allowed: false, reason: 'You are not assigned to this ministry' };
      }
    }
    
    return { allowed: true };
  }

    // Pastors can approve forms pending pastor approval
    if (role === 'pastor') {
      if (status === 'pending_pastor') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Form is not pending pastor approval' };
    }

    return { allowed: false, reason: 'You do not have permission to approve forms' };

  } catch (error) {
    console.error('canApproveForm error:', error);
    return { allowed: false, reason: 'Error checking approval permissions' };
  }
};

/**
 * Generate a unique form number in format TVC-YYYY-NNNN
 * @param {Pool} pool - Database connection pool
 * @returns {Promise<string>} Form number
 */
const generateFormNumber = async (pool) => {
  try {
    const year = new Date().getFullYear();
    const prefix = `TVC-${year}-`;

    // Get the highest form number for this year
    const result = await pool.query(
      `SELECT form_number 
       FROM ministry_forms 
       WHERE form_number LIKE $1 
       ORDER BY form_number DESC 
       LIMIT 1`,
      [`${prefix}%`]
    );

    let sequence = 1;

    if (result.rows.length > 0) {
      // Extract the sequence number from the last form number
      const lastNumber = result.rows[0].form_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    // Format with leading zeros (4 digits)
    const formNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;

    return formNumber;

  } catch (error) {
    console.error('generateFormNumber error:', error);
    throw new Error('Failed to generate form number');
  }
};

/**
 * Middleware to validate approval request body
 */
const validateApproval = (req, res, next) => {
  const { action } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action is required (approve or reject)' });
  }

  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'Action must be either "approve" or "reject"' });
  }

  // Signature is optional for approve, comments optional for both
  next();
};

/**
 * Validate form creation request (currently not used but exported for future use)
 */
const validateFormCreation = (req, res, next) => {
  const { ministry_id } = req.body;

  if (!ministry_id) {
    return res.status(400).json({ error: 'Ministry ID is required' });
  }

  next();
};

module.exports = {
  canEditForm,
  canApproveForm,
  generateFormNumber,
  validateApproval,
  validateFormCreation
};

