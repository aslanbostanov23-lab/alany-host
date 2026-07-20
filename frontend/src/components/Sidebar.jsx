import React from 'react';
import { 
  Server, 
  PlusCircle, 
  CreditCard, 
  MessageSquare, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  Cpu,
  Gift,
  Palette,
  Activity
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, user, onLogout, t }) {
  const menuItems = [
    { id: 'dashboard', name: t('sidebar_servers'), icon: Server },
    { id: 'order', name: t('sidebar_order'), icon: PlusCircle },
    { id: 'billing', name: t('sidebar_billing'), icon: CreditCard },
    { id: 'design', name: t('sidebar_design'), icon: Palette },
    { id: 'wheel', name: t('sidebar_wheel'), icon: Gift },
    { id: 'status', name: t('sidebar_status'), icon: Activity },
    { id: 'support', name: t('sidebar_support'), icon: MessageSquare },
  ];

  // Добавляем админ-панель, если у пользователя роль admin
  if (user && user.role === 'admin') {
    menuItems.push({ id: 'admin', name: t('sidebar_admin'), icon: ShieldAlert });
  }

  return (
    <aside style={styles.sidebar}>
      {/* Логотип */}
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <img src="/logo.jpg" alt="Alany Logo" style={styles.logoImg} />
        </div>
        <span style={styles.logoText}>Alany <span style={styles.logoSubtext}>Host</span></span>
        <span style={styles.version}>v1.0</span>
      </div>

      {/* Меню навигации */}
      <nav style={styles.nav}>
        <ul style={styles.ul}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'dashboard' && currentPage === 'detail');
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  style={{
                    ...styles.navButton,
                    ...(isActive ? styles.navButtonActive : {})
                  }}
                >
                  {isActive && <div style={styles.activeIndicator} />}
                  <Icon 
                    size={20} 
                    style={isActive ? styles.activeIcon : styles.inactiveIcon} 
                  />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Нижнее меню настроек и выхода */}
      <div style={styles.footer}>
        <button 
          onClick={() => setCurrentPage('settings')}
          style={{
            ...styles.navButton,
            ...(currentPage === 'settings' ? styles.navButtonActive : {})
          }}
        >
          {currentPage === 'settings' && <div style={styles.activeIndicator} />}
          <Settings size={20} style={currentPage === 'settings' ? styles.activeIcon : styles.inactiveIcon} />
          <span>{t('sidebar_settings')}</span>
        </button>
        <button 
          onClick={onLogout} 
          style={{...styles.navButton, ...styles.logoutButton}}
        >
          <LogOut size={20} style={styles.inactiveIcon} />
          <span>{t('sidebar_logout')}</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1rem',
    zIndex: 100,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '2.5rem',
    paddingLeft: '0.5rem',
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  logoSubtext: {
    color: 'var(--accent-blue)',
    fontWeight: 'bold',
  },
  version: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    marginLeft: 'auto',
    border: '1px solid var(--border-color)',
  },
  nav: {
    flex: 1,
  },
  ul: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    border: 'none',
    outline: 'none',
    position: 'relative',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-main)',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'var(--transition-smooth)',
  },
  navButtonActive: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
  },
  activeIndicator: {
    position: 'absolute',
    left: '0px',
    top: '0px',
    bottom: '0px',
    width: '4px',
    backgroundColor: 'var(--accent-blue)',
    borderRadius: '12px 0 0 12px',
  },
  activeIcon: {
    color: 'var(--accent-primary)',
  },
  inactiveIcon: {
    color: 'var(--text-secondary)',
    transition: 'var(--transition-smooth)',
  },
  footer: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  logoutButton: {
    color: 'var(--status-danger)',
  },
};
