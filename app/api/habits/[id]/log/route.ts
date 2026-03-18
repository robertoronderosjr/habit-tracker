import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const habit = db.prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?").get(Number(id), session.user.userId);
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const loggedDate = body.loggedDate || new Date().toISOString().slice(0, 10);
  const notes = body.notes || null;

  db.prepare("INSERT OR IGNORE INTO habit_logs (habit_id, logged_date, notes) VALUES (?, ?, ?)").run(Number(id), loggedDate, notes);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const loggedDate = body.loggedDate || new Date().toISOString().slice(0, 10);

  db.prepare(
    `DELETE FROM habit_logs
     WHERE habit_id = ? AND logged_date = ?
       AND habit_id IN (SELECT id FROM habits WHERE id = ? AND user_id = ?)`
  ).run(Number(id), loggedDate, Number(id), session.user.userId);

  return NextResponse.json({ ok: true });
}
