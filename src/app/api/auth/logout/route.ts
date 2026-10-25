import { NextResponse } from 'next/server';
import { FAN_SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Signed out.' });
  response.cookies.delete(FAN_SESSION_COOKIE);
  return response;
}
