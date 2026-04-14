'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { ShoppingCart, Package, Users, LogOut, Plus, Edit, Trash2, CheckCircle, Key } from 'lucide-react';

// --- Utilitários ---
const generateId = (): string => Math.random().toString(36).substr(2, 9);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- Interfaces para Tipagem ---
interface User {
  id: string;
  nome: string;
  email: string;
  senha: string;
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
  status: 'Entregue' | 'Em Preparação' | 'Aprovado' | 'Enviado' | 'Cancelado' | null;
  createdAt: number;
}

interface CartItem extends Item {
  quantidade: number;
  precoNoAto: number;
}

interface OrderFormProps {
  items: Item[];
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  formatCurrency: (value: number) => string;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setCurrentView: React.Dispatch<React.SetStateAction<string>>;
  currentUser: User | null;
}

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
        const [usersRes, itemsRes, ordersRes] = await Promise.all([
          fetch('/api/users').then(r => r.json()),
          fetch('/api/items').then(r => r.json()),
          fetch('/api/orders').then(r => r.json())
        ]);
        
        setUsers(Array.isArray(usersRes) ? usersRes : []);
        setItems(Array.isArray(itemsRes) ? itemsRes : []);
        setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        addToast('Erro ao carregar dados do servidor', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // --- Funções de Autenticação ---
  const handleLogin = async (email: string, senha: string) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      if (res.ok) {
        const { user } = await res.json();
        setCurrentUser(user);
        setCurrentView(user.role === 'admin' ? 'ADMIN_ORDERS' : 'CLIENT_ORDERS');
        addToast(`Bem-vindo(a), ${user.nome}!`, 'success');
      } else {
        const error = await res.json();
        addToast(error.error || 'E-mail ou senha incorretos!', 'error');
      }
    } catch (error) {
      addToast('Erro de conexão com o servidor', 'error');
    }
  };

  const handleRegister = async (nome: string, email: string, senha: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, role: 'client' })
      });
      
      if (res.ok) {
        addToast('Cadastro realizado com sucesso! Faça o login.', 'success');
        setCurrentView('LOGIN');
      } else {
        const error = await res.json();
        addToast(error.error || 'Erro ao cadastrar', 'error');
      }
    } catch (error) {
      addToast('Erro de conexão com o servidor', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('LOGIN');
    addToast('Você foi desconectado.', 'info');
  };

  // --- Componentes de Interface ---

  const Navbar = () => (
    <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
      <div className="font-bold text-xl flex items-center gap-2">
        <ShoppingCart /> Sistema de Pedidos
      </div>
      {currentUser && (
        <div className="flex items-center gap-4">
          <span className="text-sm">Olá, {currentUser.nome} ({currentUser.role === 'admin' ? 'Admin' : 'Cliente'})</span>
          
          {currentUser.role === 'admin' ? (
            <div className="flex gap-2">
              <button onClick={() => setCurrentView('ADMIN_ORDERS')} className={`px-3 py-1 rounded ${currentView === 'ADMIN_ORDERS' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}>Pedidos</button>
              <button onClick={() => setCurrentView('ADMIN_ITEMS')} className={`px-3 py-1 rounded ${currentView === 'ADMIN_ITEMS' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}>Itens</button>
              <button onClick={() => setCurrentView('ADMIN_USERS')} className={`px-3 py-1 rounded ${currentView === 'ADMIN_USERS' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}>Clientes</button>
            </div>
          ) : (
             <div className="flex gap-2">
              <button onClick={() => setCurrentView('CLIENT_ORDERS')} className={`px-3 py-1 rounded ${currentView === 'CLIENT_ORDERS' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}>Meus Pedidos</button>
            </div>
          )}
          
          <button onClick={handleLogout} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </div>
      )}
    </nav>
  );

  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Acesso ao Sistema</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="admin@admin.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="admin" />
            </div>
            <button onClick={() => handleLogin(email, senha)} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-semibold transition-colors">Entrar</button>
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">Não tem conta? </span>
              <button onClick={() => setCurrentView('REGISTER')} className="text-sm text-blue-600 hover:underline">Criar conta</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RegisterScreen = () => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Cadastro de Cliente</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome da Empresa / Cliente</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="mt-1 w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="mt-1 w-full border rounded p-2" />
            </div>
            <button onClick={() => handleRegister(nome, email, senha)} className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 font-semibold transition-colors">Cadastrar</button>
            <button onClick={() => setCurrentView('LOGIN')} className="w-full bg-gray-200 text-gray-800 p-2 rounded hover:bg-gray-300 font-semibold transition-colors">Voltar</button>
          </div>
        </div>
      </div>
    );
  };

  const AdminItemsScreen = () => {
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('Unidade');
    const [valor, setValor] = useState('');

    const handleAddItem = async () => {
      if (!nome || !valor) {
        addToast('Preencha nome e valor do item!', 'warning');
        return;
      }
      
      try {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, tipo, valor: parseFloat(valor) })
        });
        
        if (res.ok) {
          const newItem = await res.json();
          setItems([...items, newItem]);
          setNome('');
          setValor('');
          addToast(`Item '${newItem.nome}' adicionado com sucesso!`, 'success');
        } else {
          addToast('Erro ao adicionar item', 'error');
        }
      } catch (error) {
        addToast('Erro de conexão', 'error');
      }
    };

    const handleDelete = async (id: string) => {
      try {
        const res = await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setItems(items.filter(item => item.id !== id));
          addToast('Item excluído com sucesso!', 'info');
        } else {
          addToast('Erro ao excluir item', 'error');
        }
      } catch (error) {
        addToast('Erro de conexão', 'error');
      }
    };

    return (
      <div className="p-6 max-w-4xl mx-auto font-sans">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Package /> Cadastro de Itens/Produtos</h2>
        
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-700">Nome do Item</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full border rounded p-2 mt-1" />
          </div>
          <div className="w-48">
            <label className="block text-sm text-gray-700">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full border rounded p-2 mt-1">
              <option value="Unidade">Unidade</option>
              <option value="Kg">Kg</option>
              <option value="Caixa">Caixa</option>
              <option value="Serviço">Serviço</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm text-gray-700">Valor (R$)</label>
            <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="w-full border rounded p-2 mt-1" />
          </div>
          <button onClick={handleAddItem} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
            <Plus size={18} /> Adicionar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Valor</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">Nenhum item cadastrado.</td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">{item.nome}</td>
                    <td className="p-3">{item.tipo}</td>
                    <td className="p-3">{formatCurrency(item.valor)}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const AdminUsersScreen = () => {
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editNome, setEditNome] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null);

    const clients = users.filter(u => u.role === 'client');

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
          const updatedUser = await res.json();
          setUsers(users.map(u => u.id === editingUserId ? { ...u, nome: updatedUser.nome, email: updatedUser.email } : u));
          setEditingUserId(null);
          addToast('Dados do cliente atualizados com sucesso!', 'success');
        } else {
          addToast('Erro ao atualizar cliente', 'error');
        }
      } catch (error) {
        addToast('Erro de conexão', 'error');
      }
    };

    const handleResetPassword = async (userId: string) => {
      if (!newPassword) {
        addToast("Digite a nova senha", 'warning');
        return;
      }
      
      try {
        const res = await fetch('/api/users/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, newPassword })
        });
        
        if (res.ok) {
          setUsers(users.map(u => u.id === userId ? { ...u, senha: newPassword } : u));
          setNewPassword('');
          setShowPasswordModal(null);
          addToast("Senha alterada com sucesso!", 'success');
        } else {
          addToast("Erro ao alterar senha", 'error');
        }
      } catch (error) {
        addToast('Erro de conexão', 'error');
      }
    };

    const handleDeleteUser = async (userId: string) => {
      if(confirm("Deseja realmente excluir este cliente? Todos os pedidos vinculados permanecerão no histórico como 'Desconhecido'.")) {
        try {
          const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
          if (res.ok) {
            setUsers(users.filter(u => u.id !== userId));
            addToast('Cliente excluído com sucesso!', 'info');
          } else {
            addToast('Erro ao excluir cliente', 'error');
          }
        } catch (error) {
          addToast('Erro de conexão', 'error');
        }
      }
    };

    return (
      <div className="p-6 max-w-5xl mx-auto font-sans">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Users /> Gerenciador de Clientes</h2>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 uppercase font-bold text-gray-600">
              <tr>
                <th className="p-4 text-left">Nome / Empresa</th>
                <th className="p-4 text-left">E-mail</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">Nenhum cliente cadastrado.</td>
                </tr>
              ) : (
                clients.map(user => (
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
                    <td className="p-4 flex justify-center gap-3">
                      {editingUserId === user.id ? (
                        <button onClick={handleSaveEdit} className="text-green-600 hover:underline font-bold">Salvar</button>
                      ) : (
                        <>
                          <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-800" title="Editar Dados">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => setShowPasswordModal(user.id)} className="text-orange-600 hover:text-orange-800" title="Resetar Senha">
                            <Key size={18} />
                          </button>
                          <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700" title="Excluir">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-80">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Key size={20}/> Nova Senha</h3>
              <input 
                type="password" 
                placeholder="Digite a nova senha" 
                className="w-full border p-2 rounded mb-4"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowPasswordModal(null)} className="px-3 py-1 text-gray-600">Cancelar</button>
                <button onClick={() => handleResetPassword(showPasswordModal)} className="bg-orange-600 text-white px-4 py-1 rounded">Redefinir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const OrderList = ({ viewRole }: { viewRole: 'admin' | 'client' }) => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const displayOrders = viewRole === 'client' 
      ? safeOrders.filter(o => o && o.clientId === currentUser?.id)
      : safeOrders.filter(o => o !== null);

    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
      try {
        const res = await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: orderId, status: newStatus })
        });
        
        if (res.ok) {
          setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
          addToast(`Status do pedido alterado para '${newStatus}'.`, 'info');
        } else {
          addToast('Erro ao alterar status', 'error');
        }
      } catch (error) {
        addToast('Erro de conexão', 'error');
      }
    };

    const getStatusColor = (status: Order['status']) => {
      switch(status) {
        case 'Entregue': return 'bg-green-100 text-green-800';
        case 'Em Preparação': return 'bg-purple-100 text-purple-800';
        case 'Aprovado': return 'bg-blue-100 text-blue-800';
        case 'Enviado': return 'bg-orange-100 text-orange-800';
        case 'Cancelado': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="p-6 max-w-6xl mx-auto font-sans">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart /> {viewRole === 'client' ? 'Meus Pedidos' : 'Gestão de Pedidos'}
          </h2>
          {viewRole === 'client' && (
            <button onClick={() => setCurrentView('CLIENT_NEW_ORDER')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 font-semibold">
              <Plus size={18} /> Novo Pedido
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold">
              <tr>
                <th className="p-3">ID Pedido</th>
                {viewRole === 'admin' && <th className="p-3">Cliente</th>}
                <th className="p-3">Data</th>
                <th className="p-3">Itens</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={viewRole === 'admin' ? 7 : 6} className="p-6 text-center text-gray-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                [...displayOrders].sort((a,b) => (b?.createdAt || 0) - (a?.createdAt || 0)).map(order => {
                  if (!order) return null;
                  const client = users.find(u => u.id === order.clientId);
                  return (
                    <tr key={order.id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-mono text-xs font-semibold">{order.id ? String(order.id).toUpperCase() : '---'}</td>
                      {viewRole === 'admin' && <td className="p-3">{client ? client.nome : 'Desconhecido'}</td>}
                      <td className="p-3">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : '---'}</td>
                      <td className="p-3">
                        <ul className="list-disc pl-4">
                          {(order.items || []).map((item, idx) => (
                            <li key={idx} className="text-xs text-gray-600">{item.quantidade}x {item.nome}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3 font-bold text-blue-700">{formatCurrency(order.total || 0)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {order.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {viewRole === 'admin' ? (
                          <select 
                            value={order.status || 'Entregue'} 
                            onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                            className="border rounded p-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="Entregue">Entregue</option>
                            <option value="Em Preparação">Em Preparação</option>
                            <option value="Aprovado">Aprovado</option>
                            <option value="Enviado">Enviado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        ) : (
                          (order.status === null || order.status === 'Em Preparação') && (
                            <button 
                              onClick={() => {
                                console.log('Editando pedido:', order);
                                localStorage.setItem('editing_order', JSON.stringify(order));
                                setCurrentView('CLIENT_NEW_ORDER');
                              }}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 justify-center w-full font-medium"
                            >
                              <Edit size={16} /> Editar
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const OrderForm = ({ 
    items, 
    addToast, 
    currentUser, 
    setOrders, 
    setCurrentView, 
    formatCurrency 
  }: OrderFormProps) => {
    
    const [cart, setCart] = useState<CartItem[]>([]);
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

    // Cálculo do Total
    const totalGeral = cart.reduce((sum, item) => {
      const preco = Number(item.precoNoAto) || 0;
      const qtd = Number(item.quantidade) || 0;
      return sum + (preco * qtd);
    }, 0);

    // Carregar pedido para edição se houver
    useEffect(() => {
      const stored = localStorage.getItem('editing_order');
      if (stored) {
        try {
          const order = JSON.parse(stored);
          setEditingOrderId(order.id);
          if (order.items) setCart(order.items);
        } catch (e) { console.error(e); }
      }
      return () => localStorage.removeItem('editing_order');
    }, []);

    const handleSaveOrder = async () => {
      if (cart.length === 0) {
        addToast('O carrinho está vazio!', 'warning');
        return;
      }
      if (!currentUser?.id) {
        addToast('Usuário não identificado!', 'error');
        return;
      }

      const orderData = {
        id: editingOrderId || undefined, 
        clientId: currentUser.id,
        items: cart,
        total: totalGeral,
        status: 'Aprovado',
        createdAt: Date.now()
      };

      try {
        const method = editingOrderId ? 'PUT' : 'POST';
        const response = await fetch('/api/orders', {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        if (response.ok) {
          addToast(editingOrderId ? 'Pedido atualizado!' : 'Pedido realizado!', 'success');
          setCart([]);
          localStorage.removeItem('editing_order');

          // Atualiza a lista global de pedidos
          const res = await fetch('/api/orders');
          const updatedOrders = await res.json();
          setOrders(updatedOrders);

          setCurrentView('CLIENT_ORDERS');
        } else {
          addToast('Erro ao salvar no banco', 'error');
        }
      } catch (error) {
        addToast('Erro de conexão', 'error');
      }
    };

    const addToCart = (product: any) => {
        console.log("Produto clicado:", product);

        if (!product || !product.id) {
          addToast("Erro: Produto inválido", "error");
          return;
        }

        setCart(prev => {
          const existing = prev.find(item => String(item.id) === String(product.id));

          if (existing) {
            console.log("Item já existe, aumentando quantidade");
            return prev.map(item => 
              String(item.id) === String(product.id) 
                ? { ...item, quantidade: item.quantidade + 1 } 
                : item
            );
          }

          console.log("Item novo, adicionando ao carrinho");
          const newItem = { 
            ...product, 
            quantidade: 1, 
            precoNoAto: Number(product.valor) || 0 
          };
          
          return [...prev, newItem];
        });

        addToast(`${product.nome} adicionado!`, 'success');
      };

    const updateQuantity = (id: string, delta: number) => {
      setCart(prev => prev.map(item => 
        String(item.id) === String(id) ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item
      ).filter(item => item.quantidade > 0));
    };

    return (
      <div className="p-6 max-w-6xl mx-auto flex gap-6 items-start font-sans">
        <div className="w-2/3 bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">📦 Produtos</h3>
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border p-4 rounded-lg flex justify-between items-center hover:shadow-md transition">
                <div>
                  <h4 className="font-semibold">{item.nome}</h4>
                  <p className="text-blue-600 font-bold mt-1">{formatCurrency(item.valor)}</p>
                </div>
                <button 
                  onClick={() => addToCart(item)}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
                >
                  <Plus size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/3 bg-white p-6 rounded-lg shadow-lg border-t-4 border-green-500 sticky top-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">🛒 Carrinho</h3>
          {cart.length === 0 ? (
            <p className="text-center text-gray-500 py-10">Carrinho vazio</p>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm font-medium">{item.nome}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="px-2 border rounded">-</button>
                      <span className="w-6 text-center">{item.quantidade}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="px-2 border rounded">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-xl font-bold mb-4">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(totalGeral)}</span>
                </div>
                <button 
                  onClick={handleSaveOrder}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700"
                >
                  {editingOrderId ? 'Salvar Alterações' : 'Confirmar Pedido'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Roteador Simples
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {currentView !== 'LOGIN' && currentView !== 'REGISTER' && <Navbar />}
      
      <main className="container mx-auto py-6">
        {currentView === 'LOGIN' && <LoginScreen />}
        {currentView === 'REGISTER' && <RegisterScreen />}
        
        {/* Telas de Admin */}
        {currentView === 'ADMIN_ITEMS' && currentUser?.role === 'admin' && <AdminItemsScreen />}
        {currentView === 'ADMIN_ORDERS' && currentUser?.role === 'admin' && <OrderList viewRole="admin" />}
        {currentView === 'ADMIN_USERS' && currentUser?.role === 'admin' && <AdminUsersScreen />}
        
        {/* Telas de Cliente */}
        {currentView === 'CLIENT_ORDERS' && currentUser?.role === 'client' && <OrderList viewRole="client" />}
        {currentView === 'CLIENT_NEW_ORDER' && currentUser?.role === 'client' && (
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