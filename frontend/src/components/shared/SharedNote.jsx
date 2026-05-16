import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sharedAPI } from '../../api';
import { formatDistanceToNow } from 'date-fns';
import { Star, Sparkles, Check, Tag, Clock, User } from 'lucide-react';
import './SharedNote.css';

export default function SharedNote() {
  const { shareId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    sharedAPI.get(shareId)
      .then(r => setNote(r.data.note))
      .catch(err => setError(err.response?.data?.error || 'Note not found'))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return (
    <div className="shared-page"><div className="shared-loading"><div className="spinner" /></div></div>
  );

  if (error) return (
    <div className="shared-page">
      <div className="shared-error">
        <div className="shared-error-icon">✦</div>
        <h2>Note Not Found</h2>
        <p>{error}</p>
        <Link to="/" className="btn btn-primary">Go to Peblo Notes</Link>
      </div>
    </div>
  );

  return (
    <div className="shared-page">
      <div className="shared-bg" />
      <div className="shared-container fade-in">
        {/* Header */}
        <header className="shared-header">
          <Link to="/" className="shared-brand">
            <Star size={16} color="var(--amber)" fill="var(--amber)" />
            Peblo Notes
          </Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Get Started →</Link>
        </header>

        {/* Note Content */}
        <article className="shared-note">
          <div className="shared-note-meta">
            {note.category && <span className="badge">{note.category}</span>}
            <span className="shared-meta-item">
              <User size={12} />
              {note.author_name}
            </span>
            <span className="shared-meta-item">
              <Clock size={12} />
              {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
            </span>
          </div>

          <h1 className="shared-note-title">{note.title}</h1>

          {note.tags?.length > 0 && (
            <div className="shared-tags">
              <Tag size={12} color="var(--text-3)" />
              {note.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
            </div>
          )}

          {/* AI Summary */}
          {note.ai_summary && (
            <div className="shared-ai-block">
              <div className="shared-ai-header">
                <Sparkles size={14} color="var(--amber)" />
                AI Summary
              </div>
              <p className="shared-ai-summary">{note.ai_summary}</p>
              {note.ai_action_items?.length > 0 && (
                <div className="shared-ai-actions">
                  <div className="shared-ai-subheader">Action Items</div>
                  <ul>
                    {note.ai_action_items.map((item, i) => (
                      <li key={i}><Check size={12} />{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <hr className="divider" />

          <div className="shared-content">
            {note.content || <em className="text-muted">No content</em>}
          </div>
        </article>

        <footer className="shared-footer">
          <p>Created with <strong>Peblo Notes</strong> — Your AI-powered workspace</p>
          <Link to="/signup" className="btn btn-primary btn-sm">Start for free →</Link>
        </footer>
      </div>
    </div>
  );
}
