const express = require('express');
const { get, query } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /shared/:shareId - public note view (no auth required)
router.get('/:shareId', (req, res) => {
  try {
    const note = get(
      `SELECT n.id, n.title, n.content, n.tags, n.category, n.ai_summary, 
              n.ai_action_items, n.ai_suggested_title, n.created_at, n.updated_at,
              u.name as author_name
       FROM notes n 
       JOIN users u ON n.user_id = u.id
       WHERE n.share_id = ? AND n.is_public = 1`,
      [req.params.shareId]
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found or not publicly shared' });
    }

    res.json({
      note: {
        ...note,
        tags: JSON.parse(note.tags || '[]'),
        ai_action_items: JSON.parse(note.ai_action_items || '[]'),
      }
    });
  } catch (err) {
    console.error('Shared note error:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

module.exports = router;
