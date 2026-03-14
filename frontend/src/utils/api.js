const BASE = "/api";

async function request(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login:    (body) => request("/auth/login",    { method: "POST", body: JSON.stringify(body) }),

  getNotes:    (token)         => request("/notes",         {}, token),
  createNote:  (token, body)   => request("/notes",         { method: "POST",   body: JSON.stringify(body) }, token),
  updateNote:  (token, id, b)  => request(`/notes/${id}`,   { method: "PUT",    body: JSON.stringify(b) }, token),
  deleteNote:  (token, id)     => request(`/notes/${id}`,   { method: "DELETE" }, token),
  searchNotes: (token, q)      => request(`/notes/search?q=${encodeURIComponent(q)}`, {}, token),
};
