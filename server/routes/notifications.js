// server/routes/notifications.js
// Notification routes for pillar users

const express = require('express');
const router = express.Router();

let pool;
const initializeRouter = (dbPool) => {
  pool = dbPool;
};

// ============================================
// GET /api/notifications - Get user's notifications
// ============================================
router.get('/', async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await pool.query(
      `SELECT 
        n.id,
        n.form_id,
        n.type,
        n.title,
        n.message,
        n.is_read,
        n.created_at,
        n.read_at,
        mf.form_number,
        mf.status as form_status,
        m.name as ministry_name
      FROM notifications n
      LEFT JOIN ministry_forms mf ON n.form_id = mf.id
      LEFT JOIN ministries m ON mf.ministry_id = m.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
});

// ============================================
// GET /api/notifications/unread-count - Get count of unread notifications
// ============================================
router.get('/unread-count', async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error fetching unread count' });
  }
});

// ============================================
// PUT /api/notifications/:id/read - Mark notification as read
// ============================================
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const { id: userId } = req.user;

    // Verify the notification belongs to this user
    const checkResult = await pool.query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [notificationId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Server error marking notification as read' });
  }
});

// ============================================
// PUT /api/notifications/read-all - Mark all notifications as read
// ============================================
router.put('/read-all', async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    res.json({ 
      message: 'All notifications marked as read',
      count: result.rowCount
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Server error marking notifications as read' });
  }
});

// ============================================
// DELETE /api/notifications/:id - Delete a notification
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const { id: userId } = req.user;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Server error deleting notification' });
  }
});

module.exports = { router, initializeRouter };

