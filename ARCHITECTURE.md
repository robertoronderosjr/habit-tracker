# Habit Tracker — Architecture

## Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Database:** SQLite via `better-sqlite3`
- **Auth:** `iron-session` (cookie-based)

---

## File Structure

```
habit-tracker/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing / redirect
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (app)/
│       ├── layout.tsx              # Protected layout (auth guard)
│       ├── dashboard/page.tsx      # Today's habits overview
│       ├── habits/
│       │   ├── page.tsx            # List all habits
│       │   └── [id]/page.tsx       # Single habit + history
│       └── settings/page.tsx
├── components/
│   ├── HabitCard.tsx
│   ├── HabitForm.tsx
│   ├── StreakBadge.tsx
│   └── ui/                         # shadcn-style base components
├── lib/
│   ├── db.ts                       # better-sqlite3 singleton + migrations
│   ├── session.ts                  # iron-session config & helpers
│   └── habits.ts                   # Business logic (queries)
├── app/api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── register/route.ts
│   │   └── logout/route.ts
│   ├── habits/
│   │   ├── route.ts                # GET (list) / POST (create)
│   │   └── [id]/
│   │       ├── route.ts            # GET / PUT / DELETE
│   │       └── log/route.ts        # POST — mark complete for a date
│   └── me/route.ts                 # GET current user
├── middleware.ts                   # Protect /app/* routes
├── data/
│   └── habits.db                   # SQLite file (gitignored)
├── public/
├── .env.local                      # SESSION_SECRET
├── package.json
├── tailwind.config.ts
└── next.config.ts
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE,
  name       TEXT    NOT NULL,
  password   TEXT    NOT NULL,  -- bcrypt hash
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Habits
CREATE TABLE habits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  description TEXT,
  frequency   TEXT    NOT NULL DEFAULT 'daily',  -- daily | weekly
  color       TEXT    NOT NULL DEFAULT '#6366f1',
  archived    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Habit Logs (completions)
CREATE TABLE habit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       TEXT    NOT NULL,  -- YYYY-MM-DD
  note       TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(habit_id, date)
);

-- Indexes
CREATE INDEX idx_habits_user_id      ON habits(user_id);
CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date);
```

---

## API Routes

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Create account | — |
| POST | `/api/auth/login` | Login, set session cookie | — |
| POST | `/api/auth/logout` | Clear session | ✓ |
| GET | `/api/me` | Current user info | ✓ |
| GET | `/api/habits` | List user's habits | ✓ |
| POST | `/api/habits` | Create habit | ✓ |
| GET | `/api/habits/[id]` | Get habit + recent logs | ✓ |
| PUT | `/api/habits/[id]` | Update habit | ✓ |
| DELETE | `/api/habits/[id]` | Archive habit | ✓ |
| POST | `/api/habits/[id]/log` | Mark habit complete for date | ✓ |
| DELETE | `/api/habits/[id]/log` | Unmark habit for date | ✓ |

---

## Auth Flow (iron-session)

1. **Register:** hash password with `bcrypt`, insert user, set session.
2. **Login:** compare hash, store `{ userId, email, name }` in encrypted cookie.
3. **Middleware:** checks session cookie on `/(app)/*` routes, redirects to `/login` if missing.
4. **Session secret:** 32-char random string in `SESSION_SECRET` env var.

---

## Key Decisions

- **SQLite + better-sqlite3:** Sync API, zero infra, perfect for single-user/small-team app.
- **iron-session:** Simple encrypted cookies, no JWT complexity, works natively with Next.js Route Handlers.
- **App Router layouts:** Auth guard in `(app)/layout.tsx` using server-side session check — no client flash.
- **`data/` directory gitignored:** DB file stays local; migrations run on startup via `lib/db.ts`.
- **Streaks:** Computed at query time in `lib/habits.ts` — no denormalized streak counter that can drift.
