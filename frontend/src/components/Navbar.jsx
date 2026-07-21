import React, { useState } from 'react';
import { 
  Plus, 
  User, 
  Sun, 
  Moon, 
  Server, 
  Globe,
  Activity, 
  MessageSquare, 
  CreditCard, 
  Palette, 
  Gift, 
  ChevronDown,
  LogOut,
  Settings,
  ShieldAlert,
  ArrowLeft,
  Users,
  Tag,
  Sliders,
  LayoutDashboard
} from 'lucide-react';

export default function Navbar({ 
  currentPage, 
  user, 
  setCurrentPage, 
  theme, 
  toggleTheme, 
  t, 
  onLogout,
  adminTab,
  setAdminTab 
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isAdminPage = currentPage === 'admin';

  return (
    <header style={styles.navbar}>
      {/* Логотип + Кнопка выхода из админки */}
      <div style={styles.logoSection}>
        <div style={styles.logoGroup} onClick={() => setCurrentPage('dashboard')}>
          <div style={styles.logoBadge}>
            <img src="/logo.jpg" alt="Alany Host" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
          </div>
          <span style={styles.logoText}>ALANY</span>
          <span style={styles.logoArrow}>&gt;</span>
          <span style={styles.logoTextAccent}>HOST</span>
        </div>

        {isAdminPage && (
          <button 
            onClick={() => setCurrentPage('dashboard')} 
            style={styles.exitAdminBtn}
            title="Вернуться в панель клиента"
          >
            <ArrowLeft size={13} />
            <span>Клиент</span>
          </button>
        )}
      </div>

      {/* Навигационное меню (Админское или Клиентское) */}
      <nav style={styles.navMenu}>
        {isAdminPage ? (
          /* АДМИНСКАЯ / SUPPORT НАВИГАЦИЯ */
          <ul className="nav-menu-list">
            {user?.role !== 'support' && (
              <>
                <li className={`nav-menu-item ${adminTab === 'overview' ? 'nav-menu-item-active' : ''}`}>
                  <span className="nav-menu-link" onClick={() => setAdminTab && setAdminTab('overview')}>
                    <LayoutDashboard size={15} />
                    <span>Обзор</span>
                  </span>
                </li>

                <li className={`nav-menu-item ${adminTab === 'users' ? 'nav-menu-item-active' : ''}`}>
                  <span className="nav-menu-link" onClick={() => setAdminTab && setAdminTab('users')}>
                    <Users size={15} />
                    <span>Клиенты</span>
                  </span>
                </li>

                <li className={`nav-menu-item ${adminTab === 'servers' ? 'nav-menu-item-active' : ''}`}>
                  <span className="nav-menu-link" onClick={() => setAdminTab && setAdminTab('servers')}>
                    <Server size={15} />
                    <span>Сервера</span>
                  </span>
                </li>

                <li className={`nav-menu-item ${adminTab === 'webhosts' ? 'nav-menu-item-active' : ''}`}>
                  <span className="nav-menu-link" onClick={() => setAdminTab && setAdminTab('webhosts')}>
                    <Globe size={15} />
                    <span>Сайты</span>
                  </span>
                </li>

                <li className={`nav-menu-item ${adminTab === 'nodes' ? 'nav-menu-item-active' : ''}`}>
                  <span className="nav-menu-link" onClick={() => setAdminTab && setAdminTab('nodes')}>
                    <Activity size={15} />
                    <span>Ноды</span>
                  </span>
                </li>
              </>
            )}

            <li className={`nav-menu-item ${adminTab === 'tickets' ? 'nav-menu-item-active' : ''}`}>
              <span className="nav-menu-link" onClick={() => setAdminTab && setAdminTab('tickets')}>
                <MessageSquare size={15} />
                <span>Поддержка</span>
              </span>
            </li>

            {user?.role !== 'support' && (
              <>
                <li className={`nav-menu-item ${adminTab === 'promo' ? 'nav-menu-item-active' : ''}`}>
                  <span className="nav-menu-link" onClick={() => setAdminTab && setAdminTab('promo')}>
                    <Tag size={15} />
                    <span>Промокоды</span>
                  </span>
                </li>

                <li className={`nav-menu-item ${adminTab === 'settings' ? 'nav-menu-item-active' : ''}`}>
                  <span className="nav-menu-link" onClick={() => setAdminTab && setAdminTab('settings')}>
                    <Sliders size={15} />
                    <span>Настройки</span>
                  </span>
                </li>
              </>
            )}
          </ul>
        ) : (
          /* КЛИЕНТСКАЯ НАВИГАЦИЯ */
          <ul className="nav-menu-list">
            <li className={`nav-menu-item ${currentPage === 'dashboard' || currentPage === 'detail' ? 'nav-menu-item-active' : ''}`}>
              <span className="nav-menu-link" onClick={() => setCurrentPage('dashboard')}>
                <Server size={15} />
                <span>{t('home')}</span>
              </span>
            </li>

            <li className={`nav-menu-item ${currentPage === 'order' ? 'nav-menu-item-active' : ''}`}>
              <span className="nav-menu-link">
                <Server size={15} />
                <span>{t('servers')}</span>
                <ChevronDown size={10} className="nav-menu-arrow" />
              </span>
              <div className="nav-menu-dropdown">
                <span className="nav-dropdown-item" onClick={() => setCurrentPage('order')}>
                  <Plus size={13} />
                  <span>{t('order_server')}</span>
                </span>
                <span className="nav-dropdown-item" onClick={() => setCurrentPage('my_servers')}>
                  <Server size={13} />
                  <span>{t('my_servers')}</span>
                </span>
              </div>
            </li>

            <li className={`nav-menu-item ${currentPage === 'webhost' ? 'nav-menu-item-active' : ''}`}>
              <span className="nav-menu-link" onClick={() => setCurrentPage('webhost')}>
                <Globe size={15} />
                <span>{t('webhost')}</span>
                <ChevronDown size={10} className="nav-menu-arrow" />
              </span>
              <div className="nav-menu-dropdown">
                <span className="nav-dropdown-item" onClick={() => setCurrentPage('webhost')}>
                  <Plus size={13} />
                  <span>{t('order_webhost')}</span>
                </span>
                <span className="nav-dropdown-item" onClick={() => setCurrentPage('webhost')}>
                  <Globe size={13} />
                  <span>{t('my_webhosts')}</span>
                </span>
              </div>
            </li>

            <li className={`nav-menu-item ${currentPage === 'status' ? 'nav-menu-item-active' : ''}`}>
              <span className="nav-menu-link" onClick={() => setCurrentPage('status')}>
                <Activity size={15} />
                <span>{t('status')}</span>
              </span>
            </li>

            <li className={`nav-menu-item ${currentPage === 'support' ? 'nav-menu-item-active' : ''}`}>
              <span className="nav-menu-link">
                <MessageSquare size={15} />
                <span>{t('support')}</span>
                <ChevronDown size={10} className="nav-menu-arrow" />
              </span>
              <div className="nav-menu-dropdown">
                <span className="nav-dropdown-item" onClick={() => setCurrentPage('support')}>
                  <Plus size={13} />
                  <span>{t('create_ticket')}</span>
                </span>
                <span className="nav-dropdown-item" onClick={() => setCurrentPage('support')}>
                  <MessageSquare size={13} />
                  <span>{t('my_tickets')}</span>
                </span>
              </div>
            </li>

            <li className={`nav-menu-item ${currentPage === 'billing' ? 'nav-menu-item-active' : ''}`}>
              <span className="nav-menu-link">
                <CreditCard size={15} />
                <span>{t('finance')}</span>
                <ChevronDown size={10} className="nav-menu-arrow" />
              </span>
              <div className="nav-menu-dropdown">
                <span className="nav-dropdown-item" onClick={() => setCurrentPage('billing')}>
                  <Plus size={13} />
                  <span>{t('pay_balance')}</span>
                </span>
                <span className="nav-dropdown-item" onClick={() => setCurrentPage('billing')}>
                  <CreditCard size={13} />
                  <span>{t('balance_history')}</span>
                </span>
              </div>
            </li>

            <li className={`nav-menu-item ${currentPage === 'design' || currentPage === 'wheel' ? 'nav-menu-item-active' : ''}`}>
              <span className="nav-menu-link">
                <Palette size={15} />
                <span>{t('services')}</span>
                <ChevronDown size={10} className="nav-menu-arrow" />
              </span>
              <div className="nav-menu-dropdown">
                <span className="nav-dropdown-item" onClick={() => setCurrentPage('design')}>
                  <Palette size={13} />
                  <span>{t('design')}</span>
                </span>
                <span className="nav-dropdown-item" onClick={() => setCurrentPage('wheel')}>
                  <Gift size={13} />
                  <span>{t('wheel')}</span>
                </span>
              </div>
            </li>
          </ul>
        )}
      </nav>

      {/* Правая часть */}
      <div style={styles.rightSection}>
        {/* Баланс */}
        {user && (
          <button 
            onClick={() => setCurrentPage('billing')} 
            style={styles.balanceBtn}
            title={t('pay_balance')}
          >
            <CreditCard size={14} color="var(--accent-blue)" />
            <span style={styles.balanceValue}>{Number(user?.balance || 0).toFixed(2)} ₽</span>
            <span style={styles.plusIcon}>+</span>
          </button>
        )}

        {/* Переключатель темы */}
        <button onClick={toggleTheme} style={styles.iconBtn} title={theme === 'dark' ? t('theme_light') : t('theme_dark')}>
          {theme === 'dark' ? <Sun size={17} color="var(--text-secondary)" /> : <Moon size={17} color="var(--text-secondary)" />}
        </button>

        {/* Профиль пользователя */}
        {user && (
          <div style={{ position: 'relative' }}>
            <div 
              style={styles.userTrigger}
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <div style={styles.userInfo}>
                <span style={user.role === 'admin' ? styles.badgeAdmin : styles.badgeVip}>
                  {user.role === 'admin' ? 'ADMIN' : 'VIP'}
                </span>
                <span style={styles.username}>{user.username}</span>
              </div>
              <div style={{ ...styles.avatar, borderColor: 'var(--border-color)' }}>
                {user.avatar ? (
                  <img src={user.avatar} style={styles.avatarImg} alt="Avatar" />
                ) : (
                  <User size={15} color="var(--text-primary)" />
                )}
              </div>
              <ChevronDown size={12} color="var(--text-secondary)" />
            </div>

            {/* Выпадающий список профиля */}
            {profileDropdownOpen && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                  onClick={() => setProfileDropdownOpen(false)} 
                />
                <div style={styles.dropdownMenu}>
                  <button 
                    style={styles.dropdownItem} 
                    onClick={() => { setCurrentPage('settings'); setProfileDropdownOpen(false); }}
                  >
                    <Settings size={14} />
                    <span>{t('settings')}</span>
                  </button>

                  {user.role === 'admin' && (
                    <button 
                      style={styles.dropdownItem} 
                      onClick={() => { setCurrentPage('admin'); setProfileDropdownOpen(false); }}
                    >
                      <ShieldAlert size={14} color="var(--text-primary)" />
                      <span>Панель админа</span>
                    </button>
                  )}

                  <button 
                    style={styles.dropdownItem} 
                    onClick={() => { setCurrentPage('billing'); setProfileDropdownOpen(false); }}
                  >
                    <CreditCard size={14} />
                    <span>{t('finance')}</span>
                  </button>

                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.3rem 0' }} />

                  <button 
                    style={{ ...styles.dropdownItem, color: 'var(--status-danger)' }} 
                    onClick={() => { onLogout(); setProfileDropdownOpen(false); }}
                  >
                    <LogOut size={14} />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

const styles = {
  navbar: {
    height: '64px',
    backgroundColor: 'var(--bg-secondary)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
  logoBadge: {
    width: 36, height: 36, borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 0 14px rgba(56, 189, 248, 0.2)',
    overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '0.04em',
  },
  logoArrow: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    fontWeight: '900',
    color: '#38bdf8',
    margin: '0 3px',
    textShadow: '0 0 10px rgba(56, 189, 248, 0.6)',
  },
  logoTextAccent: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '0.04em',
  },
  exitAdminBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.35rem 0.75rem',
    borderRadius: '8px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  navMenu: {
    display: 'flex',
    alignItems: 'center',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  balanceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    padding: '0.42rem 0.85rem',
    borderRadius: '10px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'all 0.18s ease',
  },
  balanceValue: {
    fontSize: '0.85rem',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
  },
  plusIcon: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#38bdf8',
    marginLeft: '0.2rem',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36, height: 36,
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-tertiary)',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  userTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.6rem',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    userSelect: 'none',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  username: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  badgeVip: {
    fontSize: '0.6rem',
    fontWeight: '800',
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
  },
  badgeAdmin: {
    fontSize: '0.6rem',
    fontWeight: '800',
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-secondary)',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '180px',
    backgroundColor: 'var(--bg-secondary)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '0.4rem',
    boxShadow: 'var(--card-shadow)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    width: '100%',
    padding: '0.55rem 0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '0.83rem',
    fontWeight: '600',
    fontFamily: 'var(--font-main)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s ease',
  },
};
