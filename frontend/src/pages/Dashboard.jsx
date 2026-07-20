import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { 
  Server, 
  CreditCard, 
  MessageSquare, 
  Globe,
  Palette,
  Gift,
  Plus,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function Dashboard({ user, onSelectServer, setCurrentPage }) {
  const [stats, setStats] = useState({
    serverCount: 0,
    ticketCount: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const serverList = await api.get('/servers');
      const tickets = await api.get('/tickets');
      setStats({
        serverCount: Array.isArray(serverList) ? serverList.length : 0,
        ticketCount: Array.isArray(tickets) ? tickets.length : 0,
      });
    } catch (error) {
      console.error('Ошибка загрузки дашборда:', error);
    }
  };

  return (
    <div className="page-container">
      {/* Баннер приветствия */}
      <div className="card" style={st.welcomeBanner}>
        <div>
          <h1 style={st.welcomeTitle}>Приветствуем, {user?.username}!</h1>
          <p style={st.welcomeText}>
            Панель управления игровыми серверами, веб-хостингом и услугами.
          </p>
        </div>

        <div style={st.bannerBtns}>
          <button className="btn btn-primary" onClick={() => setCurrentPage('order')}>
            <Plus size={16} />
            <span>Заказать сервер</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setCurrentPage('webhost')}>
            <Globe size={16} />
            <span>Веб-хостинг</span>
          </button>
        </div>
      </div>

      {/* Метрики аккаунта */}
      <div style={st.statsGrid}>
        <div className="card" style={st.statCardBox}>
          <div style={st.statHeader}>
            <span style={st.statTitle}>Баланс аккаунта</span>
            <div style={st.iconCircle}>
              <CreditCard size={18} color="var(--text-primary)" />
            </div>
          </div>
          <div style={st.statValue}>{user?.balance ? user.balance.toFixed(2) : '0.00'} ₽</div>
          <button className="btn btn-secondary" onClick={() => setCurrentPage('billing')} style={st.statActionBtn}>
            <span>Пополнить баланс</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="card" style={st.statCardBox}>
          <div style={st.statHeader}>
            <span style={st.statTitle}>Мои серверы</span>
            <div style={st.iconCircle}>
              <Server size={18} color="var(--text-primary)" />
            </div>
          </div>
          <div style={st.statValue}>{stats.serverCount}</div>
          <button className="btn btn-secondary" onClick={() => setCurrentPage('my_servers')} style={st.statActionBtn}>
            <span>Управление серверами</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="card" style={st.statCardBox}>
          <div style={st.statHeader}>
            <span style={st.statTitle}>Поддержка клиентов</span>
            <div style={st.iconCircle}>
              <MessageSquare size={18} color="var(--text-primary)" />
            </div>
          </div>
          <div style={st.statValue}>{stats.ticketCount}</div>
          <button className="btn btn-secondary" onClick={() => setCurrentPage('support')} style={st.statActionBtn}>
            <span>Открыть тикеты</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Быстрые сервисы */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={st.sectionTitle}>Услуги & Сервисы</h3>
        <div style={st.servicesGrid}>
          
          <div className="card" style={st.serviceCard} onClick={() => setCurrentPage('order')}>
            <div style={st.serviceIconBox}>
              <Server size={20} color="var(--text-primary)" />
            </div>
            <div>
              <h4 style={st.serviceName}>Игровые серверы</h4>
              <p style={st.serviceDesc}>Minecraft, CS2, GTA SAMP/MTA на NVMe дисках.</p>
            </div>
          </div>

          <div className="card" style={st.serviceCard} onClick={() => setCurrentPage('webhost')}>
            <div style={st.serviceIconBox}>
              <Globe size={20} color="var(--text-primary)" />
            </div>
            <div>
              <h4 style={st.serviceName}>Веб-хостинг</h4>
              <p style={st.serviceDesc}>Быстрый хостинг сайтов, баз данных MySQL и доменов.</p>
            </div>
          </div>

          <div className="card" style={st.serviceCard} onClick={() => setCurrentPage('design')}>
            <div style={st.serviceIconBox}>
              <Palette size={20} color="var(--text-primary)" />
            </div>
            <div>
              <h4 style={st.serviceName}>Услуги дизайна</h4>
              <p style={st.serviceDesc}>Оформление групп, баннеров, логотипов и интерфейсов.</p>
            </div>
          </div>

          <div className="card" style={st.serviceCard} onClick={() => setCurrentPage('wheel')}>
            <div style={st.serviceIconBox}>
              <Gift size={20} color="var(--text-primary)" />
            </div>
            <div>
              <h4 style={st.serviceName}>Колесо фортуны</h4>
              <p style={st.serviceDesc}>Крутите барабан и получайте бонусы на баланс.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Статус нод */}
      <div className="card" style={st.statusBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={22} color="var(--status-success)" />
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Все серверные узлы функционируют штатно (Uptime 99.99%)
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Защита DDoS-Guard активна на всех игровых и веб-локациях.
            </span>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => setCurrentPage('status')} style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
          <span>Статус системы</span>
        </button>
      </div>

    </div>
  );
}

const st = {
  welcomeBanner: {
    padding: '1.75rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1.25rem',
  },
  welcomeTitle: {
    margin: '0 0 0.25rem',
    fontSize: '1.7rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  welcomeText: {
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  bannerBtns: {
    display: 'flex',
    gap: '0.75rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  statCardBox: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '1.5rem',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  statTitle: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 10,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statValue: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
    marginBottom: '1.25rem',
  },
  statActionBtn: {
    width: '100%',
    justifyContent: 'space-between',
    padding: '0.55rem 0.85rem',
    fontSize: '0.82rem',
  },
  sectionTitle: {
    margin: '0 0 1rem',
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
  },
  serviceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem',
    cursor: 'pointer',
  },
  serviceIconBox: {
    width: 40, height: 40, borderRadius: 10,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  serviceName: {
    margin: '0 0 0.2rem',
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  serviceDesc: {
    margin: 0,
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  statusBox: {
    marginTop: '1.5rem',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  }
};
