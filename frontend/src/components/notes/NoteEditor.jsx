import { useState, useEffect, useRef, useCallback } from 'react';
import { notesAPI } from '../../api';
import toast from 'react-hot-toast';
import {
  Sparkles, Trash2, Archive, Globe, GlobeOff, X,
  Tag, Plus, Check, Copy, ExternalLink, ChevronDown,
  Save, Loader2, Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './Notes.css';

const CATEGORIES = ['General', 'Work', 'Personal', 'Ideas', 'Learning', 'Project'];

export default function NoteEditor({ note, onUpdate, onDelete, onArchive, onClose }) {
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [tags, setTags] = useState(note.tags || []);
  const [category, setCategory] = useState(note.category || 'General');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [shareUrl, setShareUrl] = useState(
    note.share_id ? `${window.location.origin}/shared/${note.share_id}` : null
  );
  const saveTimer = useRef(null);
  const isFirstRender = useRef(true);

  // Sync note changes when selecting different note
  useEffect(() => {
    setTitle(note.title || '');
    setContent(note.content || '');
    setTags(note.tags || []);
    setCategory(note.category || 'General');
    setShowAI(!!note.ai_summary);
    setShareUrl(note.share_id ? `${window.location.origin}/shared/${note.share_id}` : null);
    isFirstRender.current = true;
  }, [note.id]);

  // Auto-save
  const saveNote = useCallback(async (t, c, tg, cat) => {
    setSaving(true);
    try {
      const { data } = await notesAPI.update(note.id, { title: t, content: c, tags: tg, category: cat });
      onUpdate(data.note);
    } catch (err) {
      toast.error('Auto-save failed');
    } finally {
      setSaving(false);
    }
  }, [note.id, onUpdate]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(title, content, tags, category), 1000);
    return () => clearTimeout(saveTimer.current);
  }, [title, content, tags, category, saveNote]);

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (!tags.includes(newTag)) setTags(prev => [...prev, newTag]);
      setTagInput('');
    }
  };
  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  const handleAISummary = async () => {
    if (!content.trim() || content.trim().length < 10) {
      toast.error('Add more content before generating AI summary');
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await notesAPI.generateSummary(note.id);
      onUpdate(data.note);
      setShowAI(true);
      toast.success('AI summary generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const { data } = await notesAPI.share(note.id);
      onUpdate(data.note);
      const url = `${window.location.origin}/shared/${data.note.share_id}`;
      setShareUrl(url);
      setShowSharePanel(true);
    } catch { toast.error('Failed to update share settings'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    try {
      await notesAPI.delete(note.id);
      onDelete(note.id);
    } catch { toast.error('Failed to delete note'); }
  };

  const handleArchive = async () => {
    try {
      const { data } = await notesAPI.update(note.id, { is_archived: !note.is_archived });
      onArchive(data.note);
      toast.success(data.note.is_archived ? 'Note archived' : 'Note restored');
    } catch { toast.error('Failed to archive note'); }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied!');
  };

  const applyAISuggestedTitle = () => {
    if (note.ai_suggested_title) setTitle(note.ai_suggested_title);
  };

  return (
    <div className="note-editor fade-in">
      {/* Editor Header */}
      <div className="editor-header">
        <div className="editor-meta">
          <div className="category-selector" onClick={() => setShowCategoryMenu(c => !c)}>
            <span className="category-badge">{category}</span>
            <ChevronDown size={12} />
            {showCategoryMenu && (
              <div className="category-menu">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    className={`category-option ${category === c ? 'active' : ''}`}
                    onClick={() => { setCategory(c); setShowCategoryMenu(false); }}
                  >
                    {category === c && <Check size={12} />}
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="editor-time">
            {saving ? (
              <><Loader2 size={12} className="spin" /> Saving...</>
            ) : (
              <><Clock size={12} /> {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</>
            )}
          </span>
        </div>

        <div className="editor-actions">
          <button
            className={`btn btn-sm ${note.ai_summary ? 'btn-ghost' : 'btn-ghost'} ai-btn`}
            onClick={handleAISummary}
            disabled={aiLoading}
            title="Generate AI Summary"
          >
            {aiLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
            {aiLoading ? 'Generating...' : 'AI Summary'}
          </button>
          <button
            className={`btn btn-sm btn-ghost ${note.is_public ? 'active-teal' : ''}`}
            onClick={() => { handleShare(); setShowSharePanel(true); }}
            title={note.is_public ? 'Shared publicly' : 'Share note'}
          >
            {note.is_public ? <Globe size={14} /> : <GlobeOff size={14} />}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={handleArchive} title="Archive">
            <Archive size={14} />
          </button>
          <button className="btn btn-sm btn-ghost danger-hover" onClick={handleDelete} title="Delete">
            <Trash2 size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        className="note-title-input"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Note title..."
      />

      {/* Tags */}
      <div className="tags-bar">
        {tags.map(t => (
          <span key={t} className="tag-chip editable">
            {t}
            <button onClick={() => removeTag(t)}><X size={10} /></button>
          </span>
        ))}
        <input
          className="tag-input"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Add tag..."
        />
      </div>

      {/* Share Panel */}
      {showSharePanel && shareUrl && (
        <div className="share-panel fade-in">
          <div className="share-panel-header">
            <Globe size={14} color="var(--teal)" />
            <span>{note.is_public ? 'Note is publicly shared' : 'Share link generated'}</span>
            <button className="btn btn-ghost btn-icon btn-sm ml-auto" onClick={() => setShowSharePanel(false)}>
              <X size={12} />
            </button>
          </div>
          <div className="share-url-row">
            <input className="input share-url-input" value={shareUrl} readOnly />
            <button className="btn btn-secondary btn-sm" onClick={copyShareLink}>
              <Copy size={13} /> Copy
            </button>
            <a className="btn btn-ghost btn-sm" href={shareUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={13} />
            </a>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleShare}>
            {note.is_public ? 'Make Private' : 'Make Public'}
          </button>
        </div>
      )}

      {/* AI Summary Panel */}
      {showAI && note.ai_summary && (
        <div className="ai-panel fade-in">
          <div className="ai-panel-header">
            <Sparkles size={14} color="var(--amber)" />
            <span>AI Insights</span>
            <button className="btn btn-ghost btn-icon btn-sm ml-auto" onClick={() => setShowAI(false)}>
              <X size={12} />
            </button>
          </div>
          <div className="ai-content">
            <div className="ai-section">
              <div className="ai-label">Summary</div>
              <p className="ai-text">{note.ai_summary}</p>
            </div>
            {note.ai_action_items?.length > 0 && (
              <div className="ai-section">
                <div className="ai-label">Action Items</div>
                <ul className="ai-actions">
                  {note.ai_action_items.map((item, i) => (
                    <li key={i}><Check size={11} />{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {note.ai_suggested_title && note.ai_suggested_title !== title && (
              <div className="ai-section">
                <div className="ai-label">Suggested Title</div>
                <div className="ai-suggestion-row">
                  <span className="ai-text">"{note.ai_suggested_title}"</span>
                  <button className="btn btn-sm btn-secondary" onClick={applyAISuggestedTitle}>
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Editor */}
      <textarea
        className="note-content-editor"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Start writing your note... (Markdown supported)"
      />
    </div>
  );
}
