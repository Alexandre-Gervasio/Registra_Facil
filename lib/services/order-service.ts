import pool from '../db';

export interface CartItem {
  id: string;
  nome: string;
  tipo: string;
  valor: number;
  quantidade: number;
  precoNoAto: number;
}

export interface Order {
  id: string;
  clientId: string;
  items: CartItem[];
  total: number;
  status: 'Pendente' | 'Aprovado' | 'Em Preparação' | 'Enviado' | 'Entregue' | 'Cancelado';
  createdAt: number;
}

export async function getOrdersByClient(clientId: string): Promise<Order[]> {
  const result = await pool.query(
    `SELECT * FROM orders WHERE clientId = $1 ORDER BY created_at DESC`,
    [clientId]
  );
  return result.rows;
}

export async function getAllOrders(): Promise<Order[]> {
  const result = await pool.query(
    `SELECT o.*, u.nome as client_nome 
     FROM orders o
     JOIN users u ON o.clientId = u.id
     ORDER BY o.created_at DESC`
  );
  return result.rows;
}

export async function createOrder(order: Order): Promise<Order> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Inserir pedido
    const orderResult = await client.query(
      `INSERT INTO orders (id, clientId, total, status, created_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [order.id, order.clientId, order.total, order.status, order.createdAt]
    );
    
    // Inserir itens
    for (const item of order.items) {
      await client.query(
        `INSERT INTO order_items (orderId, itemId, nome, tipo, valor, quantidade, precoNoAto) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.id, item.nome, item.tipo, item.valor, item.quantidade, item.precoNoAto]
      );
    }
    
    await client.query('COMMIT');
    return orderResult.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}