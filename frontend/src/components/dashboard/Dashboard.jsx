import { useState, useEffect } from 'react';
import { insightsAPI } from '../../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FileText, Archive, Globe, Sparkles, Zap, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insightsAPI.get()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="dash-loading"><div className="spinner" /></div>
  );
  if (!data) return <div className="dash-loading">Failed to load insights</div>;

  const statCards = [
    { label: 'Total Notes', value: data.total_notes, icon: FileText, color: 'amber' },
    { label: 'Archived', value: data.archived_notes, icon: Archive, color: 'muted' },
    { label: 'Shared', value: data.shared_notes, icon: Globe, color: 'teal' },
    { label: 'AI Summaries', value: data.ai_stats.notes_with_summary, icon: Sparkles, color: 'amber' },
  ];

  return (
    <div className="dashboard fade-in">
      <div className="dash-header">
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-subtitle">Your productivity at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`stat-card stat-${color}`}>
            <div className="stat-icon"><Icon size={20} /></div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* Weekly Activity */}
        <div className="dash-card">
          <h2 className="dash-card-title">
            <Zap size={16} color="var(--amber)" />
            Weekly Activity
          </h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.weekly_activity} barSize={22}>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                tickFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 12 }}
                cursor={{ fill: 'var(--border)' }}
                labelFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.weekly_activity.map((entry, i) => (
                  <Cell key={i} fill={entry.count > 0 ? 'var(--amber)' : 'var(--bg-3)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Tags */}
        <div className="dash-card">
          <h2 className="dash-card-title">
            <Tag size={16} color="var(--teal)" />
            Top Tags
          </h2>
          {data.top_tags.length === 0 ? (
            <div className="dash-empty">No tags yet</div>
          ) : (
            <div className="tags-list">
              {data.top_tags.map(({ tag, count }, i) => (
                <div key={tag} className="tag-row">
                  <div className="tag-rank">#{i + 1}</div>
                  <div className="tag-name">{tag}</div>
                  <div className="tag-bar-wrap">
                    <div
                      className="tag-bar"
                      style={{ width: `${(count / data.top_tags[0].count) * 100}%` }}
                    />
                  </div>
                  <div className="tag-count">{count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notes */}
        <div className="dash-card dash-card-wide">
          <h2 className="dash-card-title">
            <FileText size={16} color="var(--amber)" />
            Recently Edited
          </h2>
          {data.recent_notes.length === 0 ? (
            <div className="dash-empty">No notes yet</div>
          ) : (
            <div className="recent-notes">
              {data.recent_notes.map(note => (
                <div key={note.id} className="recent-note-row">
                  <div className="recent-note-info">
                    <span className="recent-note-title">{note.title}</span>
                    <span className="recent-note-cat">{note.category}</span>
                  </div>
                  <div className="recent-note-meta">
                    <div className="recent-note-tags">
                      {note.tags?.slice(0, 2).map(t => <span key={t} className="tag-chip">{t}</span>)}
                    </div>
                    <span className="recent-note-time">
                      {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Stats */}
        <div className="dash-card">
          <h2 className="dash-card-title">
            <Sparkles size={16} color="var(--amber)" />
            AI Usage
          </h2>
          <div className="ai-stats">
            <div className="ai-stat-item">
              <div className="ai-stat-val">{data.ai_stats.total_generations}</div>
              <div className="ai-stat-lbl">Summaries Generated</div>
            </div>
            <div className="ai-stat-item">
              <div className="ai-stat-val">{data.ai_stats.total_tokens?.toLocaleString() || 0}</div>
              <div className="ai-stat-lbl">Tokens Used</div>
            </div>
            <div className="ai-stat-item">
              <div className="ai-stat-val">{data.ai_stats.notes_with_summary}</div>
              <div className="ai-stat-lbl">Notes with Summary</div>
            </div>
          </div>
        </div>

        {/* Categories */}
        {data.categories.length > 0 && (
          <div className="dash-card">
            <h2 className="dash-card-title">
              <FileText size={16} color="var(--teal)" />
              By Category
            </h2>
            <div className="categories-list">
              {data.categories.map(({ category, count }) => (
                <div key={category} className="category-row">
                  <span className="category-name">{category}</span>
                  <span className="category-count badge">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
