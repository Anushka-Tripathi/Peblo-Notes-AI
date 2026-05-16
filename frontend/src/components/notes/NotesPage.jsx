import { useState, useEffect, useCallback } from 'react';
import { notesAPI } from '../../api';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import { Search, SlidersHorizontal, X, Tag, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import './Notes.css';

const CATEGORIES = ['All', 'General', 'Work', 'Personal', 'Ideas', 'Learning', 'Project'];

export default function NotesPage({ newNoteSignal }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('updated_at');
  const [allTags, setAllTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (search) params.search = search;
      if (activeTag) params.tag = activeTag;
      if (activeCategory !== 'all') params.category = activeCategory;
      const { data } = await notesAPI.list(params);
      setNotes(data.notes);
      // Collect all unique tags
      const tags = new Set();
      data.notes.forEach(n => n.tags?.forEach(t => tags.add(t)));
      setAllTags([...tags]);
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [search, activeTag, activeCategory, sort]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // New note signal from parent
  useEffect(() => {
    if (newNoteSignal) handleNewNote();
  }, [newNoteSignal]);

  const handleNewNote = async () => {
    try {
      const { data } = await notesAPI.create({ title: 'Untitled Note', content: '', tags: [], category: 'General' });
      setNotes(prev => [data.note, ...prev]);
      setSelectedNote(data.note);
    } catch { toast.error('Failed to create note'); }
  };

  const handleNoteUpdate = (updatedNote) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    setSelectedNote(updatedNote);
  };

  const handleNoteDelete = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    toast.success('Note deleted');
  };

  const handleNoteArchive = (note) => {
    setNotes(prev => prev.filter(n => n.id !== note.id));
    if (selectedNote?.id === note.id) setSelectedNote(null);
  };

  return (
    <div className="notes-page">
      {/* List Panel */}
      <div className={`notes-list-panel ${selectedNote ? 'note-open' : ''}`}>
        {/* Toolbar */}
        <div className="notes-toolbar">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>
          <button
            className={`btn btn-ghost btn-icon ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(f => !f)}
          >
            <SlidersHorizontal size={15} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={fetchNotes}>
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="filters-panel fade-in">
            <div className="filter-row">
              <span className="filter-label">Category</span>
              <div className="filter-chips">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    className={`chip ${activeCategory === c.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setActiveCategory(c.toLowerCase())}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-row">
              <span className="filter-label">Sort</span>
              <div className="filter-chips">
                {[['updated_at', 'Updated'], ['created_at', 'Created'], ['title', 'Title']].map(([val, label]) => (
                  <button
                    key={val}
                    className={`chip ${sort === val ? 'active' : ''}`}
                    onClick={() => setSort(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {allTags.length > 0 && (
              <div className="filter-row">
                <span className="filter-label">Tags</span>
                <div className="filter-chips">
                  <button className={`chip ${!activeTag ? 'active' : ''}`} onClick={() => setActiveTag('')}>All</button>
                  {allTags.map(t => (
                    <button
                      key={t}
                      className={`chip ${activeTag === t ? 'active amber' : ''}`}
                      onClick={() => setActiveTag(activeTag === t ? '' : t)}
                    >
                      <Tag size={10} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes Count */}
        <div className="notes-count">
          {loading ? 'Loading...' : `${notes.length} note${notes.length !== 1 ? 's' : ''}`}
        </div>

        {/* Notes List */}
        <div className="notes-list">
          {loading ? (
            <div className="empty-state"><div className="spinner" /></div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>{search || activeTag ? 'No notes match your search' : 'No notes yet. Create one!'}</p>
            </div>
          ) : (
            notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={selectedNote?.id === note.id}
                onClick={() => setSelectedNote(note)}
              />
            ))
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className={`notes-editor-panel ${selectedNote ? 'visible' : ''}`}>
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onUpdate={handleNoteUpdate}
            onDelete={handleNoteDelete}
            onArchive={handleNoteArchive}
            onClose={() => setSelectedNote(null)}
          />
        ) : (
          <div className="editor-empty">
            <div className="editor-empty-icon">✦</div>
            <p>Select a note or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
