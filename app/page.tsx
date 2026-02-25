'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { ShoppingCart, Package, Users, LogOut, Plus, Edit, Trash2, CheckCircle, Key, UserCog } from 'lucide-react';

// --- Utilitários ---
const generateId = (): string => Math.random().toString(36).substr(2, 9);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const safeGetLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item) as T;
    return Array.isArray(defaultValue) && !Array.isArray(parsed) ? defaultValue : parsed;
  } catch (e) {
    console.error(`Erro ao carregar ${key} do localStorage`, e);
    return defaultValue;
  }
};

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
  tipo: string;
  valor: number;
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
  status: 'Pendente' | 'Aprovado' | 'Em Preparação' | 'Enviado' | 'Entregue' | 'Cancelado';
  createdAt: number;
}

// --- Dados Iniciais Mockados ---
const defaultAdmin: User = { id: 'admin-1', nome: 'Administrador', email: 'admin@admin.com', senha: 'admin', role: 'admin' };

export default function HomePage() {
  const { addToast } = useToast();
  // --- Estados Principais ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('LOGIN'); 
  
  // --- Estados de Banco de Dados (LocalStorage) ---
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Carregar dados iniciais com proteções
  useEffect(() => {
    const loadedUsers = safeGetLocalStorage<User[]>('sys_users', [defaultAdmin]);
    const loadedItems = safeGetLocalStorage<Item[]>('sys_items', []);
    const loadedOrders = safeGetLocalStorage<Order[]>('sys_orders', []);
    
    // Garantir que o admin padrão sempre exista se a lista estiver vazia ou sem ele
    if (!loadedUsers.find(u => u.role === 'admin')) {
        setUsers([defaultAdmin, ...loadedUsers]);
    } else {
        setUsers(loadedUsers);
    }
    
    setItems(loadedItems);
    setOrders(loadedOrders);
  }, []);

  // Salvar no LocalStorage sempre que houver mudança
  useEffect(() => { localStorage.setItem('sys_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('sys_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('sys_orders', JSON.stringify(orders)); }, [orders]);

  // --- Funções de Autenticação ---
  const handleLogin = (email: string, senha: string) => {
    const user = users.find(u => u.email === email && u.senha === senha);
    if (user) {
      setCurrentUser(user);
      setCurrentView(user.role === 'admin' ? 'ADMIN_ORDERS' : 'CLIENT_ORDERS');
      addToast(`Bem-vindo(a), ${user.nome}!`, 'success');
    } else {
      addToast('E-mail ou senha incorretos!', 'error');
    }
  };

  const handleRegister = (nome: string, email: string, senha: string) => {
    if (users.find(u => u.email === email)) {
      addToast('E-mail já cadastrado!', 'error');
      return;
    }
    const newUser: User = { id: generateId(), nome, email, senha, role: 'client' };
    setUsers([...users, newUser]);
    addToast('Cadastro realizado com sucesso! Faça o login.', 'success');
    setCurrentView('LOGIN');
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

    const handleAddItem = () => {
      if (!nome || !valor) {
        addToast('Preencha nome e valor do item!', 'warning');
        return;
      }
      const newItem: Item = { id: generateId(), nome, tipo, valor: parseFloat(valor) };
      setItems([...items, newItem]);
      setNome(''); setValor('');
      addToast(`Item '${newItem.nome}' adicionado com sucesso!`, 'success');
    };

    const handleDelete = (id: string) => {
      setItems(items.filter(item => item.id !== id));
      addToast('Item excluído com sucesso!', 'info');
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
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum item cadastrado.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.nome}</td>
                  <td className="p-3">{item.tipo}</td>
                  <td className="p-3">{formatCurrency(item.valor)}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
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

    const handleSaveEdit = () => {
      const updated = users.map(u => u.id === editingUserId ? { ...u, nome: editNome, email: editEmail } : u);
      setUsers(updated);
      setEditingUserId(null);
      addToast('Dados do cliente atualizados com sucesso!', 'success');
    };

    const handleResetPassword = (userId: string) => {
      if (!newPassword) {
        addToast("Digite a nova senha", 'warning');
        return;
      }
      const updated = users.map(u => u.id === userId ? { ...u, senha: newPassword } : u);
      setUsers(updated);
      setNewPassword('');
      setShowPasswordModal(null);
      addToast("Senha alterada com sucesso!", 'success');
    };

    const handleDeleteUser = (userId: string) => {
      if(confirm("Deseja realmente excluir este cliente? Todos os pedidos vinculados permanecerão no histórico como 'Desconhecido'.")) {
        setUsers(users.filter(u => u.id !== userId));
        addToast('Cliente excluído com sucesso!', 'info');
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
              {clients.map(user => (
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
                        <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-800" title="Editar Dados"><Edit size={18} /></button>
                        <button onClick={() => setShowPasswordModal(user.id)} className="text-orange-600 hover:text-orange-800" title="Resetar Senha"><Key size={18} /></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700" title="Excluir"><Trash2 size={18} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-gray-500">Nenhum cliente cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Simples de Senha */}
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
    // PROTEÇÃO: Garantir que displayOrders é sempre um array e os itens dentro dele são válidos
    const displayOrders = (viewRole === 'client' 
      ? (orders || []).filter(o => o && o.clientId === currentUser?.id)
      : (orders || []).filter(o => o !== null));

    const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
      const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      setOrders(updated);
      addToast(`Status do pedido ${orderId.substring(0, 5).toUpperCase()}... alterado para '${newStatus}'.`, 'info');
    };

    const getStatusColor = (status: Order['status']) => {
      switch(status) {
        case 'Pendente': return 'bg-yellow-100 text-yellow-800';
        case 'Aprovado': return 'bg-blue-100 text-blue-800';
        case 'Em Preparação': return 'bg-purple-100 text-purple-800';
        case 'Enviado': return 'bg-orange-100 text-orange-800';
        case 'Entregue': return 'bg-green-100 text-green-800';
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
                <tr><td colSpan={viewRole === 'admin' ? 7 : 6} className="p-6 text-center text-gray-500">Nenhum pedido encontrado.</td></tr>
              ) : [...displayOrders].sort((a,b) => (b?.createdAt || 0) - (a?.createdAt || 0)).map(order => {
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
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {viewRole === 'admin' ? (
                         <select 
                            value={order.status} 
                            onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                            className="border rounded p-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Aprovado">Aprovado</option>
                            <option value="Em Preparação">Em Preparação</option>
                            <option value="Enviado">Enviado</option>
                            <option value="Entregue">Entregue</option>
                            <option value="Cancelado">Cancelado</option>
                         </select>
                      ) : (
                        order.status === 'Pendente' && (
                          <button 
                             onClick={() => {
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const OrderForm = () => {
    const editingOrder = safeGetLocalStorage<Order | null>('editing_order', null);
    const [cart, setCart] = useState<CartItem[]>(editingOrder ? (editingOrder.items || []) : []);
    
    useEffect(() => {
        return () => localStorage.removeItem('editing_order');
    }, []);

    const addToCart = (item: Item) => {
      const existing = cart.find(c => c.id === item.id);
      if (existing) {
        setCart(cart.map(c => c.id === item.id ? { ...c, quantidade: c.quantidade + 1 } : c));
        addToast(`Quantidade de '${item.nome}' atualizada no carrinho.`, 'info');
      } else {
        setCart([...cart, { ...item, quantidade: 1, precoNoAto: item.valor }]);
        addToast(`'${item.nome}' adicionado ao carrinho!`, 'success');
      }
    };

    const updateQuantity = (itemId: string, delta: number) => {
      setCart(cart.map(c => {
        if (c.id === itemId) {
          const newQtd = c.quantidade + delta;
          if (newQtd > 0) {
            addToast(`Quantidade alterada para ${newQtd} de '${c.nome}'.`, 'info');
            return { ...c, quantidade: newQtd };
          } else {
            addToast(`'${c.nome}' removido do carrinho.`, 'info');
            return null; // Will be filtered out
          }
        }
        return c;
      }).filter(Boolean) as CartItem[]);
    };

    const removeFromCart = (itemId: string) => {
      const itemRemoved = cart.find(c => c.id === itemId);
      setCart(cart.filter(c => c.id !== itemId));
      if (itemRemoved) {
        addToast(`'${itemRemoved.nome}' removido do carrinho.`, 'info');
      }
    };

    const total = cart.reduce((acc, item) => acc + (item.precoNoAto * item.quantidade), 0);

    const handleSaveOrder = () => {
      if (cart.length === 0) {
        addToast('Adicione itens ao pedido antes de confirmar!', 'warning');
        return;
      }

      if (editingOrder) {
          const updatedOrders = orders.map(o => o.id === editingOrder.id ? {
              ...o,
              items: cart,
              total: total
          } : o);
          setOrders(updatedOrders);
          addToast('Pedido atualizado com sucesso!', 'success');
      } else {
          const newOrder: Order = {
            id: generateId(),
            clientId: currentUser!.id, // currentUser is guaranteed to exist here
            items: cart,
            total: total,
            status: 'Pendente',
            createdAt: Date.now()
          };
          setOrders([...orders, newOrder]);
          addToast('Pedido realizado com sucesso!', 'success');
      }
      
      localStorage.removeItem('editing_order');
      setCurrentView('CLIENT_ORDERS');
    };

    return (
      <div className="p-6 max-w-6xl mx-auto flex gap-6 items-start font-sans">
        <div className="w-2/3 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">Catálogo de Produtos</h3>
          <div className="grid grid-cols-2 gap-4">
            {items.length === 0 ? <p className="text-gray-500 col-span-2 text-center py-10 italic">Nenhum produto disponível no momento.</p> : null}
            {items.map(item => (
              <div key={item.id} className="border p-4 rounded-lg flex justify-between items-center hover:border-blue-300 transition-all bg-white group">
                <div>
                  <h4 className="font-semibold text-gray-800">{item.nome}</h4>
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase font-bold">{item.tipo}</span>
                  <div className="text-blue-600 font-bold mt-1">{formatCurrency(item.valor)}</div>
                </div>
                <button onClick={() => addToCart(item)} className="bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 p-2 rounded-full transition-colors">
                  <Plus size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/3 bg-white p-6 rounded-lg shadow-lg border-t-4 border-green-500 sticky top-6">
          <h3 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
            <ShoppingCart size={20} className="text-green-600"/> 
            {editingOrder ? 'Edição' : 'Checkout'}
          </h3>
          
          {cart.length === 0 ? (
            <div className="text-center py-12">
               <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={24} className="text-gray-300" />
               </div>
               <p className="text-gray-500 text-sm">Seu pedido está vazio.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm text-gray-800">{item.nome}</h5>
                    <div className="text-[10px] text-gray-400 font-medium uppercase">{formatCurrency(item.precoNoAto)} unid.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 hover:bg-white rounded flex items-center justify-center font-bold text-gray-600 transition-colors">-</button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantidade}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 hover:bg-white rounded flex items-center justify-center font-bold text-gray-600 transition-colors">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-bold text-sm uppercase">Total:</span>
              <span className="text-2xl font-black text-green-600">{formatCurrency(total)}</span>
            </div>
            <button 
              onClick={handleSaveOrder} 
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-white flex justify-center items-center gap-2 shadow-lg transition-all transform active:scale-95 ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-green-600 hover:bg-green-700'}`}
            >
              <CheckCircle size={20} /> {editingOrder ? 'Salvar Alterações' : 'Confirmar Pedido'}
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('editing_order');
                setCurrentView('CLIENT_ORDERS')
              }} 
              className="w-full py-2 mt-2 rounded-xl font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Roteador Simples ---
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
        {currentView === 'CLIENT_NEW_ORDER' && currentUser?.role === 'client' && <OrderForm />}
      </main>
    </div>
  );
}
