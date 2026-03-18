"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Habit = {
  id: number;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly";
  color: string;
};

const defaultForm = { name: "", description: "", frequency: "daily", color: "#6366f1" };

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [form, setForm] = useState(defaultForm);

  async function load() {
    const res = await fetch("/api/habits", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setHabits(data.habits);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">Habits</h1>
        <p className="text-sm text-zinc-500">Create and manage your habits.</p>
      </section>

      <form
        className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/habits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          if (res.ok) {
            setForm(defaultForm);
            load();
          }
        }}
      >
        <input className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" placeholder="Habit name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as "daily" | "weekly" })}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <input className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="h-10 w-full rounded-lg border border-zinc-300 px-1 dark:border-zinc-700 dark:bg-zinc-900" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        <button className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white">Create Habit</button>
      </form>

      <section className="grid gap-3">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <h2 className="font-medium">{habit.name}</h2>
              <p className="text-sm text-zinc-500">{habit.description || "No description"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
              <Link href={`/habits/${habit.id}`} className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700">
                View
              </Link>
              <button
                className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-500"
                onClick={async () => {
                  await fetch(`/api/habits/${habit.id}`, { method: "DELETE" });
                  load();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
