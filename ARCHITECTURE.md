# Habit Tracker — Architecture

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js (credentials + JWT)
- **Validation:** Zod

---

## File Structure

```
habit-tracker/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing / redirect
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell
│   │   ├── dashboard/page.tsx      # Stats overview
│   │   ├── habits/
│   │   │   ├── page.tsx            # Habits list
│   │   │   ├── new/page.tsx        # Create habit
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Habit detail
│   │   │       └── edit/page.tsx   # Edit habit
│   │   └── log/page.tsx            # Daily log view
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── habits/
│       │   ├── route.ts            # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts        # GET, PUT, DELETE
│       │       └── log/route.ts    # POST log entry
│       └── dashboard/
│           └── stats/route.ts      # GET dashboard stats
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── habits/
│   │   ├── HabitCard.tsx
│   │   ├── HabitForm.tsx
│   │   └── HabitGrid.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── StreakChart.tsx
│   │   └── CompletionHeatmap.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Header.tsx
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # NextAuth config
│   ├── validations.ts              # Zod schemas
│   └── utils.ts                    # Helpers
├── prisma/
│   └── schema.prisma               # DB schema
├── types/
│   └── index.ts                    # Shared TS types
├── middleware.ts                    # Auth route protection
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Database Schema

### `users`
| Column          | Type        | Constraints                  |
|-----------------|-------------|------------------------------|
| id              | UUID        | PK, default gen_random_uuid()|
| email           | VARCHAR     | UNIQUE, NOT NULL             |
| password_hash   | VARCHAR     | NOT NULL                     |
| created_at      | TIMESTAMPTZ | DEFAULT now()                |

### `habits`
| Column      | Type        | Constraints                          |
|-------------|-------------|--------------------------------------|
| id          | UUID        | PK, default gen_random_uuid()        |
| user_id     | UUID        | FK → users.id, ON DELETE CASCADE     |
| name        | VARCHAR     | NOT NULL                             |
| description | TEXT        | NULLABLE                             |
| frequency   | VARCHAR     | NOT NULL (daily/weekly/custom)       |
| created_at  | TIMESTAMPTZ | DEFAULT now()                        |

### `habit_logs`
| Column      | Type        | Constraints                       |
|-------------|-------------|-----------------------------------|
| id          | UUID        | PK, default gen_random_uuid()     |
| habit_id    | UUID        | FK → habits.id, ON DELETE CASCADE |
| logged_date | DATE        | NOT NULL                          |
| notes       | TEXT        | NULLABLE                          |
| created_at  | TIMESTAMPTZ | DEFAULT now()                     |

Unique constraint: `(habit_id, logged_date)` — one log per habit per day.

---

## API Routes

### Auth
| Method | Route                    | Description              |
|--------|--------------------------|--------------------------|
| POST   | `/api/auth/register`     | Create account           |
| POST   | `/api/auth/[...nextauth]`| NextAuth sign-in/sign-out|
| GET    | `/api/auth/session`      | Current session          |

### Habits CRUD
| Method | Route              | Description             |
|--------|--------------------|-------------------------|
| GET    | `/api/habits`      | List user's habits      |
| POST   | `/api/habits`      | Create habit            |
| GET    | `/api/habits/[id]` | Get single habit        |
| PUT    | `/api/habits/[id]` | Update habit            |
| DELETE | `/api/habits/[id]` | Delete habit            |

### Habit Logging
| Method | Route                   | Description                     |
|--------|-------------------------|---------------------------------|
| POST   | `/api/habits/[id]/log`  | Log completion for a date       |
| DELETE | `/api/habits/[id]/log`  | Remove log for a date           |
| GET    | `/api/habits/[id]/log`  | Get logs for a habit (paginated)|

### Dashboard Stats
| Method | Route                    | Description                                                   |
|--------|--------------------------|---------------------------------------------------------------|
| GET    | `/api/dashboard/stats`   | Totals: habits count, today's completions, streaks, weekly %  |

**Stats response shape:**
```ts
{
  totalHabits: number
  completedToday: number
  currentStreaks: { habitId: string; streak: number }[]
  weeklyCompletionRate: number   // 0–100
  longestStreak: number
}
```

---

## Auth Flow

1. User registers → password bcrypt-hashed → stored in `users`
2. Login via NextAuth credentials provider → JWT session
3. Middleware (`middleware.ts`) protects `/dashboard/*` and `/api/habits/*`, `/api/dashboard/*`
4. Server Components + Route Handlers use `getServerSession()` to verify identity

---

## Key Design Decisions

- **App Router only** — no Pages Router mixing
- **Server Components by default** — Client Components only where interactivity needed
- **Optimistic UI** — log/unlog habits without waiting for server round-trip
- **UUID PKs** — avoids enumeration attacks
- **Soft unique on logs** — upsert pattern for idempotent logging
