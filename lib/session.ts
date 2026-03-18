import { SessionOptions, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionUser } from './types';

export interface SessionData {
  user?: SessionUser;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex-password-at-least-32-characters-long!!',
  cookieName: 'habit_tracker_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
