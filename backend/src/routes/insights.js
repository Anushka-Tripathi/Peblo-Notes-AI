const express = require('express');
const { query, get } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /insights - productivity dashboard data
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;

    // Total notes
    const totalResult = get(
      'SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND is_archived = 0',
      [userId]
    );

    // Recently edited notes (last 7)
    const recentNotes = query(
      `SELECT id, title, updated_at, tags, category FROM notes 
       WHERE user_id = ? AND is_archived = 0 
       ORDER BY updated_at DESC LIMIT 7`,
      [userId]
    ).map(n => ({ ...n, tags: JSON.parse(n.tags || '[]') }));

    // Most used tags
    const allNotes = query(
      'SELECT tags FROM notes WHERE user_id = ? AND is_archived = 0',
      [userId]
    );
    const tagCounts = {};
    allNotes.forEach(note => {
      const tags = JSON.parse(note.tags || '[]');
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));

    // AI usage stats
    const aiStats = get(
      'SELECT COUNT(*) as total_generations, SUM(tokens_used) as total_tokens FROM ai_usage WHERE user_id = ?',
      [userId]
    );

    // Notes with AI summaries
    const aiSummaryCount = get(
      'SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND ai_summary IS NOT NULL',
      [userId]
    );

    // Weekly activity (last 7 days)
    const weeklyActivity = query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM activity_log 
       WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    );

    // Fill in missing days
    const activityMap = {};
    weeklyActivity.forEach(d => { activityMap[d.date] = d.count; });
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      last7Days.push({ date: dateStr, count: activityMap[dateStr] || 0 });
    }

    // Category breakdown
    const categories = query(
      `SELECT category, COUNT(*) as count FROM notes 
       WHERE user_id = ? AND is_archived = 0 
       GROUP BY category ORDER BY count DESC`,
      [userId]
    );

    // Archived count
    const archivedCount = get(
      'SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND is_archived = 1',
      [userId]
    );

    // Public/shared count
    const sharedCount = get(
      'SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND is_public = 1',
      [userId]
    );

    res.json({
      total_notes: totalResult?.count || 0,
      archived_notes: archivedCount?.count || 0,
      shared_notes: sharedCount?.count || 0,
      recent_notes: recentNotes,
      top_tags: topTags,
      ai_stats: {
        total_generations: aiStats?.total_generations || 0,
        total_tokens: aiStats?.total_tokens || 0,
        notes_with_summary: aiSummaryCount?.count || 0,
      },
      weekly_activity: last7Days,
      categories,
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

module.exports = router;
