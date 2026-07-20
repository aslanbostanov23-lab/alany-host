import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ServerDetail from './pages/ServerDetail';
import OrderServer from './pages/OrderServer';
import Billing from './pages/Billing';
import Support from './pages/Support';
import Admin from './pages/Admin';
import WheelOfFortune from './pages/WheelOfFortune';
import DesignShop from './pages/DesignShop';
import StatusPage from './pages/StatusPage';
import Settings from './pages/Settings';
import Webhost from './pages/Webhost';
import MyServers from './pages/MyServers';

// Словарь локализации (RU / EN)
const LANG_DICT = {
  ru: {
    home: 'Главная',
    servers: 'Серверы',
    order_server: 'Заказать сервер',
    my_servers: 'Мои серверы',
    webhost: 'Веб-хост',
    order_webhost: 'Заказать веб-хост',
    my_webhosts: 'Мои веб-хосты',
    status: 'Статусы',
    support: 'Поддержка',
    create_ticket: 'Создать запрос',
    my_tickets: 'Мои запросы',
    finance: 'Финансы',
    pay_balance: 'Пополнить баланс',
    balance_history: 'История баланса',
    services: 'Услуги',
    design: 'Услуги дизайна',
    wheel: 'Барабан бонусов',
    balance: 'Баланс',
    role_admin: 'Администратор',
    role_client: 'Клиент',
    theme_dark: 'Тёмная тема',
    theme_light: 'Светлая тема',
    settings: 'Настройки профиля',
    logout: 'Выйти из системы',
  },
  en: {
    home: 'Home',
    servers: 'Servers',
    order_server: 'Order server',
    my_servers: 'My servers',
    webhost: 'Web hosting',
    order_webhost: 'Order hosting',
    my_webhosts: 'My hosting',
    status: 'Status',
    support: 'Support',
    create_ticket: 'Create ticket',
    my_tickets: 'My tickets',
    finance: 'Finance',
    pay_balance: 'Top up balance',
    balance_history: 'Balance history',
    services: 'Services',
    design: 'Design Services',
    wheel: 'Spin Wheel',
    balance: 'Balance',
    role_admin: 'Administrator',
    role_client: 'Client',
    theme_dark: 'Dark theme',
    theme_light: 'Light theme',
    settings: 'Profile Settings',
    logout: 'Logout',
  }
};

// Преобразование URL пути в имя страницы
const getPageFromPath = (path) => {
  const cleanPath = path.replace(/\/$/, '') || '/';
  
  if (cleanPath === '/' || cleanPath === '/dashboard') return { page: 'dashboard' };
  if (cleanPath === '/order') return { page: 'order' };
  if (cleanPath === '/my_servers') return { page: 'my_servers' };
  if (cleanPath === '/webhost') return { page: 'webhost' };
  if (cleanPath === '/billing') return { page: 'billing' };
  if (cleanPath === '/support') return { page: 'support' };
  if (cleanPath === '/status') return { page: 'status' };
  if (cleanPath === '/wheel') return { page: 'wheel' };
  if (cleanPath === '/design') return { page: 'design' };
  if (cleanPath === '/settings') return { page: 'settings' };
  if (cleanPath === '/admin') return { page: 'admin' };
  
  const serverMatch = cleanPath.match(/^\/server\/(\d+)$/);
  if (serverMatch) {
    return { page: 'detail', serverId: parseInt(serverMatch[1], 10) };
  }

  return { page: 'dashboard' };
};

// Преобразование имени страницы в URL путь
const getPathFromPage = (page, serverId = null) => {
  switch (page) {
    case 'dashboard': return '/dashboard';
    case 'order': return '/order';
    case 'my_servers': return '/my_servers';
    case 'webhost': return '/webhost';
    case 'billing': return '/billing';
    case 'support': return '/support';
    case 'status': return '/status';
    case 'wheel': return '/wheel';
    case 'design': return '/design';
    case 'settings': return '/settings';
    case 'admin': return '/admin';
    case 'detail': return serverId ? `/server/${serverId}` : '/dashboard';
    default: return '/dashboard';
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPageRaw] = useState('dashboard');
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState('overview');

  // Синхронизация текущего URL с открытой страницей
  const setCurrentPage = (page, serverId = null) => {
    setCurrentPageRaw(page);
    if (serverId) setSelectedServerId(serverId);

    const newPath = getPathFromPage(page, serverId);
    if (window.location.pathname !== newPath) {
      window.history.pushState({ page, serverId }, '', newPath);
    }
  };

  // Обработка кнопки Назад / Вперёд в браузере
  useEffect(() => {
    const handlePopState = () => {
      const { page, serverId } = getPageFromPath(window.location.pathname);
      setCurrentPageRaw(page);
      if (serverId) setSelectedServerId(serverId);
    };

    // Первоначальное чтение пути при загрузке сайта
    const initialRoute = getPageFromPath(window.location.pathname);
    setCurrentPageRaw(initialRoute.page);
    if (initialRoute.serverId) setSelectedServerId(initialRoute.serverId);

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Язык (ru / en)
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ru');

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    const lang = (language === 'ru' || language === 'Русский') ? 'ru' : 'en';
    return LANG_DICT[lang]?.[key] || LANG_DICT['ru']?.[key] || key;
  };

  // Тема
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch (err) {
      console.error('Ошибка сессии:', err);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSelectedServerId(null);
    setCurrentPage('dashboard');
  };

  const handleRefillSuccess = () => {
    checkAuth();
  };

  const handleOrderSuccess = () => {
    checkAuth();
    setCurrentPage('dashboard');
  };

  const handleSelectServer = (serverId) => {
    setCurrentPage('detail', serverId);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <span style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Загрузка Alany Host...</span>
      </div>
    );
  }

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <Navbar 
          currentPage={currentPage} 
          user={user} 
          setCurrentPage={setCurrentPage} 
          theme={theme}
          toggleTheme={toggleTheme}
          t={t}
          language={language}
          setLanguage={setLanguage}
          onLogout={handleLogout}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
        />

        <main style={{ flex: 1 }}>
          {currentPage === 'dashboard' && (
            <Dashboard 
              user={user} 
              onSelectServer={handleSelectServer} 
              setCurrentPage={setCurrentPage}
              t={t}
            />
          )}

          {currentPage === 'detail' && (
            <ServerDetail 
              serverId={selectedServerId} 
              onBack={() => setCurrentPage('dashboard')} 
              user={user}
              t={t}
            />
          )}

          {currentPage === 'order' && (
            <OrderServer 
              user={user} 
              onOrderSuccess={handleOrderSuccess}
              setCurrentPage={setCurrentPage}
              t={t}
            />
          )}

          {currentPage === 'billing' && (
            <Billing 
              user={user} 
              onRefillSuccess={handleRefillSuccess} 
              t={t}
            />
          )}

          {currentPage === 'support' && (
            <Support 
              user={user} 
              t={t}
            />
          )}

          {currentPage === 'admin' && (
            <Admin 
              user={user} 
              setCurrentPage={setCurrentPage}
              adminTab={adminTab}
              setAdminTab={setAdminTab}
              t={t}
            />
          )}

          {currentPage === 'wheel' && (
            <WheelOfFortune 
              user={user} 
              onSpinSuccess={handleRefillSuccess} 
              t={t}
            />
          )}

          {currentPage === 'design' && (
            <DesignShop 
              user={user} 
              onOrderSuccess={handleRefillSuccess} 
              setCurrentPage={setCurrentPage}
              t={t}
            />
          )}

          {currentPage === 'status' && (
            <StatusPage t={t} />
          )}

          {currentPage === 'webhost' && (
            <Webhost user={user} setCurrentPage={setCurrentPage} t={t} />
          )}

          {currentPage === 'my_servers' && (
            <MyServers user={user} onSelectServer={handleSelectServer} setCurrentPage={setCurrentPage} t={t} />
          )}

          {currentPage === 'settings' && (
            <Settings user={user} setCurrentPage={setCurrentPage} t={t} />
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    fontFamily: 'var(--font-main)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--border-color)',
    borderTopColor: 'var(--accent-blue)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
