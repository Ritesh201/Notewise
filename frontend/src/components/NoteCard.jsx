import "./NoteCard.css";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NoteCard({ note, score, style, onEdit, onDelete }) {
  const preview = note.content.slice(0, 160) + (note.content.length > 160 ? "…" : "");
  const scorePercent = score != null ? Math.round(score * 100) : null;

  return (
    <div className="note-card fade-in" style={style} onClick={onEdit}>
      {scorePercent != null && (
        <div className="note-score" title="Semantic relevance">
          <div className="score-bar" style={{ width: `${scorePercent}%` }} />
          <span>{scorePercent}% match</span>
        </div>
      )}
      <h3 className="note-title">{note.title}</h3>
      <p className="note-preview">{preview}</p>
      <div className="note-meta">
        {/* <span>{timeAgo(note.updated_at)}</span> */}
        <div className="note-actions" onClick={(e) => e.stopPropagation()}>
          <button className="note-action-btn" onClick={onEdit} title="Edit">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="note-action-btn delete" onClick={onDelete} title="Delete">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5.5 3.5V2h3v1.5M5 5.5l.5 5M9 5.5l-.5 5M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
