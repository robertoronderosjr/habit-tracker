"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Habit = { id: number; name: string; description: string | null; frequency: "daily" | "weekly"; color: string };
type HabitLog = { id: number; logged_date: string; notes: string | null };

export default function HabitDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const idParam = params?.id;
  const id = useMemo(() => Number(idParam || 0), [idParam]);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [notes, setNotes] = useState("");

  async function load() {
    const res = await fetch(`/api/habits/${id}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setHabit(data.habit);
    setLogs(data.logs);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  const today = new Date().toISOString().slice(0, 10);
  const doneToday = logs.some((l) => l.logged_date === today);

  if (!habit) return <p>Loading...</p>;

  return (
    <main className="space-y-4">
      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{habit.name}</h1>
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
        </div>
        <p className="text-sm text-zinc-500">{habit.description || "No description"}</p>
        <p className="mt-1 text-sm">Frequency: {habit.frequency}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
            onClick={async () => {
              await fetch(`/api/habits/${habit.id}/log`, {
                method: doneToday ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loggedDate: today, notes }),
              });
              setNotes("");
              load();
            }}
          >
            {doneToday ? "Unmark Today" : "Mark Today Complete"}
          </button>

          <button
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            onClick={async () => {
              await fetch(`/api/habits/${habit.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(habit) });
              load();
            }}
          >
            Save Changes
          </button>

          <button
            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-500"
            onClick={async () => {
              await fetch(`/api/habits/${habit.id}`, { method: "DELETE" });
              router.push("/habits");
            }}
          >
            Delete Habit
          </button>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <input className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" value={habit.name} onChange={(e) => setHabit({ ...habit, name: e.target.value })} />
          <select className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" value={habit.frequency} onChange={(e) => setHabit({ ...habit, frequency: e.target.value as "daily" | "weekly" })}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <input className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 md:col-span-2" value={habit.description || ""} onChange={(e) => setHabit({ ...habit, description: e.target.value })} placeholder="Description" />
          <input className="h-10 w-full rounded-lg border border-zinc-300 px-1 dark:border-zinc-700 dark:bg-zinc-900" type="color" value={habit.color} onChange={(e) => setHabit({ ...habit, color: e.target.value })} />
          <input className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note for today log" />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-lg font-semibold">Log History</h2>
        <ul className="space-y-2 text-sm">
          {logs.map((log) => (
            <li key={log.id} className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
              <p>{log.logged_date}</p>
              {log.notes ? <p className="text-zinc-500">{log.notes}</p> : null}
            </li>
          ))}
          {logs.length === 0 ? <li className="text-zinc-500">No logs yet.</li> : null}
        </ul>
      </section>
    </main>
  );
}
