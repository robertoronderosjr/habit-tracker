export const dynamic = 'force-dynamic';

import CompletionChart from "@/components/CompletionChart";
import { getDashboardAnalytics } from "@/lib/habits";
import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session.user!.userId;
  const { habits, chart } = getDashboardAnalytics(userId);

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">Today&apos;s Habits</h1>
        <p className="text-sm text-zinc-500">Track progress and streaks</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {habits.length === 0 ? <p className="text-sm text-zinc-500">No habits yet. Create one from the Habits page.</p> : null}
        {habits.map((habit) => (
          <div key={habit.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{habit.name}</h2>
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
            </div>
            <p className="mt-1 text-sm text-zinc-500">{habit.todayDone ? "✅ Done today" : "⏳ Not done yet"}</p>
            <p className="mt-2 text-sm">Current streak: <b>{habit.currentStreak}</b> days</p>
            <p className="text-sm">Longest streak: <b>{habit.longestStreak}</b> days</p>
            <p className="text-sm">30-day completion: <b>{habit.completionRate30}%</b></p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Last 30 Days Completion Rate</h2>
        <CompletionChart data={chart} />
      </section>
    </main>
  );
}
