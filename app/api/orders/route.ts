import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const ALLOWED_STATUSES = new Set([
  'Aprovado',
  'Em Preparação',
  'Enviado',
  'Entregue',
  'Cancelado',
  'Pendente'
]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    // USAR ASPAS DUPLAS para preservar maiúsculas/minúsculas
    let query = `
      SELECT o.*, u.nome as client_nome 
      FROM orders o
      JOIN users u ON o."clientId" = u.id
    `;
    const params = [];

    if (clientId) {
      query += ' WHERE o."clientId" = $1';
      params.push(clientId);
    }

    query += ' ORDER BY o.created_at DESC';

    const result = await pool.query(query, params);
    const orderIds = result.rows.map((order) => String(order.id));

    let itemsByOrderId = new Map<string, any[]>();

    if (orderIds.length > 0) {
      const itemsResult = await pool.query(
        'SELECT * FROM order_items WHERE orderid = ANY($1::text[])',
        [orderIds]
      );

      itemsByOrderId = itemsResult.rows.reduce((acc, item) => {
        const key = String(item.orderid);
        const list = acc.get(key) || [];
        list.push(item);
        acc.set(key, list);
        return acc;
      }, new Map<string, any[]>());
    }

    const ordersWithItems = result.rows.map((order) => {

      const createdAtRaw = order.created_at;
      const createdAt = typeof createdAtRaw === 'number'
        ? createdAtRaw
        : Number(createdAtRaw);

      const normalizedStatus = order.status === 'Pendente' || order.status === 'PENDENTE'
        ? null
        : order.status;

      return {
        ...order,
        status: normalizedStatus,
        createdAt: Number.isNaN(createdAt) ? Date.now() : createdAt,
        items: itemsByOrderId.get(String(order.id)) || []
      };
    });

    return NextResponse.json(ordersWithItems);
  } catch (error: any) {
    console.error('Erro em GET /api/orders:', error);
    const message = error?.code === 'ETIMEDOUT'
      ? 'Falha de conexão com o banco ao buscar pedidos.'
      : (error?.message || 'Erro interno ao buscar pedidos.');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Recebendo pedido:', body);

    const { id, clientId, items, total, createdAt } = body;
    const createdAtValue = createdAt ?? Date.now();
    const normalizedStatus = null;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Usar aspas duplas no clientId
      await client.query(
        'INSERT INTO orders (id, "clientId", total, status, created_at) VALUES ($1, $2, $3, $4, $5)',
        [id, clientId, total, normalizedStatus, createdAtValue]
      );

      // Inserir itens
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (id, orderid, itemid, nome, tipo, valor, quantidade, preconoato) 
           VALUES (gen_random_uuid()::VARCHAR(50), $1, $2, $3, $4, $5, $6, $7)`,
          [id, item.id, item.nome, item.tipo, item.valor, item.quantidade, item.precoNoAto]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, orderId: id });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Erro em POST /api/orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, items, total } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 });
    }

    const normalizedStatus = status === '' || status === 'Pendente' || status === 'PENDENTE'
      ? null
      : status;

    if (normalizedStatus !== null && !ALLOWED_STATUSES.has(normalizedStatus)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    // Fluxo admin: atualização apenas de status.
    if (typeof items === 'undefined' && typeof total === 'undefined') {
      const result = await pool.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [normalizedStatus ?? null, id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ success: true, order: result.rows[0] });
    }

    // Fluxo cliente: edição de itens/total do pedido.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        'UPDATE orders SET total = $1 WHERE id = $2 RETURNING *',
        [total, id]
      );

      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
      }

      await client.query('DELETE FROM order_items WHERE orderid = $1', [id]);

      for (const item of items || []) {
        await client.query(
          `INSERT INTO order_items (id, orderid, itemid, nome, tipo, valor, quantidade, preconoato)
           VALUES (gen_random_uuid()::VARCHAR(50), $1, $2, $3, $4, $5, $6, $7)`,
          [id, item.id, item.nome, item.tipo, item.valor, item.quantidade, item.precoNoAto]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, order: orderResult.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Erro em PUT /api/orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}