import { formatDistanceToNow } from 'date-fns';
import { Sparkles, Globe } from 'lucide-react';

export default function NoteCard({ note, isActive, onClick }) {
  const preview = note.content?.replace(/[#*`>\-\[\]]/g, '').slice(0, 100) || 'No content';
  const timeAgo = formatDistanceToNow(new Date(note.updated_at), { addSuffix: true });

  return (
    <div className={`note-card ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="note-card-header">
        <h3 className="note-card-title">{note.title || 'Untitled Note'}</h3>
        <div className="note-card-meta-icons">
          {note.ai_summary && <Sparkles size={11} color="var(--amber)" />}
          {note.is_public && <Globe size={11} color="var(--teal)" />}
        </div>
      </div>
      <p className="note-card-preview">{preview}</p>
      <div className="note-card-footer">
        <div className="note-card-tags">
          {note.tags?.slice(0, 3).map(t => (
            <span key={t} className="tag-chip">{t}</span>
          ))}
          {note.tags?.length > 3 && <span className="tag-chip">+{note.tags.length - 3}</span>}
        </div>
        <span className="note-card-time">{timeAgo}</span>
      </div>
    </div>
  );
}
