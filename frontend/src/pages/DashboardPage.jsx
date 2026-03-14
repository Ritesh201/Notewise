import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../utils/api.js";
import NoteCard from "../components/NoteCard.jsx";
import NoteEditor from "../components/NoteEditor.jsx";
import SearchBar from "../components/SearchBar.jsx";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [filtered, setFiltered] = useState(null); // null = show all
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null=closed, {}=new, note=edit
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.getNotes(token);
      setNotes(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setFiltered(null); setSearchActive(false); return; }
    setSearchActive(true);
    try {
      const results = await api.searchNotes(token, q);
      setFiltered(results);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editing?.id) {
        const updated = await api.updateNote(token, editing.id, data);
        setNotes((n) => n.map((x) => (x.id === updated.id ? updated : x)));
        if (filtered) setFiltered((f) => f.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await api.createNote(token, data);
        setNotes((n) => [created, ...n]);
        if (filtered) setFiltered((f) => [created, ...f]);
      }
      setEditing(null);
    } catch (e) {
      throw e; // let editor show error
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.deleteNote(token, id);
      setNotes((n) => n.filter((x) => x.id !== id));
      if (filtered) setFiltered((f) => f.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const displayed = filtered ?? notes;
  const initials = user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="dash-root">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo-mark">N</span>
          <span className="sidebar-logo-text">NoteWise</span>
        </div>

        <button className="sidebar-new-btn" onClick={() => setEditing({})}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New note
        </button>

        <div className="sidebar-stats">
          <div className="stat-item">
            <span className="stat-num">{notes.length}</span>
            <span className="stat-label">notes</span>
          </div>
        </div>

        <div className="sidebar-spacer" />

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-email">{user?.email}</p>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign out">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <header className="dash-header">
          <div className="dash-header-left">
            <h2 className="dash-title">
              {searchActive ? `Results for "${searchQuery}"` : "My Notes"}
            </h2>
            {searchActive && (
              <span className="result-count">
                {displayed.length} {displayed.length === 1 ? "note" : "notes"} found
              </span>
            )}
          </div>
          <SearchBar onSearch={handleSearch} />
        </header>

        {error && (
          <div className="dash-error">
            {error}
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {loading ? (
          <div className="notes-grid">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="skeleton" style={{ height: 160, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            {searchActive ? (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No matching notes</h3>
                <p>Try a different query or <button onClick={() => handleSearch("")}>clear search</button></p>
              </>
            ) : (
              <>
                <div className="empty-icon">✦</div>
                <h3>Your canvas is empty</h3>
                <p>Create your first note to get started</p>
                <button className="empty-cta" onClick={() => setEditing({})}>New note</button>
              </>
            )}
          </div>
        ) : (
          <div className="notes-grid">
            {displayed.map((note, i) => (
              <NoteCard
                key={note.id}
                note={note}
                score={note.score}
                style={{ animationDelay: `${i * 0.04}s` }}
                onEdit={() => setEditing(note)}
                onDelete={() => handleDelete(note.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Editor modal */}
      {editing !== null && (
        <NoteEditor
          note={editing?.id ? editing : null}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
