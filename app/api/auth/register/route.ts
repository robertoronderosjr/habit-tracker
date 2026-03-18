import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    
    const user = await createUser(email, password);
    const session = await getSession();
    session.user = { userId: user.id, email: user.email };
    await session.save();
    
    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
