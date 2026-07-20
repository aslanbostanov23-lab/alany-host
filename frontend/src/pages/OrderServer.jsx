import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Gamepad2, 
  Cpu, 
  HardDrive, 
  Users, 
  Layers, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Check,
  Zap
} from 'lucide-react';

const GAMES = [
  { id: 'minecraft', name: 'Minecraft', desc: 'Java & Bedrock Edition', defaultPort: 25565, color: '#10b981', bgGlow: 'rgba(16, 185, 129, 0.1)' },
  { id: 'cs2', name: 'Counter-Strike 2', desc: '128-tick rate servers', defaultPort: 27015, color: '#f59e0b', bgGlow: 'rgba(245, 158, 11, 0.1)' },
  { id: 'gta_samp', name: 'GTA SAMP', desc: 'San Andreas Multiplayer', defaultPort: 7777, color: '#38bdf8', bgGlow: 'rgba(56, 189, 248, 0.1)' },
  { id: 'gta_mta', name: 'GTA MTA', desc: 'Multi Theft Auto', defaultPort: 22003, color: '#a855f7', bgGlow: 'rgba(168, 85, 247, 0.1)' },
  { id: 'scp', name: 'SCP: Secret Lab', desc: 'SCP Secret Laboratory', defaultPort: 7777, color: '#ef4444', bgGlow: 'rgba(239, 68, 68, 0.1)' },
  { id: 'discord_bot', name: 'Discord Bot', desc: 'Node.js, Python, Java', defaultPort: 0, color: '#6366f1', bgGlow: 'rgba(99, 102, 241, 0.1)' }
];

const GAME_PLANS = {
  minecraft: [
    { id: 'mc_start', name: 'MC-Старт', price: 350, ram: 2048, cpu: 2, disk: 15, slots: 20, popular: false },
    { id: 'mc_pro', name: 'MC-Профи', price: 650, ram: 4096, cpu: 3, disk: 30, slots: 50, popular: true },
    { id: 'mc_ultra', name: 'MC-Ультра', price: 1200, ram: 8192, cpu: 4, disk: 60, slots: 100, popular: false }
  ],
  cs2: [
    { id: 'cs_match', name: 'CS-Матч', price: 450, ram: 4096, cpu: 2, disk: 20, slots: 12, popular: false },
    { id: 'cs_public', name: 'CS-Паблик', price: 850, ram: 6144, cpu: 4, disk: 30, slots: 32, popular: true }
  ],
  gta_samp: [
    { id: 'samp_light', name: 'SAMP-Старт', price: 190, ram: 1024, cpu: 1, disk: 10, slots: 100, popular: false },
    { id: 'samp_pro', name: 'SAMP-Профи', price: 390, ram: 2048, cpu: 2, disk: 20, slots: 500, popular: true }
  ],
  gta_mta: [
    { id: 'mta_start', name: 'MTA-Старт', price: 250, ram: 1536, cpu: 1, disk: 15, slots: 100, popular: false },
    { id: 'mta_pro', name: 'MTA-Профи', price: 490, ram: 3072, cpu: 2, disk: 25, slots: 300, popular: true }
  ],
  scp: [
    { id: 'scp_start', name: 'SCP-Объект', price: 490, ram: 4096, cpu: 2, disk: 20, slots: 20, popular: false },
    { id: 'scp_pro', name: 'SCP-Комплекс', price: 890, ram: 8192, cpu: 4, disk: 40, slots: 40, popular: true }
  ],
  discord_bot: [
    { id: 'bot_basic', name: 'Bot-Старт', price: 90, ram: 512, cpu: 1, disk: 5, slots: 1, popular: false },
    { id: 'bot_pro', name: 'Bot-Профи', price: 220, ram: 2048, cpu: 2, disk: 15, slots: 1, popular: true }
  ]
};

export default function OrderServer({ user, onOrderSuccess, setCurrentPage }) {
  const [selectedGame, setSelectedGame] = useState('minecraft');
  const [selectedPlanId, setSelectedPlanId] = useState('mc_pro');
  const [serverName, setServerName] = useState('My Minecraft Server');
  const [duration, setDuration] = useState(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Обновление при смене игры
  const handleGameSelect = (gameId) => {
    setSelectedGame(gameId);
    const plans = GAME_PLANS[gameId] || [];
    const defaultPlan = plans.find(p => p.popular) || plans[0];
    if (defaultPlan) setSelectedPlanId(defaultPlan.id);

    const gameName = GAMES.find(g => g.id === gameId)?.name || 'Game';
    setServerName(`My ${gameName} Server`);
  };

  const currentPlans = GAME_PLANS[selectedGame] || [];
  const currentPlan = currentPlans.find(p => p.id === selectedPlanId) || currentPlans[0] || {};

  // Расчет стоимости с учетом периода аренды и скидок
  const calculateTotal = () => {
    const basePrice = currentPlan.price || 0;
    let multiplier = 1;
    if (duration === 90) multiplier = 3 * 0.95; // 5% скидка
    if (duration === 180) multiplier = 6 * 0.90; // 10% скидка
    return (basePrice * multiplier).toFixed(2);
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!serverName.trim()) {
      setError('Укажите название вашего сервера');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/servers/buy', {
        game_type: selectedGame,
        name: serverName,
        ram_mb: currentPlan.ram,
        cpu_cores: currentPlan.cpu,
        disk_gb: currentPlan.disk,
        slots: currentPlan.slots,
        duration_days: duration
      });

      setSuccess(true);
      setTimeout(() => {
        if (onOrderSuccess) onOrderSuccess();
        if (setCurrentPage) setCurrentPage('dashboard');
      }, 1200);
    } catch (err) {
      setError(err.error || 'Ошибка при заказе сервера');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ textCenter: 'center', padding: '3rem', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <CheckCircle2 size={64} color="var(--status-success)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.6rem', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Сервер успешно создан!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Сервер <strong>{serverName}</strong> развернут и доступен в вашей панели управления.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={st.headerBar}>
        <h1 style={st.pageTitle}>Заказать игровой сервер</h1>
        <p style={st.pageSubtitle}>Выберите интересующую игру и готовый сбалансированный тариф.</p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--status-danger)' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleOrder}>
        <div style={st.orderGrid}>
          
          {/* Секция 1: Выбор игры и готового тарифа */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Выбор игры */}
            <div className="card">
              <h3 style={st.cardHeading}>1. Выберите игру / сервис</h3>
              <div style={st.gamesGrid}>
                {GAMES.map(g => {
                  const isSelected = selectedGame === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => handleGameSelect(g.id)}
                      style={{
                        ...st.gameCard,
                        borderColor: isSelected ? g.color : 'var(--border-color)',
                        background: isSelected ? g.bgGlow : 'var(--bg-secondary)',
                        boxShadow: isSelected ? `0 0 20px ${g.bgGlow}` : 'none'
                      }}
                    >
                      <div style={{ ...st.gameIconBox, background: isSelected ? g.bgGlow : 'var(--bg-tertiary)' }}>
                        <Gamepad2 size={20} color={isSelected ? g.color : 'var(--text-secondary)'} />
                      </div>
                      <div>
                        <div style={{ ...st.gameName, color: isSelected ? g.color : 'var(--text-primary)' }}>{g.name}</div>
                        <div style={st.gameDesc}>{g.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Выбор фиксированного тарифа */}
            <div className="card">
              <h3 style={st.cardHeading}>2. Выберите тарифный план</h3>
              <div style={st.plansGrid}>
                {currentPlans.map(plan => {
                  const isSelected = selectedPlanId === plan.id;
                  const activeGameColor = GAMES.find(g => g.id === selectedGame)?.color || '#38bdf8';
                  const activeGameGlow = GAMES.find(g => g.id === selectedGame)?.bgGlow || 'rgba(56,189,248,0.1)';

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      style={{
                        ...st.planCard,
                        borderColor: isSelected ? activeGameColor : 'var(--border-color)',
                        background: isSelected ? activeGameGlow : 'var(--bg-secondary)',
                        boxShadow: isSelected ? `0 0 20px ${activeGameGlow}` : 'none'
                      }}
                    >
                      {plan.popular && <span style={{ ...st.popBadge, background: activeGameColor, color: '#fff' }}>Хит продаж</span>}
                      <h4 style={{ ...st.planName, color: isSelected ? activeGameColor : 'var(--text-primary)' }}>{plan.name}</h4>
                      <div style={st.planPrice}>
                        {plan.price} <span style={st.rub}>₽/мес</span>
                      </div>

                      <div style={st.planSpecs}>
                        <div style={st.specItem}><Cpu size={13} /> {plan.cpu} {plan.cpu === 1 ? 'ядро' : 'ядра'} CPU</div>
                        <div style={st.specItem}><Layers size={13} /> {plan.ram >= 1024 ? `${plan.ram / 1024} GB` : `${plan.ram} MB`} RAM</div>
                        <div style={st.specItem}><HardDrive size={13} /> {plan.disk} GB NVMe SSD</div>
                        <div style={st.specItem}><Users size={13} /> {plan.slots} игровых слотов</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Название сервера */}
            <div className="card">
              <h3 style={st.cardHeading}>3. Назовите ваш сервер</h3>
              <div className="form-group" style={{ margin: 0 }}>
                <input
                  className="form-input"
                  placeholder="Введите имя сервера..."
                  value={serverName}
                  onChange={e => setServerName(e.target.value)}
                  required
                />
              </div>
            </div>

          </div>

          {/* Правая колонка: Итоговый расчет */}
          <div className="card" style={st.summaryCard}>
            <h3 style={st.cardHeading}>Итоговый расчет</h3>

            <div style={st.summaryBox}>
              <div style={st.summaryRow}>
                <span>Игра:</span>
                <strong>{GAMES.find(g => g.id === selectedGame)?.name}</strong>
              </div>
              <div style={st.summaryRow}>
                <span>Тариф:</span>
                <strong>{currentPlan.name}</strong>
              </div>
              <div style={st.summaryRow}>
                <span>Процессор:</span>
                <strong>{currentPlan.cpu} ядра</strong>
              </div>
              <div style={st.summaryRow}>
                <span>Память (RAM):</span>
                <strong>{currentPlan.ram >= 1024 ? `${currentPlan.ram / 1024} GB` : `${currentPlan.ram} MB`}</strong>
              </div>
              <div style={st.summaryRow}>
                <span>Накопитель:</span>
                <strong>{currentPlan.disk} GB NVMe</strong>
              </div>
              <div style={st.summaryRow}>
                <span>Слоты:</span>
                <strong>{currentPlan.slots} игроков</strong>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={st.periodLabel}>Срок аренды</label>
              <div style={st.periodBtns}>
                <button
                  type="button"
                  onClick={() => setDuration(30)}
                  style={{ ...st.periodBtn, ...(duration === 30 ? st.periodBtnActive : {}) }}
                >
                  30 дней
                </button>
                <button
                  type="button"
                  onClick={() => setDuration(90)}
                  style={{ ...st.periodBtn, ...(duration === 90 ? st.periodBtnActive : {}) }}
                >
                  90 дней (-5%)
                </button>
                <button
                  type="button"
                  onClick={() => setDuration(180)}
                  style={{ ...st.periodBtn, ...(duration === 180 ? st.periodBtnActive : {}) }}
                >
                  180 дней (-10%)
                </button>
              </div>
            </div>

            <div style={st.priceBlock}>
              <span style={st.priceLabel}>Общая стоимость:</span>
              <div style={st.priceVal}>{calculateTotal()} ₽</div>
            </div>

            <button type="submit" className="btn btn-primary" style={st.orderSubmitBtn} disabled={loading}>
              {loading ? 'Создаем сервер...' : 'Оплатить и создать'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}

const st = {
  headerBar: {
    marginBottom: '1.5rem',
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
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
  },
  gameCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '14px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  gameIconBox: {
    width: 40, height: 40, borderRadius: 10,
    background: 'var(--bg-tertiary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  gameName: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  gameDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.1rem',
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  planCard: {
    position: 'relative',
    padding: '1.25rem',
    borderRadius: '16px',
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
  planName: {
    margin: '0 0 0.3rem',
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  planPrice: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '1rem',
  },
  rub: { fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 },
  planSpecs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  specItem: {
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
    borderRadius: '12px',
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
  periodLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '0.4rem',
  },
  periodBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  periodBtn: {
    padding: '0.55rem 0.75rem',
    borderRadius: '10px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  periodBtnActive: {
    color: 'var(--text-primary)',
    borderColor: 'var(--text-primary)',
    background: 'var(--bg-hover)',
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
