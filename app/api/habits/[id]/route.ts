import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getHabitById, updateHabit, deleteHabit, getHabitLogs } from '@/lib/habits';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const habit = getHabitById(Number(id), session.user.userId);
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const logs = getHabitLogs(Number(id), session.user.userId);
  return NextResponse.json({ habit, logs });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const updates = await request.json();
  const habit = updateHabit(Number(id), session.user.userId, updates);
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ habit });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const deleted = deleteHabit(Number(id), session.user.userId);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
