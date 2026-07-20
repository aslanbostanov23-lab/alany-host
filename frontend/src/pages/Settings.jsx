import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import {
  User, Mail, Key, Shield, Send, Crown, Copy, Check,
  Server, CreditCard, MessageSquare, Clock,
  MonitorSmartphone, AlertCircle, Activity, Users, Camera, Upload
} from 'lucide-react';

const TABS = [
  { id: 'info',      label: 'Информация' },
  { id: 'security',  label: 'Безопасность' },
  { id: 'partner',   label: 'Партнёры' },
  { id: 'sessions',  label: 'Сеансы' },
];

export default function Settings({ user, setCurrentPage, t }) {
  const [tab, setTab] = useState('info');
  const [serverCount, setServerCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [copiedRef, setCopiedRef] = useState(false);

  // Ссылка на инпут файла
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState(null);

  // Форма имени
  const [username, setUsername] = useState(user?.username || '');
  const [nameStatus, setNameStatus] = useState(null);
  const [nameSaving, setNameSaving] = useState(false);

  // Форма пароля
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwStatus, setPwStatus] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);

  // Форма Telegram
  const [tg, setTg] = useState(user?.telegram || '');
  const [tgStatus, setTgStatus] = useState(null);

  useEffect(() => {
    api.get('/servers').then(s => setServerCount(Array.isArray(s) ? s.length : 0)).catch(() => {});
    api.get('/tickets').then(t => setTicketCount(Array.isArray(t) ? t.length : 0)).catch(() => {});
  }, []);

  const daysReg = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at)) / 86400000)
    : 0;

  const refLink = `${window.location.origin}/?ref=${user?.id || ''}`;

  const copyRef = () => {
    navigator.clipboard.writeText(refLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Загрузка и сохранение аватарки
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarStatus({ ok: false, text: 'Файл слишком большой (макс. 5МБ)' });
      return;
    }

    setAvatarUploading(true);
    setAvatarStatus(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      try {
        await api.put('/profile', { avatar: dataUrl });
        setAvatarStatus({ ok: true, text: 'Аватарка успешно обновлена!' });
        window.location.reload(); // Перезагружаем для синхронизации аватара по всему сайту
      } catch (err) {
        setAvatarStatus({ ok: false, text: err?.message || 'Ошибка сохранения аватарки' });
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveName = async (e) => {
    e.preventDefault();
    setNameSaving(true);
    setNameStatus(null);
    try {
      await api.put('/profile', { username });
      setNameStatus({ ok: true, text: 'Имя обновлено успешно.' });
    } catch (err) {
      setNameStatus({ ok: false, text: err?.message || 'Ошибка сохранения' });
    } finally {
      setNameSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwStatus(null);
    if (pwNew !== pwConfirm) {
      setPwStatus({ ok: false, text: 'Пароли не совпадают' });
      return;
    }
    if (pwNew.length < 6) {
      setPwStatus({ ok: false, text: 'Пароль должен быть не короче 6 символов' });
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/profile/password', {
        current_password: pwOld,
        new_password: pwNew,
      });
      setPwStatus({ ok: true, text: 'Пароль успешно изменён.' });
      setPwOld(''); setPwNew(''); setPwConfirm('');
    } catch (err) {
      setPwStatus({ ok: false, text: err?.message || 'Неверный текущий пароль' });
    } finally {
      setPwSaving(false);
    }
  };

  const saveTelegram = async (e) => {
    e.preventDefault();
    setTgStatus(null);
    try {
      await api.put('/profile', { telegram: tg });
      setTgStatus({ ok: true, text: 'Telegram привязан.' });
    } catch (err) {
      setTgStatus({ ok: false, text: err?.message || 'Ошибка' });
    }
  };

  return (
    <div className="page-container">
      {/* Скрытый инпут для выбора изображения аватарки */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* ─── ШАПКА ─── */}
      <div style={st.heroCard} className="card">
        {/* Аватар + имя */}
        <div style={st.heroLeft}>
          <div 
            style={st.avatar} 
            onClick={() => fileInputRef.current?.click()}
            title="Нажмите, чтобы изменить аватарку"
          >
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User size={32} color="var(--text-secondary)" />
            }
            <div style={st.avatarOverlay}>
              <Camera size={18} color="#fff" />
            </div>
            <span style={st.onlineDot} />
          </div>

          <div>
            <h2 style={st.heroName}>{user?.username || '—'}</h2>
            <div style={st.heroEmail}>{user?.email || '—'}</div>
            <div style={st.chips}>
              <span style={{ ...st.chip, ...(user?.role === 'admin' ? st.chipGold : st.chipBlue) }}>
                <Crown size={11} />
                {user?.role === 'admin' ? 'ADMIN' : 'VIP'}
              </span>
              <span style={st.chip}>
                <Shield size={11} />
                2FA выкл.
              </span>
              <span style={st.chip}>
                <Clock size={11} />
                {daysReg} дней
              </span>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div style={st.heroStats}>
          <div style={st.heroStat}>
            <span style={st.heroStatLabel}>Баланс</span>
            <span style={st.heroStatValue}>{user?.balance?.toFixed(2) ?? '0.00'} ₽</span>
          </div>
          <div style={st.heroStat}>
            <span style={st.heroStatLabel}>Бонусы</span>
            <span style={st.heroStatValue}>0</span>
          </div>
          <div style={st.heroStat}>
            <span style={st.heroStatLabel}>Серверы</span>
            <span style={st.heroStatValue}>{serverCount}</span>
          </div>
          <div style={st.heroStat}>
            <span style={st.heroStatLabel}>Тикеты</span>
            <span style={st.heroStatValue}>{ticketCount}</span>
          </div>
        </div>
      </div>

      {/* ─── ВКЛАДКИ ─── */}
      <div style={st.tabs}>
        {TABS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{ ...st.tabBtn, ...(tab === item.id ? st.tabBtnActive : {}) }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ══════════ ИНФОРМАЦИЯ ══════════ */}
      {tab === 'info' && (
        <div style={st.grid2}>

          {/* Карточка изменения аватарки */}
          <div className="card" style={st.card}>
            <div style={st.cardHeader}>
              <div style={st.iconBox}><Upload size={18} /></div>
              <div>
                <h3 style={st.cardTitle}>Аватар профиля</h3>
                <p style={st.cardHint}>Загрузите ваше фото или аватар (до 5 МБ)</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={st.avatarSmallPreview}>
                {user?.avatar ? (
                  <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                ) : (
                  <User size={24} color="var(--text-secondary)" />
                )}
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? 'Загрузка...' : 'Загрузить файл'}
              </button>
            </div>

            {avatarStatus && (
              <div style={{ ...st.statusMsg, marginTop: '1rem', color: avatarStatus.ok ? 'var(--status-success)' : 'var(--status-danger)' }}>
                {avatarStatus.text}
              </div>
            )}
          </div>

          {/* Имя */}
          <div className="card" style={st.card}>
            <div style={st.cardHeader}>
              <div style={st.iconBox}><User size={18} /></div>
              <div>
                <h3 style={st.cardTitle}>Имя пользователя</h3>
                <p style={st.cardHint}>Отображается в шапке и профиле</p>
              </div>
            </div>
            <form onSubmit={saveName}>
              <div className="form-group">
                <label className="form-label">Никнейм</label>
                <input
                  className="form-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              {nameStatus && (
                <div style={{ ...st.statusMsg, color: nameStatus.ok ? 'var(--status-success)' : 'var(--status-danger)' }}>
                  {nameStatus.text}
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={st.submitBtn} disabled={nameSaving}>
                {nameSaving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </form>
          </div>

          {/* Telegram */}
          <div className="card" style={st.card}>
            <div style={st.cardHeader}>
              <div style={st.iconBox}><Send size={18} /></div>
              <div>
                <h3 style={st.cardTitle}>Telegram</h3>
                <p style={st.cardHint}>{user?.telegram ? `Привязан: @${user.telegram}` : 'Не привязан'}</p>
              </div>
            </div>
            <form onSubmit={saveTelegram}>
              <div className="form-group">
                <label className="form-label">Username (без @)</label>
                <input
                  className="form-input"
                  value={tg}
                  onChange={e => setTg(e.target.value)}
                  placeholder="username"
                />
              </div>
              {tgStatus && (
                <div style={{ ...st.statusMsg, color: tgStatus.ok ? 'var(--status-success)' : 'var(--status-danger)' }}>
                  {tgStatus.text}
                </div>
              )}
              <button type="submit" className="btn btn-secondary" style={st.submitBtn}>
                {user?.telegram ? 'Обновить' : 'Привязать'}
              </button>
            </form>
          </div>

          {/* VIP */}
          <div className="card" style={{ ...st.card, gridColumn: '1 / -1' }}>
            <div style={st.cardHeader}>
              <div style={{ ...st.iconBox, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                <Crown size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={st.cardTitle}>VIP статус</h3>
                <p style={st.cardHint}>Скидка на услуги, бонус к пополнению, приоритетная поддержка — 300 ₽ / 30 дней</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('billing')} style={{ flexShrink: 0 }}>
                Купить VIP
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ══════════ БЕЗОПАСНОСТЬ ══════════ */}
      {tab === 'security' && (
        <div style={st.grid2}>

          {/* Смена пароля */}
          <div className="card" style={st.card}>
            <div style={st.cardHeader}>
              <div style={st.iconBox}><Key size={18} /></div>
              <div>
                <h3 style={st.cardTitle}>Сменить пароль</h3>
                <p style={st.cardHint}>Минимум 6 символов</p>
              </div>
            </div>
            <form onSubmit={savePassword}>
              <div className="form-group">
                <label className="form-label">Текущий пароль</label>
                <input className="form-input" type="password" value={pwOld}
                  onChange={e => setPwOld(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Новый пароль</label>
                <input className="form-input" type="password" value={pwNew}
                  onChange={e => setPwNew(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Подтвердить пароль</label>
                <input className="form-input" type="password" value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)} required />
              </div>
              {pwStatus && (
                <div style={{ ...st.statusMsg, color: pwStatus.ok ? 'var(--status-success)' : 'var(--status-danger)' }}>
                  {pwStatus.text}
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={st.submitBtn} disabled={pwSaving}>
                {pwSaving ? 'Меняем...' : 'Сменить пароль'}
              </button>
            </form>
          </div>

          {/* 2FA инфо */}
          <div className="card" style={st.card}>
            <div style={st.cardHeader}>
              <div style={st.iconBox}><Shield size={18} /></div>
              <div>
                <h3 style={st.cardTitle}>Двухфакторная аутентификация</h3>
                <p style={st.cardHint}>Защита аккаунта при компрометации пароля</p>
              </div>
            </div>
            <div style={st.infoBox}>
              <AlertCircle size={16} color="var(--status-warning)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                2FA по Email будет доступна в ближайшем обновлении панели.
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ══════════ ПАРТНЁРЫ ══════════ */}
      {tab === 'partner' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={st.card}>
            <div style={st.cardHeader}>
              <div style={st.iconBox}><Users size={18} /></div>
              <div>
                <h3 style={st.cardTitle}>Партнёрская программа</h3>
                <p style={st.cardHint}>Приглашайте друзей и получайте вознаграждение</p>
              </div>
            </div>
            <div style={st.refBox}>
              <span style={st.refLabel}>Ваша реферальная ссылка</span>
              <div style={st.refRow}>
                <span style={st.refUrl}>{refLink}</span>
                <button onClick={copyRef} style={st.copyBtn}>
                  {copiedRef
                    ? <Check size={15} color="var(--status-success)" />
                    : <Copy size={15} color="var(--text-secondary)" />
                  }
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={st.card}>
            <div style={st.cardHeader}>
              <div style={st.iconBox}><Activity size={18} /></div>
              <div>
                <h3 style={st.cardTitle}>Ваш результат</h3>
                <p style={st.cardHint}>Всего заработано с партнёрской программы</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={st.heroStat}>
                <span style={st.heroStatLabel}>Приглашено</span>
                <span style={st.heroStatValue}>0 чел.</span>
              </div>
              <div style={st.heroStat}>
                <span style={st.heroStatLabel}>Заработано</span>
                <span style={{ ...st.heroStatValue, color: 'var(--status-success)' }}>0.00 ₽</span>
              </div>
            </div>
            <div style={{ ...st.infoBox, marginTop: '1rem' }}>
              <AlertCircle size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Нет приглашённых друзей.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ СЕАНСЫ ══════════ */}
      {tab === 'sessions' && (
        <div className="card" style={st.card}>
          <div style={st.cardHeader}>
            <div style={st.iconBox}><MonitorSmartphone size={18} /></div>
            <div>
              <h3 style={st.cardTitle}>Активные сеансы</h3>
              <p style={st.cardHint}>Устройства, с которых выполнен вход в аккаунт</p>
            </div>
          </div>

          <div style={st.sessionCard}>
            <div style={st.sessionLeft}>
              <MonitorSmartphone size={20} color="var(--accent-blue)" />
              <div>
                <div style={st.sessionTitle}>Текущий сеанс</div>
                <div style={st.sessionMeta}>{navigator.platform} · {window.location.hostname}</div>
              </div>
            </div>
            <span className="badge badge-success">Активен</span>
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── СТИЛИ в нашем дизайне ─── */
const st = {
  heroCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
    padding: '1.5rem',
    marginBottom: '0.5rem',
    flexWrap: 'wrap',
  },
  heroLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  avatar: {
    position: 'relative',
    width: 72, height: 72,
    borderRadius: 18,
    background: 'var(--bg-tertiary)',
    border: '2px solid var(--border-color)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
    cursor: 'pointer',
  },
  avatarOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s ease',
  },
  avatarSmallPreview: {
    width: 48, height: 48, borderRadius: 12,
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  onlineDot: {
    position: 'absolute', right: 5, bottom: 5,
    width: 10, height: 10, borderRadius: '50%',
    background: 'var(--status-success)',
    boxShadow: '0 0 0 2px var(--bg-secondary)',
  },
  heroName: {
    margin: '0 0 0.2rem', fontSize: '1.4rem',
    fontWeight: 800, color: 'var(--text-primary)',
  },
  heroEmail: {
    fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.3rem 0.6rem', borderRadius: 999,
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)',
  },
  chipGold: {
    background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)',
    color: '#f59e0b',
  },
  chipBlue: {
    background: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.25)',
    color: 'var(--accent-blue)',
  },
  heroStats: {
    display: 'grid', gridTemplateColumns: 'repeat(4, minmax(90px,1fr))',
    gap: '0.75rem', flexShrink: 0,
  },
  heroStat: {
    padding: '0.85rem 1rem',
    background: 'var(--bg-tertiary)', borderRadius: 12,
    border: '1px solid var(--border-color)',
  },
  heroStatLabel: {
    display: 'block', fontSize: '0.68rem', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: '0.3rem',
  },
  heroStatValue: {
    display: 'block', fontSize: '1rem', fontWeight: 800,
    color: 'var(--text-primary)',
  },
  tabs: {
    display: 'flex', gap: 0,
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '1.5rem', overflowX: 'auto',
  },
  tabBtn: {
    flexShrink: 0, padding: '0.85rem 1.25rem',
    background: 'none', border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)', fontSize: '0.88rem',
    fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.18s ease', whiteSpace: 'nowrap',
    fontFamily: 'var(--font-main)',
  },
  tabBtnActive: {
    color: 'var(--text-primary)',
    borderBottomColor: 'var(--accent-blue)',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.25rem',
  },
  card: { padding: '1.5rem' },
  cardHeader: {
    display: 'flex', alignItems: 'flex-start',
    gap: '1rem', marginBottom: '1.25rem',
  },
  iconBox: {
    width: 40, height: 40, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
    background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)',
    color: 'var(--accent-blue)',
  },
  cardTitle: {
    margin: '0 0 0.2rem', fontSize: '0.95rem',
    fontWeight: 700, color: 'var(--text-primary)',
  },
  cardHint: {
    margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)',
  },
  statusMsg: {
    fontSize: '0.82rem', marginBottom: '0.75rem',
    padding: '0.5rem 0.75rem', borderRadius: 8,
    background: 'var(--bg-tertiary)',
  },
  submitBtn: {
    marginTop: '0.25rem',
    fontSize: '0.85rem',
    padding: '0.6rem 1.4rem',
  },
  infoBox: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.85rem 1rem', borderRadius: 10,
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
  },
  refBox: { marginTop: '0.5rem' },
  refLabel: {
    display: 'block', fontSize: '0.75rem',
    color: 'var(--text-muted)', marginBottom: '0.5rem',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  refRow: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
    borderRadius: 10, padding: '0.6rem 0.85rem',
  },
  refUrl: {
    flex: 1, fontFamily: 'monospace', fontSize: '0.8rem',
    color: 'var(--accent-blue)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  copyBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: '0.2rem',
    flexShrink: 0,
  },
  sessionCard: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem', borderRadius: 12,
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
  },
  sessionLeft: { display: 'flex', alignItems: 'center', gap: '0.85rem' },
  sessionTitle: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' },
  sessionMeta: { fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' },
};
