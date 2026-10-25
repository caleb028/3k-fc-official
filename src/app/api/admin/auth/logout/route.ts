import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Admin signed out.' });
  res.cookies.delete(ADMIN_SESSION_COOKIE);
  return res;
}
