import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();
    const result = await pool.query(
      'SELECT id, nome, email, role FROM users WHERE email = $1 AND senha = $2',
      [email, senha]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 });
    }
    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
