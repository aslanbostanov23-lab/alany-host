import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { 
  Users, 
  Server, 
  CreditCard, 
  MessageSquare, 
  ShieldAlert, 
  Plus, 
  Check, 
  ArrowLeft,
  Send,
  Globe,
  Tag,
  Sliders,
  DollarSign,
  Activity,
  HardDrive,
  Trash2,
  Lock,
  Search,
  Play,
  Square,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Image
} from 'lucide-react';

export default function Admin({ user, setCurrentPage, adminTab: propAdminTab, setAdminTab: propSetAdminTab }) {
  const [stats, setStats] = useState(null);
  const [localAdminTab, setLocalAdminTab] = useState('overview');

  const adminTab = propAdminTab || localAdminTab;
  const setAdminTab = propSetAdminTab || setLocalAdminTab;

  const [usersList, setUsersList] = useState([]);
  const [ticketsList, setTicketsList] = useState([]);
  const [serversList, setServersList] = useState([]);
  const [webhostsList, setWebhostsList] = useState([]);
  const [promoList, setPromoList] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Модалка пополнения баланса
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('1000');
  const [balanceAction, setBalanceAction] = useState('add');

  // Модалка промокода
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoAmount, setPromoAmount] = useState('100');

  // Тикеты
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [adminAttachment, setAdminAttachment] = useState(null);

  // Ноды
  const [nodesList, setNodesList] = useState([]);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [nodeName, setNodeName] = useState('');
  const [nodeLocation, setNodeLocation] = useState('Москва, РФ');
  const [nodeIp, setNodeIp] = useState('');
  const [nodeCpu, setNodeCpu] = useState('32');
  const [nodeRam, setNodeRam] = useState('128');
  const [nodeSsd, setNodeSsd] = useState('2048');

  // Полноценное редактирование пользователя
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editBalance, setEditBalance] = useState('0');
  const [editPassword, setEditPassword] = useState('');

  const openEditUserModal = (u) => {
    setSelectedUser(u);
    setEditUsername(u.username || '');
    setEditEmail(u.email || '');
    setEditRole(u.role || 'user');
    setEditBalance(u.balance !== undefined ? u.balance : 0);
    setEditPassword('');
  };

  const handleFullUserUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.put(`/admin/users/${selectedUser.id}`, {
        username: editUsername,
        email: editEmail,
        role: editRole,
        balance: editBalance,
        password: editPassword
      });
      setSelectedUser(null);
      fetchUsers();
      alert('Профиль пользователя успешно сохранен!');
    } catch (err) {
      alert('Ошибка при сохранении профиля пользователя');
    }
  };

  useEffect(() => {
    if (user?.role === 'support') {
      setAdminTab('tickets');
    }
    fetchAllData();
  }, [user]);

  const fetchAllData = () => {
    fetchAdminStats();
    fetchUsers();
    fetchTickets();
    fetchServers();
    fetchPromo();
    fetchWebhosts();
    fetchNodes();
  };

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.get('/admin/users');
      setUsersList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = async () => {
    try {
      const data = await api.get('/admin/tickets');
      setTicketsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServers = async () => {
    try {
      const data = await api.get('/admin/servers');
      setServersList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPromo = async () => {
    try {
      const data = await api.get('/admin/promo');
      setPromoList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWebhosts = async () => {
    try {
      const data = await api.get('/admin/webhosts');
      setWebhostsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNodes = async () => {
    try {
      const data = await api.get('/admin/nodes');
      setNodesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNode = async (e) => {
    e.preventDefault();
    if (!nodeName || !nodeIp) return;
    try {
      await api.post('/admin/nodes', {
        name: nodeName,
        location: nodeLocation,
        ip_address: nodeIp,
        cpu_total: parseInt(nodeCpu),
        ram_total: parseInt(nodeRam),
        ssd_total: parseInt(nodeSsd)
      });
      setShowNodeModal(false);
      setNodeName('');
      setNodeIp('');
      fetchNodes();
    } catch (err) {
      alert('Ошибка создания ноды');
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm('Вы действительно хотите удалить эту KVM-ноду?')) return;
    try {
      await api.delete(`/admin/nodes/${nodeId}`);
      fetchNodes();
    } catch (err) {
      alert('Ошибка удаления ноды');
    }
  };

  const fetchTicketMessages = async () => {
    if (!activeTicketId) return;
    try {
      const data = await api.get(`/tickets/${activeTicketId}/messages`);
      setTicketDetails(data.ticket);
      setTicketMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTicketId) {
      fetchTicketMessages();
      const interval = setInterval(fetchTicketMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTicketId]);

  // Изменение баланса пользователя
  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.post(`/admin/users/${selectedUser.id}/balance`, {
        amount: parseFloat(balanceAmount),
        action: balanceAction
      });
      setSelectedUser(null);
      fetchUsers();
      fetchAdminStats();
      alert('Баланс успешно обновлен');
    } catch (err) {
      console.error(err);
      alert('Ошибка при обновлении баланса');
    }
  };

  // Смена роли пользователя
  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Вы уверены, что хотите изменить роль у ${targetUser.username} на ${newRole}?`)) return;

    try {
      await api.post(`/admin/users/${targetUser.id}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert('Ошибка смены роли');
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Вы действительно хотите удалить этого пользователя?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
      fetchAdminStats();
    } catch (err) {
      alert(err.error || 'Ошибка удаления пользователя');
    }
  };

  // Управление сервером клиенту (Start / Stop)
  const handleServerAction = async (serverId, action) => {
    try {
      await api.post(`/admin/servers/${serverId}/action`, { action });
      fetchServers();
      fetchAdminStats();
    } catch (err) {
      alert('Ошибка управления сервером');
    }
  };

  // Удаление сервера
  const handleDeleteServer = async (serverId) => {
    if (!window.confirm('Вы действительно хотите удалить этот сервер?')) return;
    try {
      await api.delete(`/admin/servers/${serverId}`);
      fetchServers();
      fetchAdminStats();
    } catch (err) {
      alert('Ошибка удаления сервера');
    }
  };

  // Создание промокода
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!promoCode) return;
    try {
      await api.post('/admin/promo', {
        code: promoCode,
        amount: parseFloat(promoAmount)
      });
      setShowPromoModal(false);
      setPromoCode('');
      fetchPromo();
      alert('Промокод создан!');
    } catch (err) {
      alert(err.error || 'Ошибка создания промокода');
    }
  };

  // Удаление промокода
  const handleDeletePromo = async (promoId) => {
    if (!window.confirm('Удалить промокод?')) return;
    try {
      await api.delete(`/admin/promo/${promoId}`);
      fetchPromo();
    } catch (err) {
      alert('Ошибка удаления промокода');
    }
  };

  // Ответ на тикет
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!adminReply.trim() && !adminAttachment) return;
    try {
      await api.post(`/tickets/${activeTicketId}/messages`, {
        message: adminReply,
        attachment: adminAttachment
      });
      setAdminReply('');
      setAdminAttachment(null);
      fetchTicketMessages();
    } catch (err) {
      console.error(err);
    }
  };

  // Закрыть тикет
  const handleResolveTicket = async (ticketId) => {
    if (!window.confirm('Вы действительно хотите закрыть этот тикет?')) return;
    try {
      await api.post(`/admin/tickets/${ticketId}/resolve`);
      fetchTickets();
      if (activeTicketId === ticketId) setActiveTicketId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">

      {/* ══════════ ВКЛАДКА: ОБЗОР ══════════ */}
      {adminTab === 'overview' && (
        <div>
          <div style={st.statsRow}>
            <StatCard 
              title="Клиентов в базе" 
              value={stats?.total_users || 0} 
              icon={Users} 
            />
            <StatCard 
              title="Всего серверов" 
              value={stats?.total_servers || 0} 
              icon={Server} 
              description={`Активно: ${stats?.active_servers || 0}`}
            />
            <StatCard 
              title="Оборот платежей" 
              value={`${stats?.total_refills?.toFixed(2) || '0.00'} ₽`} 
              icon={CreditCard} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={st.cardTitle}>Последние клиенты</h3>
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Пользователь</th>
                      <th>Email</th>
                      <th>Роль</th>
                      <th>Баланс</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.slice(0, 5).map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td><strong>{u.username}</strong></td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.balance?.toFixed(2)} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={st.cardTitle}>Быстрые действия</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setAdminTab('users')}>
                  <Users size={16} />
                  <span>Клиенты ({usersList.length})</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setShowPromoModal(true)}>
                  <Tag size={16} />
                  <span>Создать промокод</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setAdminTab('tickets')}>
                  <MessageSquare size={16} />
                  <span>Тикеты ({ticketsList.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ ВКЛАДКА: КЛИЕНТЫ ══════════ */}
      {adminTab === 'users' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={st.tableHeadBar}>
            <h3 style={st.cardTitle}>Клиенты системы ({usersList.length})</h3>
            <div style={st.searchBox}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Поиск по нику или email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={st.searchInput}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Логин</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Баланс</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800 }}>{u.balance?.toFixed(2)} ₽</td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => openEditUserModal(u)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        title="Редактировать аккаунт"
                      >
                        <UserCheck size={13} />
                        <span>Изменить</span>
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDeleteUser(u.id)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        title="Удалить аккаунт"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ ВКЛАДКА: СЕРВЕРА ══════════ */}
      {adminTab === 'servers' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={st.cardTitle}>Игровые серверы клиентов ({serversList.length})</h3>
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Владелец</th>
                  <th>Тип</th>
                  <th>IP / Порт</th>
                  <th>Ресурсы</th>
                  <th>Статус</th>
                  <th style={{ textAlign: 'right' }}>Управление</th>
                </tr>
              </thead>
              <tbody>
                {serversList.map(s => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.owner_name}</td>
                    <td>{s.game_type}</td>
                    <td>{s.ip_address}:{s.port}</td>
                    <td>{s.ram_mb} MB / {s.cpu_cores} ядра</td>
                    <td>
                      <span className={`badge ${s.status === 'running' ? 'badge-success' : 'badge-danger'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      {s.status === 'running' ? (
                        <button className="btn btn-secondary" onClick={() => handleServerAction(s.id, 'stop')} style={{ padding: '0.35rem 0.6rem' }}>
                          <Square size={13} /> Stop
                        </button>
                      ) : (
                        <button className="btn btn-success" onClick={() => handleServerAction(s.id, 'start')} style={{ padding: '0.35rem 0.6rem' }}>
                          <Play size={13} /> Start
                        </button>
                      )}
                      <button className="btn btn-danger" onClick={() => handleDeleteServer(s.id)} style={{ padding: '0.35rem 0.6rem' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ ВКЛАДКА: САЙТЫ (ВЕБ-ХОСТИНГ) ══════════ */}
      {adminTab === 'webhosts' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={st.cardTitle}>Веб-хостинги и домены клиентов ({webhostsList.length})</h3>
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Домен</th>
                  <th>Владелец</th>
                  <th>Тариф</th>
                  <th>FTP Логин</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {webhostsList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Активных веб-сайтов пока нет
                    </td>
                  </tr>
                ) : (
                  webhostsList.map(w => (
                    <tr key={w.id}>
                      <td>#{w.id}</td>
                      <td><strong>{w.domain}</strong></td>
                      <td>{w.owner_name}</td>
                      <td>{w.tarif}</td>
                      <td><code>{w.ftp_user}</code></td>
                      <td><span className="badge badge-success">Активен</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ ВКЛАДКА: ПРОМОКОДЫ ══════════ */}
      {adminTab === 'promo' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={st.tableHeadBar}>
            <h3 style={st.cardTitle}>Промокоды на баланс ({promoList.length})</h3>
            <button className="btn btn-primary" onClick={() => setShowPromoModal(true)}>
              <Plus size={16} />
              <span>Создать промокод</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Сумма бонуса</th>
                  <th>Использовано</th>
                  <th>Макс. активаций</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {promoList.map(p => (
                  <tr key={p.id}>
                    <td><code style={st.promoCode}>{p.code}</code></td>
                    <td style={{ fontWeight: 800, color: 'var(--status-success)' }}>+{p.amount} ₽</td>
                    <td>{p.uses_count} раз</td>
                    <td>{p.max_uses}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-danger" onClick={() => handleDeletePromo(p.id)} style={{ padding: '0.35rem 0.6rem' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ ВКЛАДКА: ТИКЕТЫ ══════════ */}
      {adminTab === 'tickets' && (
        <div>
          {activeTicketId ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              {/* Шапка тикета */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-primary)' }}>
                <button onClick={() => setActiveTicketId(null)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <ArrowLeft size={14} />
                  <span>Назад</span>
                </button>

                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ticketDetails?.subject}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Обращение #{activeTicketId}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {ticketDetails?.status === 'resolved' ? (
                    <span className="badge badge-success">Решено</span>
                  ) : (
                    <span className="badge badge-warning">В обработке</span>
                  )}
                  {ticketDetails?.status !== 'resolved' && (
                    <button className="btn btn-danger" onClick={() => handleResolveTicket(activeTicketId)} style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>
                      <Check size={13} />
                      <span>Закрыть</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Окно сообщений */}
              <div style={{ padding: '1.5rem', maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
                
                {/* Пунктирный блок информации */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '12px', alignSelf: 'center', marginBottom: '1rem', maxWidth: '440px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Диалог со специалистом службы поддержки Alany Host. Пожалуйста, опишите проблему детально.
                  </span>
                </div>

                {ticketMessages.map((msg) => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div 
                      key={msg.id} 
                      style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: isAdmin ? 'flex-start' : 'flex-end',
                        alignItems: 'flex-end',
                        marginBottom: '0.75rem'
                      }}
                    >
                      {/* Аватар техподдержки слева */}
                      {isAdmin && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid var(--accent-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '0.75rem',
                          marginBottom: '0.25rem',
                          flexShrink: 0
                        }}>
                          <ShieldCheck size={16} color="var(--accent-blue)" />
                        </div>
                      )}

                      {/* Баббл сообщения */}
                      <div style={{
                        maxWidth: '75%',
                        padding: '0.85rem 1.1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: isAdmin ? '16px 16px 16px 4px' : '16px 16px 4px 16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 'bold', color: isAdmin ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.9)' }}>
                            {isAdmin ? '🛡️ Техподдержка' : msg.sender_name}
                          </span>
                          <span style={{ color: isAdmin ? 'var(--text-muted)' : 'rgba(255, 255, 255, 0.6)' }}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        {msg.message && (
                          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                            {msg.message}
                          </p>
                        )}
                        {msg.attachment && (
                          <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', maxWidth: '300px', cursor: 'pointer' }} onClick={() => window.open(msg.attachment, '_blank')}>
                            <img src={msg.attachment} style={{ width: '100%', display: 'block', maxHeight: '200px', objectFit: 'cover' }} alt="Attachment" />
                          </div>
                        )}
                      </div>

                      {/* Аватар пользователя справа */}
                      {!isAdmin && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: '0.75rem',
                          marginBottom: '0.25rem',
                          flexShrink: 0
                        }}>
                          <Users size={16} color="var(--text-secondary)" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Превью прикрепленного изображения */}
              {adminAttachment && (
                <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '45px', height: '45px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={adminAttachment} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Attachment Preview" />
                    <button 
                      type="button" 
                      onClick={() => setAdminAttachment(null)}
                      style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✕
                    </button>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Изображение прикреплено</span>
                </div>
              )}

              {/* Поле ответа */}
              <form onSubmit={handleSendReply} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-primary)', alignItems: 'center' }}>
                <input 
                  type="file" 
                  id="adminTicketAttachmentInput" 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAdminAttachment(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => document.getElementById('adminTicketAttachmentInput').click()}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 0.85rem', borderRadius: '12px' }}
                  disabled={ticketDetails?.status === 'resolved'}
                  title="Прикрепить скриншот"
                >
                  <Image size={18} />
                </button>

                <input
                  className="form-input"
                  placeholder={ticketDetails?.status === 'resolved' ? 'Тикет закрыт. Создайте новое обращение для продолжения.' : 'Ответьте клиенту...'}
                  value={adminReply}
                  onChange={e => setAdminReply(e.target.value)}
                  disabled={ticketDetails?.status === 'resolved'}
                  style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.75rem 1rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '12px', padding: '0.75rem 1rem' }} disabled={ticketDetails?.status === 'resolved' || (!adminReply.trim() && !adminAttachment)}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={st.cardTitle}>Тикеты техподдержки ({ticketsList.length})</h3>
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Тема</th>
                      <th>Клиент</th>
                      <th>Статус</th>
                      <th style={{ textAlign: 'right' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsList.map(t => (
                      <tr key={t.id}>
                        <td>#{t.id}</td>
                        <td><strong>{t.subject}</strong></td>
                        <td>{t.creator_name || `User #${t.user_id}`}</td>
                        <td>
                          <span className={`badge ${t.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary" onClick={() => setActiveTicketId(t.id)}>
                            Открыть
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ ВКЛАДКА: НАСТРОЙКИ ══════════ */}
      {adminTab === 'settings' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={st.cardTitle}>Системные настройки и Боевые платежные шлюзы</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Название хостинга</label>
              <input className="form-input" defaultValue="Alany Host - Премиальный игровой хостинг" />
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h4 style={{ color: 'var(--accent-blue)', margin: '0 0 1rem 0' }}>💳 Настройки ЮKassa (СБП, Карты МИР, SberPay, T-Pay)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ЮKassa Shop ID</label>
                  <input className="form-input" placeholder="например: 390291" />
                </div>
                <div className="form-group">
                  <label className="form-label">ЮKassa Secret Key</label>
                  <input className="form-input" type="password" placeholder="live_secret_key_..." />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ color: 'var(--status-warning)', margin: '0 0 1rem 0' }}>🕹️ Настройки FreeKassa / LAVA (Игровые мерчанты)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">FreeKassa Merchant ID</label>
                  <input className="form-input" placeholder="например: 29810" />
                </div>
                <div className="form-group">
                  <label className="form-label">Секретное слово (Secret Word 1)</label>
                  <input className="form-input" type="password" placeholder="secret_word_1" />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ color: 'var(--status-success)', margin: '0 0 1rem 0' }}>💎 Настройки Cryptomus / CryptoPay (USDT, TON)</h4>
              <div className="form-group">
                <label className="form-label">Payment API Key Cryptomus</label>
                <input className="form-input" type="password" placeholder="cryptomus_api_key_..." />
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => alert('Боевые ключи платежных шлюзов успешно сохранены!')} style={{ marginTop: '1rem' }}>
              Сохранить настройки платежных систем
            </button>
          </div>
        </div>
      )}

      {/* ══════════ ВКЛАДКА: НОДЫ (KVM СЕРВЕРЫ УЗЛОВ) ══════════ */}
      {adminTab === 'nodes' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={st.cardTitle}>Управление KVM-Нодами ({nodesList.length})</h3>
            <button className="btn btn-primary" onClick={() => setShowNodeModal(true)}>
              <Plus size={16} />
              <span>Добавить KVM-Ноду</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название Ноды</th>
                  <th>Локация</th>
                  <th>IP Адрес</th>
                  <th>Ресурсы (vCPU / RAM / NVMe)</th>
                  <th>Статус</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {nodesList.map(node => (
                  <tr key={node.id}>
                    <td>#{node.id}</td>
                    <td><strong>{node.name}</strong></td>
                    <td>{node.location}</td>
                    <td><code>{node.ip_address}</code></td>
                    <td>{node.cpu_total} vCPU | {node.ram_total} GB RAM | {node.ssd_total} GB NVMe</td>
                    <td>
                      <span className="badge badge-success">В сети</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-danger" onClick={() => handleDeleteNode(node.id)} style={{ padding: '0.35rem 0.65rem' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модалка полноценного редактирования профиля клиента */}
      {selectedUser && (
        <Modal title={`Редактирование профиля: ${selectedUser.username}`} onClose={() => setSelectedUser(null)}>
          <form onSubmit={handleFullUserUpdate}>
            <div className="form-group">
              <label className="form-label">Имя пользователя (Логин)</label>
              <input className="form-input" value={editUsername} onChange={e => setEditUsername(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email адрес</label>
              <input className="form-input" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Роль в системе</label>
              <select className="form-input" value={editRole} onChange={e => setEditRole(e.target.value)}>
                <option value="user">Клиент (User)</option>
                <option value="support">Агент техподдержки (Support)</option>
                <option value="admin">Главный администратор (Admin)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Баланс аккаунта (₽)</label>
              <input className="form-input" type="number" step="0.01" value={editBalance} onChange={e => setEditBalance(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Новый пароль (оставьте пустым, если не меняется)</label>
              <input className="form-input" type="password" placeholder="••••••••" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Сохранить изменения профиля</button>
          </form>
        </Modal>
      )}

      {/* Модалка создания промокода */}
      {showPromoModal && (
        <Modal title="Генерация нового промокода" onClose={() => setShowPromoModal(false)}>
          <form onSubmit={handleCreatePromo}>
            <div className="form-group">
              <label className="form-label">Код промокода</label>
              <input className="form-input" placeholder="например: BONUS500" value={promoCode} onChange={e => setPromoCode(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Сумма бонуса на баланс (₽)</label>
              <input className="form-input" type="number" value={promoAmount} onChange={e => setPromoAmount(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Создать промокод</button>
          </form>
        </Modal>
      )}

      {/* Модалка создания KVM-Ноды */}
      {showNodeModal && (
        <Modal title="Добавить новую KVM-Ноду" onClose={() => setShowNodeModal(false)}>
          <form onSubmit={handleCreateNode}>
            <div className="form-group">
              <label className="form-label">Название Ноды</label>
              <input className="form-input" placeholder="например: MSK-NODE-3 (DataPro)" value={nodeName} onChange={e => setNodeName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Локация</label>
              <input className="form-input" placeholder="например: Москва, РФ" value={nodeLocation} onChange={e => setNodeLocation(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">IP Адрес ноды</label>
              <input className="form-input" placeholder="например: 194.58.118.99" value={nodeIp} onChange={e => setNodeIp(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Выделенные vCPU Ядра</label>
              <input className="form-input" type="number" value={nodeCpu} onChange={e => setNodeCpu(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Оперативная память RAM (GB)</label>
              <input className="form-input" type="number" value={nodeRam} onChange={e => setNodeRam(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Накопитель NVMe SSD (GB)</label>
              <input className="form-input" type="number" value={nodeSsd} onChange={e => setNodeSsd(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Добавить KVM-Узел</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

const st = {
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  tableHeadBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0.4rem 0.75rem',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    outline: 'none',
  },
  promoCode: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    fontWeight: 700,
  }
};
