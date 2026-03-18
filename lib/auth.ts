import bcrypt from 'bcryptjs';
import db from './db';

export async function createUser(email: string, password: string): Promise<{ id: number; email: string }> {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email.toLowerCase(), passwordHash);
  return { id: result.lastInsertRowid as number, email: email.toLowerCase() };
}

export async function verifyUser(email: string, password: string): Promise<{ id: number; email: string } | null> {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;
  return { id: user.id, email: user.email };
}
