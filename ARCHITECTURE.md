# Habit Tracker — Architecture

**Stack:** Next.js 15 (App Router), Tailwind CSS, SQLite (via better-sqlite3), TypeScript

---

## Database Schema

### `users`
```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### `habits`
```sql
CREATE TABLE habits (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  color        TEXT NOT NULL DEFAULT '#6366f1',   -- hex color for UI
  icon         TEXT NOT NULL DEFAULT '⭐',         -- emoji icon
  frequency    TEXT NOT NULL DEFAULT 'daily',     -- daily | weekly | custom
  target_days  TEXT,                              -- JSON array e.g. [1,2,3,4,5] for Mon-Fri
  is_archived  INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_habits_user_id ON habits(user_id);
```

### `habit_logs`
```sql
CREATE TABLE habit_logs (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  habit_id   TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_date TEXT NOT NULL,   -- ISO date string YYYY-MM-DD
  note       TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(habit_id, logged_date)
);

CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, logged_date);
```

---

## API Routes (Next.js Route Handlers)

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Login, returns JWT in httpOnly cookie |
| POST | `/api/auth/logout` | Clear auth cookie |
| GET  | `/api/auth/me` | Get current user info |

### Habits
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/habits` | List all habits for current user |
| POST   | `/api/habits` | Create a new habit |
| GET    | `/api/habits/[id]` | Get single habit |
| PATCH  | `/api/habits/[id]` | Update habit |
| DELETE | `/api/habits/[id]` | Archive (soft delete) habit |

### Habit Logs
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/habits/[id]/logs` | Get logs for a habit (with `?start=&end=` date range) |
| POST   | `/api/habits/[id]/logs` | Mark habit complete for a date |
| DELETE | `/api/habits/[id]/logs/[date]` | Un-mark a habit for a date |

### Stats
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stats/streak` | Current & longest streak per habit |
| GET | `/api/stats/summary?period=week\|month\|year` | Completion rate summary |

---

## File Structure

```
habit-tracker/
├── ARCHITECTURE.md
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                    # JWT_SECRET, DB_PATH
│
├── db/
│   ├── index.ts                  # better-sqlite3 singleton connection
│   ├── schema.sql                # Raw SQL schema (migrations)
│   └── migrations/
│       └── 001_initial.sql
│
├── lib/
│   ├── auth.ts                   # JWT helpers, session parsing
│   ├── db/
│   │   ├── users.ts              # User queries
│   │   ├── habits.ts             # Habit queries
│   │   └── habit-logs.ts         # Log queries + streak calc
│   └── utils.ts                  # Date helpers, validators
│
├── app/
│   ├── layout.tsx                # Root layout (fonts, providers)
│   ├── page.tsx                  # Landing / redirect to dashboard
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── dashboard/
│   │   ├── layout.tsx            # Sidebar + nav
│   │   ├── page.tsx              # Today's habits overview
│   │   ├── habits/
│   │   │   ├── page.tsx          # All habits list
│   │   │   └── new/page.tsx      # Create habit form
│   │   ├── stats/
│   │   │   └── page.tsx          # Stats & charts
│   │   └── settings/
│   │       └── page.tsx          # User preferences
│   │
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       ├── habits/
│       │   ├── route.ts          # GET /api/habits, POST /api/habits
│       │   └── [id]/
│       │       ├── route.ts      # GET, PATCH, DELETE /api/habits/[id]
│       │       └── logs/
│       │           ├── route.ts  # GET, POST /api/habits/[id]/logs
│       │           └── [date]/
│       │               └── route.ts  # DELETE /api/habits/[id]/logs/[date]
│       └── stats/
│           ├── streak/route.ts
│           └── summary/route.ts
│
├── components/
│   ├── ui/                       # Base shadcn-style primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── habits/
│   │   ├── HabitCard.tsx         # Daily check-off card
│   │   ├── HabitForm.tsx         # Create/edit form
│   │   ├── HabitList.tsx
│   │   └── StreakBadge.tsx
│   ├── stats/
│   │   ├── HeatmapCalendar.tsx   # GitHub-style completion heatmap
│   │   └── StreakChart.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── TopNav.tsx
│
├── hooks/
│   ├── useHabits.ts              # SWR/fetch hooks for habits
│   └── useStats.ts
│
└── types/
    └── index.ts                  # Shared TypeScript interfaces
```

---

## Key Design Decisions

1. **SQLite via better-sqlite3** — synchronous, zero-config, perfect for a personal habit tracker. Single DB file at `DATA_DIR/habits.db`.
2. **JWT in httpOnly cookies** — server-side auth middleware via Next.js middleware.ts reads cookie, attaches user to request context.
3. **Soft deletes** — habits use `is_archived` flag so historical logs are preserved for stats.
4. **Date strings over timestamps for logs** — `logged_date TEXT (YYYY-MM-DD)` avoids timezone confusion when marking "today."
5. **Streak logic** — computed at query time in `lib/db/habit-logs.ts` using a window over sorted log dates, not stored state.
6. **Server Components by default** — dashboard pages fetch data server-side; only interactive check-off UI uses Client Components.
