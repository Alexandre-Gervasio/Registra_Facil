import pool from '../db';

export interface Item {
  id: string;
  nome: string;
  tipo: string;
  valor: number;
}

export async function getItems(): Promise<Item[]> {
  const result = await pool.query('SELECT * FROM items WHERE ativo = true ORDER BY nome');
  return result.rows;
}

export async function getItemById(id: string): Promise<Item | null> {
  const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
  return result.rows[0] || null;
}