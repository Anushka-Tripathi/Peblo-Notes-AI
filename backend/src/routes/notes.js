const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, run, get } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const { generateAISummary } = require('./ai');

const router = express.Router();

// Apply auth to all routes
router.use(authMiddleware);

// Helper to parse note from DB
function parseNote(note) {
  if (!note) return null;
  return {
    ...note,
    tags: JSON.parse(note.tags || '[]'),
    ai_action_items: JSON.parse(note.ai_action_items || '[]'),
    is_archived: note.is_archived === 1,
    is_public: note.is_public === 1,
  };
}

// GET /notes - list notes with search/filter
router.get('/', (req, res) => {
  try {
    const { search, tag, category, archived, sort = 'updated_at' } = req.query;
    const userId = req.user.id;

    let sql = `SELECT * FROM notes WHERE user_id = ?`;
    const params = [userId];

    // Archived filter
    const showArchived = archived === 'true' ? 1 : 0;
    sql += ` AND is_archived = ?`;
    params.push(showArchived);

    // Category filter
    if (category && category !== 'all') {
      sql += ` AND category = ?`;
      params.push(category);
    }

    // Search
    if (search) {
      sql += ` AND (title LIKE ? OR content LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Tag filter - tags stored as JSON array string
    if (tag) {
      sql += ` AND tags LIKE ?`;
      params.push(`%"${tag}"%`);
    }

    // Sorting
    const allowedSorts = ['updated_at', 'created_at', 'title'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'updated_at';
    sql += ` ORDER BY ${sortCol} DESC`;

    const notes = query(sql, params).map(parseNote);
    res.json({ notes });
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /notes/:id
router.get('/:id', (req, res) => {
  const note = get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json({ note: parseNote(note) });
});

// POST /notes - create note
router.post('/', (req, res) => {
  try {
    const { title = 'Untitled Note', content = '', tags = [], category = 'General' } = req.body;
    const id = `NOTE_${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const userId = req.user.id;

    run(
      `INSERT INTO notes (id, user_id, title, content, tags, category, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, userId, title, content, JSON.stringify(tags), category]
    );

    // Log activity
    logActivity(userId, 'create', id);

    const note = get('SELECT * FROM notes WHERE id = ?', [id]);
    res.status(201).json({ note: parseNote(note) });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PATCH /notes/:id - update note
router.patch('/:id', (req, res) => {
  try {
    const { title, content, tags, category, is_archived, is_public } = req.body;
    const { id } = req.params;
    const userId = req.user.id;

    const existing = get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) return res.status(404).json({ error: 'Note not found' });

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (is_archived !== undefined) { updates.push('is_archived = ?'); params.push(is_archived ? 1 : 0); }
    if (is_public !== undefined) { updates.push('is_public = ?'); params.push(is_public ? 1 : 0); }

    updates.push("updated_at = datetime('now')");
    params.push(id, userId);

    run(`UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);

    logActivity(userId, 'edit', id);

    const note = get('SELECT * FROM notes WHERE id = ?', [id]);
    res.json({ note: parseNote(note) });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /notes/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = get('SELECT id FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'Note not found' });

    run('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// POST /notes/:id/generate-summary - AI summary generation
router.post('/:id/generate-summary', async (req, res) => {
  try {
    const note = get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (!note.content || note.content.trim().length < 10) {
      return res.status(400).json({ error: 'Note content is too short to summarize' });
    }

    const aiResult = await generateAISummary(note.content, note.title);

    run(
      `UPDATE notes SET ai_summary = ?, ai_action_items = ?, ai_suggested_title = ?, 
       ai_generated_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [
        aiResult.summary,
        JSON.stringify(aiResult.action_items),
        aiResult.suggested_title,
        note.id
      ]
    );

    // Log AI usage
    run(
      `INSERT INTO ai_usage (id, user_id, note_id, action, tokens_used, created_at) 
       VALUES (?, ?, ?, 'summary', ?, datetime('now'))`,
      [uuidv4(), req.user.id, note.id, aiResult.tokens_used || 0]
    );

    const updated = get('SELECT * FROM notes WHERE id = ?', [note.id]);
    res.json({ note: parseNote(updated), ai: aiResult });
  } catch (err) {
    console.error('AI summary error:', err);
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
});

// POST /notes/:id/share - toggle public share
router.post('/:id/share', (req, res) => {
  try {
    const note = get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    let shareId = note.share_id;
    if (!shareId) {
      shareId = uuidv4().replace(/-/g, '').slice(0, 12);
      run('UPDATE notes SET share_id = ?, is_public = 1, updated_at = datetime(\'now\') WHERE id = ?',
        [shareId, note.id]);
    } else {
      // Toggle public status
      const newPublic = note.is_public === 1 ? 0 : 1;
      run('UPDATE notes SET is_public = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [newPublic, note.id]);
    }

    const updated = get('SELECT * FROM notes WHERE id = ?', [note.id]);
    res.json({ note: parseNote(updated), share_url: `/shared/${updated.share_id}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update share settings' });
  }
});

function logActivity(userId, action, noteId) {
  try {
    run(
      `INSERT INTO activity_log (id, user_id, action, note_id, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
      [uuidv4(), userId, action, noteId]
    );
  } catch (e) { /* non-critical */ }
}

module.exports = router;
