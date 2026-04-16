'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { ShoppingCart, Users, Plus, Edit, Trash2, Package } from 'lucide-react';

// --- Utilitários ---
const generateId = (): string => Math.random().toString(36).substr(2, 9);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDateTime = (value: number | string | null | undefined): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const PREVIEW_LOGIN_HINTS = {
  email: 'admin@admin.com',
  senha: 'admin'
};

// --- Interfaces para Tipagem ---
interface User {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'client';
}

interface Item {
  id: string;
  nome: string;
  valor: number;
  tipo: string;
}

interface CartItem extends Item {
  quantidade: number;
  precoNoAto: number;
}

interface Order {
  id: string;
  clientId: string;
  items: CartItem[];
  total: number;
  status: 'Entregue' | 'Em Preparação' | 'Aprovado' | 'Enviado' | 'Cancelado' | 'Pendente' | 'PENDENTE' | null;
  createdAt: number;
}

interface OrderFormProps {
  items: Item[];
  addToast: (msg: string, type: any) => void;
  formatCurrency: (value: number) => string;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setCurrentView: (view: string) => void;
  currentUser: User | null;
}

interface AdminUsersScreenProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  addToast: (msg: string, type: any) => void;
}

interface AdminItemsScreenProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  addToast: (msg: string, type: any) => void;
  formatCurrency: (value: number) => string;
}

// ========================================================
// COMPONENTE ORDERFORM (FORA PARA NÃO RESETAR O CARRINHO)
// ========================================================
const OrderForm = ({ items, addToast, currentUser, setOrders, setCurrentView, formatCurrency }: OrderFormProps) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('editing_order');
    if (!stored) return [];
    try {
      const order = JSON.parse(stored);
      return order.items || [];
    } catch {
      return [];
    }
  });
  const [editingOrderId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('editing_order');
    if (!stored) return null;
    try {
      const order = JSON.parse(stored);
      return order.id || null;
    } catch {
      return null;
    }
  });

  const totalGeral = cart.reduce((sum, item) => sum + (Number(item.precoNoAto) * item.quantidade), 0);

  useEffect(() => () => localStorage.removeItem('editing_order'), []);

  const addToCart = (product: Item) => {
    const alreadyInCart = cart.some(item => String(item.id) === String(product.id));

    setCart(prev => {
      const existing = prev.find(item => String(item.id) === String(product.id));
      if (existing) {
        return prev.map(item => 
          String(item.id) === String(product.id) 
          ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...prev, { ...product, quantidade: 1, precoNoAto: Number(product.valor) }];
    });

    addToast(alreadyInCart ? `${product.nome} +1` : `${product.nome} no carrinho!`, alreadyInCart ? 'info' : 'success');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => 
      String(item.id) === String(id) ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item
    ).filter(item => item.quantidade > 0));
  };

  const handleSaveOrder = async () => {
      if (cart.length === 0) return addToast('O carrinho está vazio!', 'warning');
      if (!currentUser) return addToast('Faça login para criar um pedido.', 'warning');
      
      const orderData = {
        id: editingOrderId || generateId(),
        clientId: currentUser.id,
        items: cart,
        total: totalGeral,
        status: editingOrderId ? undefined : null
      };

      try {
        addToast('Enviando pedido...', 'info');
        
        const response = await fetch('/api/orders', {
          method: editingOrderId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        if (response.ok) {
          addToast('Pedido finalizado com sucesso!', 'success');
          
          // Limpezas
          setCart([]);
          localStorage.removeItem('editing_order');

          // Atualiza a lista global de pedidos
          const res = await fetch('/api/orders');
          const updated = await res.json();
          setOrders(updated);

          // Volta para a tela de listagem
          setCurrentView('CLIENT_ORDERS');
        } else {
          const err = await response.json();
          addToast(`Erro: ${err.error || 'Falha ao salvar'}`, 'error');
        }
      } catch (e) {
        addToast('Erro de conexão com o banco', 'error');
      }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto flex gap-6 items-start">
      <div className="w-2/3 bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">📦 Escolha os Produtos</h3>
        <div className="grid grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="border p-4 rounded-lg flex justify-between items-center hover:shadow-md transition">
              <div>
                <h4 className="font-semibold">{item.nome}</h4>
                <p className="text-blue-600 font-bold">{formatCurrency(item.valor)}</p>
              </div>
              <button onClick={() => addToCart(item)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                <Plus size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="w-1/3 bg-white p-6 rounded-lg shadow-lg border-t-4 border-green-500 sticky top-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">🛒 Carrinho</h3>
        {cart.length === 0 ? <p className="text-center text-gray-400 py-10">Carrinho vazio</p> : (
          <>
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2 text-sm">
                  <span>{item.nome}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="px-2 border rounded">-</button>
                    <span>{item.quantidade}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="px-2 border rounded">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between text-xl font-bold mb-4">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(totalGeral)}</span>
              </div>
              <button onClick={handleSaveOrder} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">
                Confirmar Pedido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const OrderList = ({ orders, viewRole, users, currentUser, formatCurrency, addToast, setOrders, setCurrentView }: any) => {
  const visibleOrders = viewRole === 'client'
    ? orders.filter((order: Order) => order.clientId === currentUser?.id)
    : orders;

  const getOrderDescription = (order: any): string => {
    if (!Array.isArray(order?.items) || order.items.length === 0) return '-';
    return order.items
      .map((item: any) => `${item.quantidade || 0}x ${item.nome || 'Item'}`)
      .join(', ');
  };
  
  const handleStatusChange = async (orderId: string, newStatus: string | null) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
      if (res.ok) {
        setOrders((prev: any[]) => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        addToast(`Pedido ${newStatus}`, 'info');
      }
    } catch (e) { addToast('Erro ao atualizar status', 'error'); }
  };

  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case 'Pendente': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'PENDENTE': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Entregue': return 'bg-green-100 text-green-800 border-green-200';
      case 'Em Preparação': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Aprovado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Enviado': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      {viewRole === 'client' && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setCurrentView('CLIENT_NEW_ORDER')}
            className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700"
          >
            + Novo Pedido
          </button>
        </div>
      )}
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            {viewRole === 'admin' && <th className="p-3">Cliente</th>}
            <th className="p-3">Data/Hora</th>
            {viewRole === 'admin' && <th className="p-3">Descrição</th>}
            <th className="p-3">Total</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {visibleOrders.map((order: any) => {
            const isPending = order.status === null || order.status === 'Pendente' || order.status === 'PENDENTE';
            const canEditClientOrder = isPending || order.status === 'Em Preparação';
            return (
            <tr key={order.id} className="border-b hover:bg-gray-50">
              {viewRole === 'admin' && <td className="p-3">{users.find((u:any) => u.id === order.clientId)?.nome || 'Cliente'}</td>}
              <td className="p-3">{formatDateTime(order.createdAt)}</td>
              {viewRole === 'admin' && <td className="p-3 max-w-md">{getOrderDescription(order)}</td>}
              <td className="p-3 font-bold">{formatCurrency(order.total)}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase ${getStatusStyle(order.status)}`}>
                  {order.status || 'Pendente'}
                </span>
              </td>
              <td className="p-3 text-center">
                {viewRole === 'admin' ? (
                  <div className="flex items-center justify-center gap-2">
                    {order.status !== 'Entregue' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'Entregue')}
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                      >
                        Concluir
                      </button>
                    )}
                    <select 
                      className="border rounded text-xs p-1"
                      value={order.status || ''}
                      onChange={(e) => handleStatusChange(order.id, e.target.value === '' ? null : e.target.value)}
                    >
                      <option value="">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Em Preparação">Em Preparação</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Entregue">Entregue</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                ) : (
                  canEditClientOrder ? (
                    <button
                      onClick={() => {
                        localStorage.setItem('editing_order', JSON.stringify(order));
                        setCurrentView('CLIENT_NEW_ORDER');
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )
                )}
              </td>
            </tr>
          )})}
          {visibleOrders.length === 0 && (
            <tr>
              <td className="p-6 text-center text-gray-500" colSpan={viewRole === 'admin' ? 6 : 4}>
                Nenhum pedido encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const AdminItemsScreen = ({ items, setItems, addToast, formatCurrency }: AdminItemsScreenProps) => {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Unidade');
  const [valor, setValor] = useState('');

  const handleAddItem = async () => {
    if (!nome.trim() || !valor) {
      addToast('Preencha nome e valor do produto.', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), tipo, valor: Number(valor) })
      });

      if (!response.ok) {
        const err = await response.json();
        addToast(err.error || 'Erro ao cadastrar produto.', 'error');
        return;
      }

      const created = await response.json();
      setItems(prev => [...prev, created]);
      setNome('');
      setValor('');
      addToast('Produto cadastrado com sucesso!', 'success');
    } catch {
      addToast('Erro de conexão ao cadastrar produto.', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Deseja remover este produto?')) return;

    try {
      const response = await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
      if (!response.ok) {
        addToast('Erro ao remover produto.', 'error');
        return;
      }

      setItems(prev => prev.filter(item => item.id !== id));
      addToast('Produto removido com sucesso!', 'info');
    } catch {
      addToast('Erro de conexão ao remover produto.', 'error');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Package /> Produtos</h2>

      <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Nome do produto"
          className="border rounded p-2"
        />
        <select value={tipo} onChange={e => setTipo(e.target.value)} className="border rounded p-2">
          <option value="Unidade">Unidade</option>
          <option value="Kg">Kg</option>
          <option value="Caixa">Caixa</option>
          <option value="Serviço">Serviço</option>
        </select>
        <input
          value={valor}
          onChange={e => setValor(e.target.value)}
          type="number"
          step="0.01"
          placeholder="Valor"
          className="border rounded p-2"
        />
        <button onClick={handleAddItem} className="bg-blue-600 text-white rounded p-2 font-semibold hover:bg-blue-700">
          Cadastrar Produto
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left">Produto</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Valor</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.nome}</td>
                <td className="p-3">{item.tipo}</td>
                <td className="p-3 font-bold">{formatCurrency(item.valor)}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminUsersScreen = ({ users, setUsers, addToast }: AdminUsersScreenProps) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSenha, setNewSenha] = useState('');

  const allUsers = users;

  const handleCreateUser = async () => {
    if (!newNome.trim() || !newEmail.trim() || !newSenha.trim()) {
      addToast('Preencha nome, e-mail e senha.', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newNome.trim(), email: newEmail.trim(), senha: newSenha, role: 'client' })
      });

      if (!response.ok) {
        const err = await response.json();
        addToast(err.error || 'Erro ao cadastrar usuário.', 'error');
        return;
      }

      const created = await response.json();
      setUsers(prev => [...prev, created]);
      setNewNome('');
      setNewEmail('');
      setNewSenha('');
      addToast('Usuário cadastrado com sucesso!', 'success');
    } catch {
      addToast('Erro de conexão ao cadastrar usuário.', 'error');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditNome(user.nome);
    setEditEmail(user.email);
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUserId, nome: editNome, email: editEmail })
      });
      
      if (res.ok) {
        setUsers(users.map(u => u.id === editingUserId ? { ...u, nome: editNome, email: editEmail } : u));
        setEditingUserId(null);
        addToast('Cliente atualizado!', 'success');
      }
    } catch (error) {
      addToast('Erro ao atualizar', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Excluir este usuário?')) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        addToast('Usuário removido', 'info');
      }
    } catch (error) {
      addToast('Erro ao remover', 'error');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Users /> Usuários</h2>

      <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="Nome" className="border rounded p-2" />
        <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="E-mail" className="border rounded p-2" />
        <input value={newSenha} onChange={e => setNewSenha(e.target.value)} type="password" placeholder="Senha" className="border rounded p-2" />
        <button onClick={handleCreateUser} className="bg-blue-600 text-white rounded p-2 font-semibold hover:bg-blue-700">Cadastrar Usuário</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 uppercase font-bold text-gray-600">
            <tr>
              <th className="p-4 text-left">Nome / Empresa</th>
              <th className="p-4 text-left">E-mail</th>
              <th className="p-4 text-left">Perfil</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map(user => (
              <tr key={user.id} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  {editingUserId === user.id ? (
                    <input value={editNome} onChange={e => setEditNome(e.target.value)} className="border p-1 rounded w-full" />
                  ) : user.nome}
                </td>
                <td className="p-4">
                  {editingUserId === user.id ? (
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="border p-1 rounded w-full" />
                  ) : user.email}
                </td>
                <td className="p-4">{user.role === 'admin' ? 'Admin' : 'Cliente'}</td>
                <td className="p-4 flex justify-center gap-3">
                  {editingUserId === user.id ? (
                    <button onClick={handleSaveEdit} className="text-green-600 font-bold">Salvar</button>
                  ) : (
                    <>
                      <button onClick={() => handleEditUser(user)} className="text-blue-600"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteUser(user.id)} className="text-red-500"><Trash2 size={18} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ========================================================
// COMPONENTE PRINCIPAL HOMEPAGE
// ========================================================
export default function HomePage() {
  const { addToast } = useToast();
  // --- Estados Principais ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('LOGIN'); 

  // --- Estados do Banco de Dados ---
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do PostgreSQL
  useEffect(() => {
    const loadData = async () => {
      try {
        const [u, i, o] = await Promise.all([
          fetch('/api/users').then(r => r.json()),
          fetch('/api/items').then(r => r.json()),
          fetch('/api/orders').then(r => r.json())
        ]);
        setUsers(u); setItems(i); setOrders(o);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  const handleLogin = async (email: string, senha: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    if (res.ok) {
      const { user } = await res.json();
      setCurrentUser(user);
      setCurrentView(user.role === 'admin' ? 'ADMIN_ORDERS' : 'CLIENT_ORDERS');
      addToast(`Bem-vindo, ${user.nome}!`, 'success');
    } else {
      addToast('Dados incorretos!', 'error');
    }
  };

  const Navbar = () => (
    <nav className="bg-blue-600 text-white px-5 py-3 shadow-lg flex justify-between items-center">
      <div className="font-bold text-xl flex items-center gap-2"><ShoppingCart /> Sistema de Pedidos</div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-blue-100 hidden md:inline">{currentUser?.nome}</span>
        {currentUser?.role === 'admin' ? (
          <>
            <button
              onClick={() => setCurrentView('ADMIN_ORDERS')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === 'ADMIN_ORDERS' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setCurrentView('ADMIN_ITEMS')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === 'ADMIN_ITEMS' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
            >
              Produtos
            </button>
            <button
              onClick={() => setCurrentView('ADMIN_USERS')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === 'ADMIN_USERS' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
            >
              Usuários
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setCurrentView('CLIENT_ORDERS')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === 'CLIENT_ORDERS' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
            >
              Meus Pedidos
            </button>
            <button
              onClick={() => setCurrentView('CLIENT_NEW_ORDER')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === 'CLIENT_NEW_ORDER' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
            >
              Novo Pedido
            </button>
          </>
        )}
        <button onClick={() => { setCurrentUser(null); setCurrentView('LOGIN'); }} className="bg-red-500 px-3 py-1.5 rounded-md hover:bg-red-600">Sair</button>
      </div>
    </nav>
  );

  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleLogin(email, senha);
    };

    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="bg-white p-8 rounded shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          <form onSubmit={handleSubmit}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 mb-4 rounded" placeholder={PREVIEW_LOGIN_HINTS.email} />
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="w-full border p-2 mb-6 rounded" placeholder={PREVIEW_LOGIN_HINTS.senha} />
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold">Entrar</button>
          </form>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-20 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView !== 'LOGIN' && <Navbar />}
      <main>
        {currentView === 'LOGIN' && <LoginScreen />}
        {(currentView === 'CLIENT_ORDERS' || currentView === 'ADMIN_ORDERS') && (
          <OrderList
            orders={orders}
            viewRole={currentView === 'ADMIN_ORDERS' ? 'admin' : 'client'}
            users={users}
            currentUser={currentUser}
            formatCurrency={formatCurrency}
            addToast={addToast}
            setOrders={setOrders}
            setCurrentView={setCurrentView}
          />
        )}
        {currentView === 'ADMIN_ITEMS' && currentUser?.role === 'admin' && (
          <AdminItemsScreen
            items={items}
            setItems={setItems}
            addToast={addToast}
            formatCurrency={formatCurrency}
          />
        )}
        {currentView === 'ADMIN_USERS' && currentUser?.role === 'admin' && (
          <AdminUsersScreen users={users} setUsers={setUsers} addToast={addToast} />
        )}
        {currentView === 'CLIENT_NEW_ORDER' && (
          <OrderForm 
            items={items} 
            addToast={addToast} 
            currentUser={currentUser} 
            setOrders={setOrders} 
            setCurrentView={setCurrentView} 
            formatCurrency={formatCurrency}
          />
        )}
      </main>
    </div>
  );
}