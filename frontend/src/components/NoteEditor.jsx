import { useState, useEffect, useRef } from "react";
import "./NoteEditor.css";

export default function NoteEditor({ note, onSave, onClose }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ title: title.trim(), content: content.trim() });
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="editor-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="editor-modal fade-in">
        <div className="editor-header">
          <span className="editor-label">{note ? "Edit note" : "New note"}</span>
          <div className="editor-header-actions">
            <span className="word-count">{wordCount} words</span>
            <button className="editor-close" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <input
          ref={titleRef}
          className="editor-title-input"
          placeholder="Note title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        />

        <textarea
          className="editor-content-input"
          placeholder="Write your note here…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {error && <p className="editor-error">{error}</p>}

        <div className="editor-footer">
          <button className="editor-cancel" onClick={onClose}>Cancel</button>
          <button
            className="editor-save"
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
          >
            {saving ? "Saving…" : note ? "Save changes" : "Create note"}
          </button>
        </div>
      </div>
    </div>
  );
}
