import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Server, 
  Globe, 
  MessageSquare, 
  Users, 
  Tag, 
  Sliders, 
  ChevronDown, 
  Plus, 
  List, 
  Send, 
  Mail, 
  DollarSign, 
  Activity,
  Cpu
} from 'lucide-react';

export default function AdminNavbar({ adminTab, setAdminTab, t }) {
  return (
    <div style={st.bar}>
      <div style={st.container}>
        
        {/* Метка Админ-панели */}
        <div style={st.badge}>
          <Shield size={14} color="#000" />
          <span>ADMIN PANEL</span>
        </div>

        {/* Меню подразделов */}
        <ul style={st.menuList}>

          {/* Обзор */}
          <li>
            <button
              onClick={() => setAdminTab('overview')}
              style={{ ...st.menuBtn, ...(adminTab === 'overview' ? st.menuBtnActive : {}) }}
            >
              <LayoutDashboard size={14} />
              <span>Обзор</span>
            </button>
          </li>

          {/* Клиенты */}
          <li>
            <button
              onClick={() => setAdminTab('users')}
              style={{ ...st.menuBtn, ...(adminTab === 'users' ? st.menuBtnActive : {}) }}
            >
              <Users size={14} />
              <span>Клиенты</span>
            </button>
          </li>

          {/* Игровые Серверы */}
          <li>
            <button
              onClick={() => setAdminTab('servers')}
              style={{ ...st.menuBtn, ...(adminTab === 'servers' ? st.menuBtnActive : {}) }}
            >
              <Server size={14} />
              <span>Сервера</span>
            </button>
          </li>

          {/* Сайты / Веб-хостинг */}
          <li>
            <button
              onClick={() => setAdminTab('webhosts')}
              style={{ ...st.menuBtn, ...(adminTab === 'webhosts' ? st.menuBtnActive : {}) }}
            >
              <Globe size={14} />
              <span>Сайты</span>
            </button>
          </li>

          {/* Поддержка */}
          <li>
            <button
              onClick={() => setAdminTab('tickets')}
              style={{ ...st.menuBtn, ...(adminTab === 'tickets' ? st.menuBtnActive : {}) }}
            >
              <MessageSquare size={14} />
              <span>Поддержка</span>
            </button>
          </li>

          {/* Промокоды */}
          <li>
            <button
              onClick={() => setAdminTab('promo')}
              style={{ ...st.menuBtn, ...(adminTab === 'promo' ? st.menuBtnActive : {}) }}
            >
              <Tag size={14} />
              <span>Промокоды</span>
            </button>
          </li>

          {/* Настройки системы */}
          <li>
            <button
              onClick={() => setAdminTab('settings')}
              style={{ ...st.menuBtn, ...(adminTab === 'settings' ? st.menuBtnActive : {}) }}
            >
              <Sliders size={14} />
              <span>Настройки</span>
            </button>
          </li>

        </ul>
      </div>
    </div>
  );
}

const st = {
  bar: {
    backgroundColor: 'rgba(18, 14, 5, 0.95)',
    borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
    backdropFilter: 'blur(16px)',
    padding: '0.45rem 1.5rem',
    sticky: 'top',
    zIndex: 95,
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    background: 'linear-gradient(135deg, #f59e0b, #eab308)',
    color: '#000',
    fontSize: '0.68rem',
    fontWeight: 800,
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    letterSpacing: '0.05em',
    boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)',
    flexShrink: 0,
  },
  menuList: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    overflowX: 'auto',
  },
  menuBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.82rem',
    fontWeight: 700,
    fontFamily: 'var(--font-main)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  menuBtnActive: {
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  }
};
