# NoteWise — AI-Powered Notes & Search App

A full-stack notes application with semantic AI search, built with React,Spring Boot, and PostgreSQL. Fully containerized with Docker.

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Ritesh201/Notewise
cd notewise



# 2. Start everything
docker compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:4000
# Health   → http://localhost:4000/health
```

That's it. The database schema is created automatically on first start.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────┐
│   React (Vite)  │────▶│  Express (Node.js)   │────▶│  PostgreSQL 16 │
│  nginx :80      │     │  Port 4000           │     │  Port 5432     │
│  Container: 3000│     │  Container: 4000     │     │  (internal)    │
└─────────────────┘     └──────────────────────┘     └────────────────┘
```

### Services

| Container | Image | Purpose |
|-----------|-------|---------|
| `notewise_frontend` | node:20-alpine → nginx:alpine | React SPA + nginx reverse proxy |
| `notewise_backend` | node:20-alpine | REST API, auth, embeddings |
| `notewise_db` | postgres:16-alpine | User accounts and notes storage |

---

## Tech Stack

**Frontend**
- React 18 with hooks
- React Router v6 for client-side routing
- Vite for bundling
- Vanilla CSS with CSS custom properties (no framework)
- Served by nginx in production

**Backend**
- Java 21 + Spring Boot 3.2
- Spring Security (stateless JWT via jjwt 0.12)
- Spring Data JPA + Hibernate (PostgreSQL dialect)
- Flyway for schema migrations
- Spring WebFlux `WebClient` for Anthropic API calls
- Lombok for boilerplate reduction
- Two-stage Docker build (Maven builder → JRE-only runtime image)

**Database**
- PostgreSQL 16
- Schema: `users` table + `notes` table with `embedding FLOAT8[]` column

---

## API Reference

### Auth

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{ name, email, password }` | Create account |
| POST | `/api/auth/login` | `{ email, password }` | Sign in, returns JWT |

### Notes (all require `Authorization: Bearer <token>`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notes` | List all user notes |
| POST | `/api/notes` | Create a note `{ title, content }` |
| PUT | `/api/notes/:id` | Update a note `{ title, content }` |
| DELETE | `/api/notes/:id` | Delete a note |
| GET | `/api/notes/search?q=...` | Semantic search — returns notes ranked by relevance |

---

## AI Search — How It Works

The search system supports two modes, selected automatically:

### With `ANTHROPIC_API_KEY` (recommended)
- Uses **Voyage-3** embeddings via the Anthropic API
- Each note is embedded when created/updated; embeddings are stored in Postgres as `FLOAT8[]`
- At search time, the query is embedded and **cosine similarity** is computed against all user notes
- Results are ranked by similarity score and filtered above a 0.05 threshold

### Without API key (local fallback)
- Uses a **TF-IDF + cosine similarity** approach implemented from scratch in `embeddings.js`
- Stop words are stripped, term frequencies are computed, IDF weights are calculated from the user's note corpus
- Vectors are L2-normalized before cosine comparison
- Slightly less semantic than dense embeddings, but no external dependencies or cost

Both modes return notes with a `score` field (0–1) visible as a match percentage on the card.

---

## Database Schema

```sql
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  password   TEXT NOT NULL,          -- bcrypt hash
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notes (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  embedding  FLOAT8[],               -- stored vector for similarity search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *(empty)* | Enables Voyage-3 embeddings. Falls back to TF-IDF if absent. |
| `JWT_SECRET` | `super_secret_jwt_key_change_in_production` | **Change this in production** |
| `SPRING_DATASOURCE_URL` | Set in compose | JDBC URL e.g. `jdbc:postgresql://db:5432/notewise` |
| `SPRING_DATASOURCE_USERNAME` | Set in compose | DB username |
| `SPRING_DATASOURCE_PASSWORD` | Set in compose | DB password |
| `PORT` | `4000` | Backend port |

---

## Development (without Docker)

```bash
# Start postgres locally, then:

# Backend (requires Java 21 + Maven)
cd backend
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/notewise
export SPRING_DATASOURCE_USERNAME=notewise
export SPRING_DATASOURCE_PASSWORD=notewise_secret
export JWT_SECRET=local_dev_secret_at_least_32_chars_long
mvn spring-boot:run

# Frontend
cd frontend
npm install
npm run dev   # proxies /api to localhost:4000
```

---

## Assumptions

- One user's notes are isolated from another's — no sharing or collaboration
- Embeddings are recomputed on every note save (acceptable for this scale; a queue/worker would be better at scale)
- The TF-IDF fallback builds IDF weights from the querying user's own notes corpus only
- JWT tokens expire in 7 days; no refresh token flow is implemented
- Passwords require a minimum of 6 characters (no complexity rules)
- The search endpoint is `GET /notes/search` — Spring maps it before the `{id}` path variable because literal segments take priority in `RequestMappingHandlerMapping`

---

## What Could Be Improved With More Time

### Scalability
- **pgvector extension**: Store embeddings as native `vector` type for indexed approximate nearest-neighbour search (`ivfflat` or `hnsw`) instead of full-table scan + in-memory cosine
- **Embedding queue**: Offload embedding generation to a background worker (BullMQ + Redis) so note saves are instant
- **Caching**: Cache embedding lookups with Redis for repeated searches

### Features
- Rich text editing (Tiptap or Slate.js)
- Note tagging and folders
- Full-text search as a fallback/complement to semantic search
- Note sharing / collaboration
- Markdown rendering in the viewer
- Keyboard shortcuts

### Reliability
- Refresh token rotation
- Rate limiting (express-rate-limit)
- Input sanitization (DOMPurify on the frontend)
- Health-check endpoint used by a readiness probe in Kubernetes

### Observability
- Structured logging (Pino)
- Request tracing
- Error tracking (Sentry)

### Testing
- Unit tests for the TF-IDF/embedding utilities (Jest/Vitest)
- Integration tests for auth and notes routes (Supertest)
- E2E tests (Playwright)
