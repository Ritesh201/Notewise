import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../utils/api.js";
import "./AuthPage.css";

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fn = mode === "login" ? api.login : api.register;
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const { token, user } = await fn(body);
      login(token, user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-logo-mark">N</span>
          <span className="auth-logo-text">NoteWise</span>
        </div>
        <div className="auth-hero">
          <h1 className="auth-tagline">Think it.<br />Write it.<br /><em>Find it.</em></h1>
          <p className="auth-sub">Your notes, semantically searchable. Ask questions, get answers from your own writing.</p>
        </div>
        <div className="auth-footer-note">AI-powered · Private · Yours</div>
      </div>

      <div className="auth-right">
        <div className="auth-card fade-in">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => { setMode("login"); setError(""); }}
            >Sign in</button>
            <button
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => { setMode("register"); setError(""); }}
            >Create account</button>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === "register" && (
              <div className="field">
                <label>Full name</label>
                <input
                  type="text"
                  placeholder="Ada Lovelace"
                  value={form.name}
                  onChange={set("name")}
                  required
                  autoFocus
                />
              </div>
            )}
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                required
                autoFocus={mode === "login"}
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder={mode === "register" ? "at least 6 characters" : "••••••••"}
                value={form.password}
                onChange={set("password")}
                required
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
