import React, { useState } from 'react';
import { api } from '../api';
import { Palette, ArrowRight, CheckCircle, AlertTriangle, MessageSquare, Info } from 'lucide-react';

const DESIGN_SERVICES = [
  {
    id: 'vk_pack',
    name: 'Оформление группы VK',
    desc: 'Разработка аватара и обложки (шапки) для вашей группы ВКонтакте в игровом стиле вашего проекта.',
    price: 50,
    time: '1-2 дня',
    badge: 'Популярно'
  },
  {
    id: 'launcher_screen',
    name: 'Загрузочный экран / Splash',
    desc: 'Кастомный загрузочный экран для лаунчера или самой игры (SAMP, MTA, Minecraft).',
    price: 50,
    time: '1 день',
    badge: 'Быстро'
  },
  {
    id: 'post_banner',
    name: 'Информативный баннер',
    desc: 'Шаблон баннера для новостных постов, конкурсов, объявлений о наборе во фракции или администрацию.',
    price: 65,
    time: '1-2 дня',
    badge: ''
  },
  {
    id: 'forum_design',
    name: 'Оформление форума',
    desc: 'Дизайн плашек разделов, баннеров групп пользователей (Адм, Мод, Лидер) и общая стилизация.',
    price: 75,
    time: '2-3 дня',
    badge: 'Скидка'
  },
  {
    id: 'logo_vector',
    name: 'Логотип проекта',
    desc: 'Разработка уникального логотипа в векторе (для сайта, лаунчера, HUD или иконки приложения).',
    price: 80,
    time: '2-4 дня',
    badge: 'Premium'
  },
  {
    id: 'full_brand',
    name: 'Фирменный стиль «Под ключ»',
    desc: 'Полный комплект: логотип, аватар и шапка группы, 3 шаблона баннеров, иконки форума и промо-арт.',
    price: 150,
    time: '3-5 дней',
    badge: 'Выгодно'
  }
];

export default function DesignShop({ user, onOrderSuccess, setCurrentPage }) {
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null); // { ticketId }
  const [error, setError] = useState('');

  const handleOrder = async () => {
    if (!selectedService) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/design/order', {
        service_name: selectedService.name,
        price: selectedService.price,
        details: selectedService.desc
      });

      setOrderResult({ ticketId: Date.now() });
      if (onOrderSuccess) onOrderSuccess();
    } catch (err) {
      setError(err.message || 'Ошибка оформления заказа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Шапка раздела */}
      <div style={styles.header}>
        <Palette size={28} color="var(--accent-blue)" />
        <div>
          <h2 style={styles.title}>Магазин игрового дизайна</h2>
          <p style={styles.subtitle}>
            Закажите качественное графическое оформление для вашего сервера, группы VK или форума от наших дизайнеров.
          </p>
        </div>
      </div>

      {orderResult ? (
        <div className="card" style={styles.successCard}>
          <CheckCircle size={48} color="var(--status-success)" />
          <h3 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Заказ успешно оформлен!</h3>
          <p style={styles.successText}>
            С вашего баланса списано <strong>{selectedService.price} ₽</strong>. Для обсуждения технического задания и передачи готовых материалов мы автоматически создали для вас тикет поддержки.
          </p>
          <div style={styles.successActions}>
            <button 
              onClick={() => {
                setSelectedService(null);
                setOrderResult(null);
              }}
              className="btn btn-secondary"
            >
              Вернуться в магазин
            </button>
            <button 
              onClick={() => {
                setCurrentPage('support');
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <MessageSquare size={16} />
              <span>Перейти к обсуждению в тикетах</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Сетка услуг */}
          <div style={styles.grid}>
            {DESIGN_SERVICES.map((service) => (
              <div 
                key={service.id} 
                className="card" 
                style={{
                  ...styles.serviceCard,
                  borderColor: selectedService?.id === service.id ? 'var(--accent-blue)' : 'var(--border-color)',
                  backgroundColor: selectedService?.id === service.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                }}
                onClick={() => setSelectedService(service)}
              >
                {service.badge && (
                  <span style={{
                    ...styles.badge,
                    backgroundColor: service.badge === 'Premium' ? '#f59e0b' : service.badge === 'Скидка' ? 'var(--status-danger)' : 'var(--accent-blue)'
                  }}>
                    {service.badge}
                  </span>
                )}
                <h3 style={styles.serviceName}>{service.name}</h3>
                <p style={styles.serviceDesc}>{service.desc}</p>
                
                <div style={styles.cardFooter}>
                  <div>
                    <span style={styles.priceLabel}>Стоимость:</span>
                    <strong style={styles.price}>{service.price} ₽</strong>
                  </div>
                  <div>
                    <span style={styles.timeLabel}>Срок:</span>
                    <span style={styles.time}>{service.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Информационная панель заказа */}
          {selectedService && (
            <div className="card animate-fade-in" style={styles.checkoutPanel}>
              <div style={styles.checkoutInfo}>
                <Info size={20} color="var(--accent-blue)" />
                <span>
                  Выбранная услуга: <strong>{selectedService.name}</strong> за <strong>{selectedService.price} ₽</strong>
                </span>
              </div>
              
              {error && <div style={styles.error}>{error}</div>}

              <div style={styles.checkoutActions}>
                <span style={styles.balanceText}>
                  Ваш баланс: <strong>{user.balance.toFixed(2)} ₽</strong>
                </span>
                <button 
                  onClick={handleOrder}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem', fontSize: '0.9rem' }}
                >
                  {loading ? 'Оформление...' : 'Оплатить и обсудить заказ'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    margin: '0.25rem 0 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  serviceCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '1.5rem',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    position: 'relative',
    transition: 'transform 0.2s, border-color 0.2s',
    ':hover': {
      transform: 'translateY(-2px)'
    }
  },
  badge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  serviceName: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '0.75rem',
    marginRight: '60px', // чтобы не наезжал на бэдж
  },
  serviceDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '1rem',
    marginTop: 'auto',
  },
  priceLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'block',
  },
  price: {
    fontSize: '1.1rem',
    color: 'var(--accent-blue)',
    fontWeight: '700',
  },
  timeLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'block',
    textAlign: 'right',
  },
  time: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    fontWeight: '600',
  },
  checkoutPanel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 2rem',
    background: 'linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
    border: '1px solid var(--border-color)',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  checkoutInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
  },
  checkoutActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  balanceText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  error: {
    color: 'var(--status-danger)',
    fontSize: '0.85rem',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.15)',
  },
  successCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 2rem',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto',
  },
  successText: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    margin: '1rem 0 2rem 0',
  },
  successActions: {
    display: 'flex',
    gap: '1rem',
  }
};
