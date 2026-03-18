import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const habits = db
    .prepare("SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC")
    .all(session.user.userId);

  return NextResponse.json({ habits });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, frequency, color } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const result = db
    .prepare(
      "INSERT INTO habits (user_id, name, description, frequency, color) VALUES (?, ?, ?, ?, ?)"
    )
    .run(session.user.userId, name, description || null, frequency || "daily", color || "#6366f1");

  return NextResponse.json({ id: result.lastInsertRowid });
}
