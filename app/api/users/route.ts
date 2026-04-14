import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Listar todos os usuários
export async function GET() {
  try {
    const result = await pool.query('SELECT id, nome, email, role, created_at FROM users ORDER BY nome');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Criar novo usuário
export async function POST(req: Request) {
  try {
    const { nome, email, senha, role } = await req.json();
    const result = await pool.query(
      'INSERT INTO users (nome, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, role',
      [nome, email, senha, role || 'client']
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Atualizar usuário
export async function PUT(req: Request) {
  try {
    const { id, nome, email } = await req.json();
    const result = await pool.query(
      'UPDATE users SET nome = $1, email = $2 WHERE id = $3 RETURNING id, nome, email, role',
      [nome, email, id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remover usuário
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}