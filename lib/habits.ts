import db from './db';

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly';
  color: string;
  created_at: string;
  completed_today?: boolean;
  streak?: number;
  longest_streak?: number;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  logged_date: string;
  notes: string | null;
  created_at: string;
}

export function getHabits(userId: number): Habit[] {
  
  return db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Habit[];
}

export function getHabitById(id: number, userId: number): Habit | null {
  
  return (db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(id, userId) as Habit) || null;
}

export function createHabit(
  userId: number,
  name: string,
  description?: string,
  frequency: string = 'daily',
  color: string = '#6366f1',
): Habit {
  
  const result = db.prepare(
    'INSERT INTO habits (user_id, name, description, frequency, color) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, name, description || null, frequency || 'daily', color || '#6366f1');
  return getHabitById(result.lastInsertRowid as number, userId)!;
}

export function updateHabit(
  id: number,
  userId: number,
  updates: { name?: string; description?: string; frequency?: string; color?: string },
): Habit | null {
  
  const fields: string[] = [];
  const values: any[] = [];
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.frequency !== undefined) { fields.push('frequency = ?'); values.push(updates.frequency); }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
  if (fields.length === 0) return getHabitById(id, userId);
  values.push(id, userId);
  db.prepare(`UPDATE habits SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  return getHabitById(id, userId);
}

export function deleteHabit(id: number, userId: number): boolean {
  
  const result = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

export function toggleHabitLog(habitId: number, userId: number, date: string): { logged: boolean } {
  
  const habit = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
  if (!habit) throw new Error('Habit not found');
  const existing = db.prepare('SELECT id FROM habit_logs WHERE habit_id = ? AND logged_date = ?').get(habitId, date);
  if (existing) {
    db.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND logged_date = ?').run(habitId, date);
    return { logged: false };
  } else {
    db.prepare('INSERT INTO habit_logs (habit_id, logged_date) VALUES (?, ?)').run(habitId, date);
    return { logged: true };
  }
}

export function getHabitLogs(habitId: number, userId: number, limit = 60): HabitLog[] {
  
  const habit = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
  if (!habit) return [];
  return db.prepare(
    'SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY logged_date DESC LIMIT ?'
  ).all(habitId, limit) as HabitLog[];
}

function computeCurrentStreak(habitId: number): number {
  
  const today = new Date().toISOString().split('T')[0];
  const logs = db.prepare(
    'SELECT logged_date FROM habit_logs WHERE habit_id = ? AND logged_date <= ? ORDER BY logged_date DESC'
  ).all(habitId, today) as { logged_date: string }[];
  if (logs.length === 0) return 0;
  let streak = 0;
  let current = new Date(today);
  for (const log of logs) {
    const logDate = new Date(log.logged_date);
    const diff = Math.round((current.getTime() - logDate.getTime()) / 86400000);
    if (diff <= 1) {
      streak++;
      current = logDate;
    } else {
      break;
    }
  }
  return streak;
}

function computeLongestStreak(habitId: number): number {
  
  const logs = db.prepare(
    'SELECT logged_date FROM habit_logs WHERE habit_id = ? ORDER BY logged_date ASC'
  ).all(habitId) as { logged_date: string }[];
  if (logs.length === 0) return 0;
  let longest = 1, current = 1;
  for (let i = 1; i < logs.length; i++) {
    const prev = new Date(logs[i - 1].logged_date);
    const curr = new Date(logs[i].logged_date);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) { current++; longest = Math.max(longest, current); }
    else { current = 1; }
  }
  return longest;
}

function getCompletionRate30(habitId: number): number {
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().split('T')[0];
  const { count } = db.prepare(
    'SELECT COUNT(*) as count FROM habit_logs WHERE habit_id = ? AND logged_date >= ?'
  ).get(habitId, since) as { count: number };
  return Math.round((count / 30) * 100);
}

export interface HabitWithStats extends Habit {
  todayDone: boolean;
  currentStreak: number;
  longestStreak: number;
  completionRate30: number;
}

export interface DashboardAnalytics {
  habits: HabitWithStats[];
  chart: { date: string; completed: number; rate: number }[];
}

export function getDashboardAnalytics(userId: number): DashboardAnalytics {
  
  const today = new Date().toISOString().split('T')[0];
  const habits = getHabits(userId);

  const habitsWithStats: HabitWithStats[] = habits.map(h => {
    const todayLog = db.prepare(
      'SELECT id FROM habit_logs WHERE habit_id = ? AND logged_date = ?'
    ).get(h.id, today);
    return {
      ...h,
      todayDone: Boolean(todayLog),
      currentStreak: computeCurrentStreak(h.id),
      longestStreak: computeLongestStreak(h.id),
      completionRate30: getCompletionRate30(h.id),
    };
  });

  // Weekly chart (last 30 days average completion rate)
  const chart: { date: string; completed: number; rate: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const completed = habits.length > 0
      ? (db.prepare(`
          SELECT COUNT(*) as count FROM habit_logs hl
          JOIN habits h ON h.id = hl.habit_id
          WHERE h.user_id = ? AND hl.logged_date = ?
        `).get(userId, dateStr) as { count: number }).count
      : 0;
    chart.push({ date: dateStr, completed, rate: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0 });
  }

  return { habits: habitsWithStats, chart };
}

export interface DashboardStats {
  totalHabits: number;
  completedToday: number;
  completionRate: number;
  longestStreak: number;
  currentStreaks: { habitId: number; habitName: string; streak: number }[];
  weeklyData: { date: string; completed: number; total: number }[];
}

export function getDashboardStats(userId: number): DashboardStats {
  
  const today = new Date().toISOString().split('T')[0];
  const habits = db.prepare('SELECT id, name FROM habits WHERE user_id = ?').all(userId) as { id: number; name: string }[];
  const totalHabits = habits.length;
  const { count: completedToday } = db.prepare(`
    SELECT COUNT(*) as count FROM habit_logs hl
    JOIN habits h ON h.id = hl.habit_id
    WHERE h.user_id = ? AND hl.logged_date = ?
  `).get(userId, today) as { count: number };
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const currentStreaks = habits
    .map(h => ({ habitId: h.id, habitName: h.name, streak: computeCurrentStreak(h.id) }))
    .filter(s => s.streak > 0)
    .sort((a, b) => b.streak - a.streak);
  const longestStreak = habits.reduce((max, h) => Math.max(max, computeLongestStreak(h.id)), 0);
  const weeklyData: { date: string; completed: number; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const { count } = db.prepare(`
      SELECT COUNT(*) as count FROM habit_logs hl
      JOIN habits h ON h.id = hl.habit_id
      WHERE h.user_id = ? AND hl.logged_date = ?
    `).get(userId, dateStr) as { count: number };
    weeklyData.push({ date: dateStr, completed: count, total: totalHabits });
  }
  return { totalHabits, completedToday, completionRate, longestStreak, currentStreaks, weeklyData };
}
