import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Globe, 
  Plus, 
  Server, 
  Database, 
  Key, 
  ExternalLink, 
  ShieldCheck, 
  HardDrive, 
  Check, 
  Copy, 
  Cpu, 
  Layers 
} from 'lucide-react';

const WEB_TARIFS = [
  {
    id: 'start',
    name: 'Веб-Старт',
    price: 90,
    disk: '2 ГБ NVMe SSD',
    sites: '5 сайтов',
    databases: '5 баз MySQL',
    php: 'PHP 8.1 / 8.2 / 8.3',
    popular: false
  },
  {
    id: 'pro',
    name: 'Веб-Про',
    price: 180,
    disk: '10 ГБ NVMe SSD',
    sites: '15 сайтов',
    databases: '15 баз MySQL',
    php: 'PHP 7.4 - 8.3',
    popular: true
  },
  {
    id: 'biz',
    name: 'Веб-Бизнес',
    price: 350,
    disk: '30 ГБ NVMe SSD',
    sites: 'Безлимит сайтов',
    databases: 'Безлимит MySQL',
    php: 'Выделенный IP + SSL',
    popular: false
  }
];

export default function Webhost({ user, setCurrentPage, t }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'order'
  const [selectedTarif, setSelectedTarif] = useState('pro');
  const [domainName, setDomainName] = useState('');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [myWebhosts, setMyWebhosts] = useState([]);

  useEffect(() => {
    fetchWebhosts();
  }, []);

  const fetchWebhosts = async () => {
    try {
      const data = await api.get('/webhost/my');
      setMyWebhosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки веб-хостов:', err);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!domainName) return;

    try {
      setLoading(true);
      await api.post('/webhost/order', {
        domain: domainName,
        tarif_id: selectedTarif,
        duration_days: duration
      });

      setDomainName('');
      setActiveTab('list');
      fetchWebhosts();
      alert(`Веб-хостинг для ${domainName} успешно создан в базе данных!`);
    } catch (err) {
      alert(err.message || 'Ошибка создания веб-хоста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Шапка страницы */}
      <div style={st.headerBar}>
        <div>
          <h1 style={st.pageTitle}>Веб-хостинг сайтов</h1>
          <p style={st.pageSubtitle}>Размещение сайтов, скриптов, форумов XenForo, баз данных MySQL и доменов.</p>
        </div>
        <div style={st.tabBtns}>
          <button
            onClick={() => setActiveTab('list')}
            style={{ ...st.tabBtn, ...(activeTab === 'list' ? st.tabBtnActive : {}) }}
          >
            <Globe size={15} />
            <span>Мои веб-хосты ({myWebhosts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('order')}
            style={{ ...st.tabBtn, ...(activeTab === 'order' ? st.tabBtnActive : {}) }}
          >
            <Plus size={15} />
            <span>Заказать веб-хостинг</span>
          </button>
        </div>
      </div>

      {/* ВКЛАДКА 1: МОИ ВЕБ-ХОСТЫ */}
      {activeTab === 'list' && (
        <div>
          {myWebhosts.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Globe size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>У вас пока нет активных веб-хостингов</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Закажите свой первый надежный NVMe SSD веб-хостинг для сайтов и баз данных.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('order')}>
                Заказать веб-хостинг
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {myWebhosts.map(item => (
                <div key={item.id} className="card" style={st.webhostCard}>
                  <div style={st.webhostHead}>
                    <div style={st.webhostIdentity}>
                      <div style={st.webhostIcon}>
                        <Globe size={22} color="var(--text-primary)" />
                      </div>
                      <div>
                        <div style={st.webhostDomain}>{item.domain}</div>
                        <div style={st.webhostMeta}>Тариф: <strong>{item.tarif}</strong> · Оплачен до: {item.expires_at}</div>
                      </div>
                    </div>
                    <span className="badge badge-success">Активен</span>
                  </div>

                  <div style={st.webhostDetails}>
                    {/* FTP доступ */}
                    <div style={st.detailBox}>
                      <div style={st.detailBoxTitle}>
                        <Server size={14} color="var(--text-primary)" />
                        <span>FTP Доступ</span>
                      </div>
                      <div style={st.detailRow}>
                        <span style={st.detailLabel}>Хост:</span>
                        <span style={st.detailVal}>{item.ftp_host}</span>
                        <button onClick={() => copyToClipboard(item.ftp_host, `ftpHost_${item.id}`)} style={st.copyIconBtn}>
                          {copiedKey === `ftpHost_${item.id}` ? <Check size={13} color="var(--status-success)" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <div style={st.detailRow}>
                        <span style={st.detailLabel}>Логин:</span>
                        <span style={st.detailVal}>{item.ftp_user}</span>
                      </div>
                      <div style={st.detailRow}>
                        <span style={st.detailLabel}>Пароль:</span>
                        <span style={st.detailVal}>{item.ftp_pass}</span>
                      </div>
                    </div>

                    {/* MySQL База данных */}
                    <div style={st.detailBox}>
                      <div style={st.detailBoxTitle}>
                        <Database size={14} color="var(--text-primary)" />
                        <span>База данных MySQL</span>
                      </div>
                      <div style={st.detailRow}>
                        <span style={st.detailLabel}>База / Юзер:</span>
                        <span style={st.detailVal}>{item.mysql_db}</span>
                      </div>
                      <div style={st.detailRow}>
                        <span style={st.detailLabel}>Пароль БД:</span>
                        <span style={st.detailVal}>{item.mysql_pass}</span>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <a href="https://phpmyadmin.alany.host" target="_blank" rel="noreferrer" style={st.linkBtn}>
                          <ExternalLink size={12} />
                          <span>Открыть phpMyAdmin</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ВКЛАДКА 2: ЗАКАЗ ВЕБ-ХОСТИНГА */}
      {activeTab === 'order' && (
        <div>
          <form onSubmit={handleOrderSubmit}>
            <div style={st.orderGrid}>
              
              {/* Левая часть - Выбор тарифа и домена */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={st.cardHeading}>1. Выберите тарифный план</h3>
                  <div style={st.tarifsGrid}>
                    {WEB_TARIFS.map(t => {
                      const isSelected = selectedTarif === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTarif(t.id)}
                          style={{
                            ...st.tarifCard,
                            borderColor: isSelected ? 'var(--text-primary)' : 'var(--border-color)',
                            background: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                          }}
                        >
                          {t.popular && <span style={st.popBadge}>Хит продаж</span>}
                          <h4 style={st.tarifName}>{t.name}</h4>
                          <div style={st.tarifPrice}>
                            {t.price} <span style={st.rub}>₽/мес</span>
                          </div>
                          <div style={st.tarifFeatures}>
                            <div style={st.featureItem}><HardDrive size={13} /> {t.disk}</div>
                            <div style={st.featureItem}><Globe size={13} /> {t.sites}</div>
                            <div style={st.featureItem}><Database size={13} /> {t.databases}</div>
                            <div style={st.featureItem}><ShieldCheck size={13} /> {t.php}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={st.cardHeading}>2. Привязка домена</h3>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Ваше доменное имя (без http)</label>
                    <input
                      className="form-input"
                      placeholder="например: mysite.ru или mydomain.com"
                      value={domainName}
                      onChange={e => setDomainName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Правая часть - Расчёт стоимости */}
              <div className="card" style={st.summaryCard}>
                <h3 style={st.cardHeading}>Итоговый расчет</h3>

                <div style={st.summaryBox}>
                  <div style={st.summaryRow}>
                    <span>Тариф:</span>
                    <strong>{WEB_TARIFS.find(t => t.id === selectedTarif)?.name}</strong>
                  </div>
                  <div style={st.summaryRow}>
                    <span>Срок оплаты:</span>
                    <strong>30 дней</strong>
                  </div>
                  <div style={st.summaryRow}>
                    <span>Домен:</span>
                    <strong>{domainName || '—'}</strong>
                  </div>
                </div>

                <div style={st.priceBlock}>
                  <span style={st.priceLabel}>Общая стоимость:</span>
                  <div style={st.priceVal}>
                    {WEB_TARIFS.find(t => t.id === selectedTarif)?.price} ₽
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={st.orderSubmitBtn} disabled={loading}>
                  {loading ? 'Создаем веб-хостинг...' : 'Оплатить и создать'}
                </button>
              </div>

            </div>
          </form>
        </div>
      )}

    </div>
  );
}

const st = {
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  pageTitle: {
    margin: '0 0 0.2rem',
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  pageSubtitle: {
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  tabBtns: {
    display: 'flex',
    gap: '0.25rem',
    background: 'var(--bg-tertiary)',
    padding: '0.25rem',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.45rem 0.85rem',
    borderRadius: '9px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  tabBtnActive: {
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-secondary)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  webhostCard: {
    padding: '1.5rem',
  },
  webhostHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1rem',
    marginBottom: '1rem',
  },
  webhostIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  webhostIcon: {
    width: 42, height: 42, borderRadius: 10,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  webhostDomain: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  webhostMeta: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '0.15rem',
  },
  webhostDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
  },
  detailBox: {
    padding: '1rem',
    borderRadius: 12,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
  },
  detailBoxTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.75rem',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.35rem',
  },
  detailLabel: { color: 'var(--text-muted)' },
  detailVal: { fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 },
  copyIconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', padding: '0.1rem', display: 'flex',
  },
  linkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textDecoration: 'none',
  },
  orderGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '1.5rem',
  },
  cardHeading: {
    margin: '0 0 1.25rem',
    fontSize: '1.05rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  tarifsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  tarifCard: {
    position: 'relative',
    padding: '1.25rem',
    borderRadius: 16,
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  popBadge: {
    position: 'absolute',
    top: -10, right: 12,
    background: 'var(--text-primary)',
    color: 'var(--bg-primary)',
    fontSize: '0.65rem',
    fontWeight: 800,
    padding: '0.15rem 0.55rem',
    borderRadius: 999,
  },
  tarifName: {
    margin: '0 0 0.3rem',
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  tarifPrice: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '1rem',
  },
  rub: { fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 },
  tarifFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  summaryCard: {
    padding: '1.5rem',
    height: 'fit-content',
  },
  summaryBox: {
    padding: '1rem',
    borderRadius: 12,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1.25rem',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.83rem',
    color: 'var(--text-secondary)',
  },
  priceBlock: {
    marginBottom: '1.25rem',
  },
  priceLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '0.2rem',
  },
  priceVal: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  orderSubmitBtn: {
    width: '100%',
    padding: '0.85rem',
    fontSize: '0.95rem',
    fontWeight: 800,
  }
};
