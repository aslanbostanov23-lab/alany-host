import React, { useState } from 'react';
import { api } from '../api';
import { Cpu, ShieldCheck, Mail, Lock, User } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    login: '' // Используется для входа (username или email)
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Логин
        const data = await api.post('/auth/login', {
          login: formData.login,
          password: formData.password
        });
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.user);
      } else {
        // Регистрация
        const data = await api.post('/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Произошла ошибка при авторизации. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.authBox}>
        <div style={styles.logoWrapper}>
          <div style={styles.logoIcon}>
            <img src="/logo.jpg" alt="Alany Logo" style={styles.logoImg} />
          </div>
          <h2 style={styles.logoText}>Alany <span style={styles.logoSubtext}>Host</span></h2>
          <p style={styles.logoDesc}>Премиальный игровой хостинг серверов</p>
        </div>

        {/* Переключатель вкладок */}
        <div style={styles.tabs}>
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{ ...styles.tab, ...(isLogin ? styles.activeTab : {}) }}
          >
            Вход
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{ ...styles.tab, ...(!isLogin ? styles.activeTab : {}) }}
          >
            Регистрация
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          {isLogin ? (
            // Поля для Входа
            <div style={styles.formFields}>
              <div className="form-group">
                <label className="form-label">Имя пользователя или Email</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    name="login"
                    value={formData.login}
                    onChange={handleInputChange}
                    placeholder="Введите имя пользователя или email"
                    className="form-input"
                    required
                    style={styles.paddedInput}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Поля для Регистрации
            <div style={styles.formFields}>
              <div className="form-group">
                <label className="form-label">Имя пользователя</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Придумайте имя пользователя"
                    className="form-input"
                    required
                    style={styles.paddedInput}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Введите ваш адрес почты"
                    className="form-input"
                    required
                    style={styles.paddedInput}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Пароль (общий для обоих состояний) */}
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Введите пароль"
                className="form-input"
                required
                style={styles.paddedInput}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary"
            style={styles.submitBtn}
          >
            {loading ? 'Загрузка...' : isLogin ? 'Войти в личный кабинет' : 'Зарегистрироваться'}
          </button>
        </form>

        <div style={styles.footerNote}>
          <ShieldCheck size={14} color="var(--text-muted)" />
          <span style={styles.footerText}>Ваши данные защищены сквозным шифрованием</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at center, #11141b 0%, #060709 100%)',
    padding: '1rem',
  },
  authBox: {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 40px rgba(99, 102, 241, 0.05)',
  },
  logoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  logoIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.75rem',
    border: '1.5px solid var(--border-color)',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  logoText: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '0.25rem',
  },
  logoSubtext: {
    color: 'var(--accent-blue)',
    fontWeight: 'bold',
  },
  logoDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  tabs: {
    display: 'flex',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '12px',
    padding: '0.25rem',
    marginBottom: '1.5rem',
    border: '1px solid var(--border-color)',
  },
  tab: {
    flex: 1,
    padding: '0.6rem 0',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-main)',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    borderRadius: '10px',
    transition: 'var(--transition-smooth)',
  },
  activeTab: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: 'var(--status-danger)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    textAlign: 'center',
    lineHeight: '1.4',
  },
  formFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
  },
  paddedInput: {
    paddingLeft: '38px',
  },
  submitBtn: {
    marginTop: '1rem',
    padding: '0.85rem',
    fontWeight: '600',
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '1.75rem',
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
};
