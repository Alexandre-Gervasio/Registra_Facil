import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { userId, newPassword } = await req.json();
    await pool.query('UPDATE users SET senha = $1 WHERE id = $2', [newPassword, userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}