import pool from '../db';

export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: 'admin' | 'client';
}

export async function getUsers(): Promise<User[]> {
  const result = await pool.query('SELECT * FROM users ORDER BY nome');
  return result.rows;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  if (!user.email.includes('@')) throw new Error('Email inválido');
  if (user.senha.length < 6) throw new Error('Senha muito curta');
  const result = await pool.query(
    `INSERT INTO users (nome, email, senha, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [user.nome, user.email, user.senha, user.role || 'client']
  );
  return result.rows[0];
}