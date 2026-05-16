import { useState, useEffect } from 'react';
import { notesAPI } from '../../api';
import { formatDistanceToNow } from 'date-fns';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ArchivedPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notesAPI.list({ archived: true })
      .then(r => setNotes(r.data.notes))
      .finally(() => setLoading(false));
  }, []);

  const restore = async (id) => {
    await notesAPI.update(id, { is_archived: false });
    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success('Note restored');
  };

  const deleteNote = async (id) => {
    if (!confirm('Permanently delete this note?')) return;
    await notesAPI.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success('Note deleted');
  };

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
        Archived Notes
      </h1>
      <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 20 }}>
        {notes.length} archived note{notes.length !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spinner" /></div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', paddingTop: 60, fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗃️</div>
          <p>No archived notes</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
          {notes.map(note => (
            <div key={note.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{note.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  Archived · last edited {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-secondary" onClick={() => restore(note.id)}>
                  <ArchiveRestore size={13} /> Restore
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => deleteNote(note.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
