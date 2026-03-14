import { useState, useEffect, useRef } from "react";
import "./SearchBar.css";

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState("");
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!value.trim()) { onSearch(""); setSearching(false); return; }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      await onSearch(value);
      setSearching(false);
    }, 500);
    return () => clearTimeout(timerRef.current);
  }, [value]);

  const clear = () => { setValue(""); onSearch(""); };

  return (
    <div className="search-wrap">
      <div className={`search-bar ${value ? "has-value" : ""}`}>
        <span className="search-icon">
          {searching
            ? <span className="search-spinner" />
            : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )
          }
        </span>
        <input
          className="search-input"
          type="text"
          placeholder="Search your notes semantically…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {value && (
          <button className="search-clear" onClick={clear} title="Clear search">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      {!value && (
        <p className="search-hint">Ask naturally — "meeting notes from last week" or "ideas about machine learning"</p>
      )}
    </div>
  );
}
