import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Sliders, HelpCircle, Gift, Sparkles, Award } from 'lucide-react';

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#ea580c', '#0891b2', '#dc2626', '#4f46e5'];
const PRIZES = [
  'Бонус +10 ₽',
  'Скидка 10% Minecraft',
  'Бонус +50 ₽',
  'Скидка 15% SAMP',
  'Бонус +20 ₽',
  'Сервер 3 дня',
  'Скидка 50% CS2',
  'Бонус +100 ₽'
];

export default function WheelOfFortune({ user, onSpinSuccess }) {
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null); // { prizeDesc, isMoney }
  const [error, setError] = useState('');
  const [lastSpinDate, setLastSpinDate] = useState(null);

  useEffect(() => {
    drawWheel();
    // Считываем время последнего кручения из localStorage для бесплатного таймера
    const stored = localStorage.getItem('last_free_spin_date');
    if (stored) {
      setLastSpinDate(new Date(stored));
    }
  }, []);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const radius = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Рисуем сектора
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 10, angle, angle + Math.PI / 4);
      ctx.closePath();
      ctx.fillStyle = COLORS[i];
      ctx.fill();

      // Границы секторов
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      // Текст приза в секторе
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(angle + Math.PI / 8);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px var(--font-main)';
      ctx.fillText(PRIZES[i], radius - 25, 4);
      ctx.restore();
    }

    // Центральная заглушка
    ctx.beginPath();
    ctx.arc(radius, radius, 16, 0, 2 * Math.PI);
    ctx.fillStyle = 'var(--bg-primary)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'var(--accent-blue)';
    ctx.stroke();
  };

  // Проверка доступности бесплатной прокрутки (раз в 24 часа)
  const isFreeSpinAvailable = () => {
    if (!lastSpinDate) return true;
    const diffHours = (new Date() - lastSpinDate) / (1000 * 60 * 60);
    return diffHours >= 24;
  };

  const getRemainingTimeText = () => {
    if (!lastSpinDate) return '';
    const diffMs = 24 * 60 * 60 * 1000 - (new Date() - lastSpinDate);
    if (diffMs <= 0) return '';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} ч. ${minutes} мин.`;
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    setError('');
    setResult(null);

    const freeAvailable = isFreeSpinAvailable();
    
    if (!freeAvailable && user.balance < 25) {
      setError(`Недостаточно средств. Для платной прокрутки требуется 25 ₽, ваш баланс: ${Number(user?.balance || 0).toFixed(2)} ₽`);
      return;
    }

    try {
      setIsSpinning(true);
      
      // Запрашиваем результат с сервера
      const res = await api.post('/wheel/spin');
      
      const targetRotation = 270 - (2 * 45 + 22.5) + (360 * 5);
      setRotation(targetRotation);

      setTimeout(() => {
        setIsSpinning(false);
        setResult({
          prizeDesc: res.message,
          isMoney: true
        });

        // Если это была бесплатная прокрутка, сохраняем время
        if (freeAvailable) {
          const now = new Date();
          localStorage.setItem('last_free_spin_date', now.toISOString());
          setLastSpinDate(now);
        }

        // Вызываем коллбек обновления данных пользователя (чтобы баланс обновился в Navbar)
        onSpinSuccess();
      }, 5100);

    } catch (err) {
      setError(err.message || 'Ошибка запуска рулетки');
      setIsSpinning(false);
    }
  };

  return (
    <div className="page-container" style={styles.grid}>
      {/* Левая колонка: Барабан */}
      <div className="card" style={styles.wheelCard}>
        <div style={styles.cardHeader}>
          <Sparkles size={22} color="var(--accent-primary)" />
          <h2 style={styles.title}>Барабан бонусов</h2>
        </div>
        <p style={styles.subtitle}>
          Испытайте удачу в колесе фортуны Alany Host! Вы можете выиграть реальные бонусные рубли на баланс или скидки на игровые серверы.
        </p>

        {/* Конструкция рулетки */}
        <div style={styles.wheelArea}>
          <div style={styles.wheelContainer}>
            {/* Стрелка-указатель */}
            <div style={styles.arrow} />
            
            {/* Вращающийся холст */}
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              style={{
                ...styles.canvas,
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
              }}
            />
          </div>
        </div>

        {/* Кнопка и таймеры */}
        <div style={styles.actionsArea}>
          {error && <div style={styles.error}>{error}</div>}

          {result && (
            <div style={styles.resultBox}>
              <div style={styles.resultBadge}>🎉 ПОЗДРАВЛЯЕМ! 🎉</div>
              <div style={styles.resultText}>Вы выиграли: <strong style={{ color: 'var(--accent-blue)' }}>{result.prizeDesc}</strong></div>
              {result.isMoney && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Средства моментально начислены на ваш баланс.</div>}
            </div>
          )}

          {!isFreeSpinAvailable() && (
            <div style={styles.timerBox}>
              До следующей бесплатной прокрутки осталось: <strong style={{ color: 'var(--accent-primary)' }}>{getRemainingTimeText()}</strong>
            </div>
          )}

          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="btn btn-primary"
            style={styles.spinBtn}
          >
            {isSpinning ? 'Колесо вращается...' : isFreeSpinAvailable() ? 'Крутить бесплатно (1 раз/день)' : 'Крутить за 25 ₽'}
          </button>
        </div>
      </div>

      {/* Правая колонка: Призы и правила */}
      <div style={styles.rulesColumn}>
        <div className="card">
          <div style={styles.cardHeader}>
            <Award size={20} color="var(--accent-blue)" />
            <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Возможные выигрыши</h4>
          </div>
          <div style={styles.prizesList}>
            {PRIZES.map((prize, idx) => (
              <div key={idx} style={styles.prizeRow}>
                <div style={{ ...styles.colorPeg, backgroundColor: COLORS[idx] }} />
                <span style={styles.prizeText}>{prize}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={styles.cardHeader}>
            <HelpCircle size={20} color="var(--text-secondary)" />
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Правила участия</h4>
          </div>
          <ul style={styles.rulesList}>
            <li>Каждый пользователь получает <strong>1 бесплатную попытку</strong> в сутки (каждые 24 часа).</li>
            <li>Каждая последующая попытка стоит всего <strong>25 ₽</strong> и списывается непосредственно с баланса вашего личного кабинета.</li>
            <li>Денежные выигрыши моментально начисляются на баланс и отображаются в истории транзакций.</li>
            <li>Скидки и купоны на аренду серверов сохраняются за вашим аккаунтом и применятся при следующем заказе.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '2rem',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  wheelCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
    width: '100%',
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
    lineHeight: '1.5',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  wheelArea: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5rem 0',
    position: 'relative',
  },
  wheelContainer: {
    position: 'relative',
    width: '340px',
    height: '340px',
  },
  canvas: {
    borderRadius: '50%',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 25px rgba(59, 130, 246, 0.15)',
    display: 'block',
  },
  arrow: {
    position: 'absolute',
    top: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '0',
    height: '0',
    borderLeft: '15px solid transparent',
    borderRight: '15px solid transparent',
    borderTop: '25px solid var(--accent-primary)',
    zIndex: 10,
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
  },
  actionsArea: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1rem',
  },
  spinBtn: {
    width: '100%',
    padding: '0.85rem',
    fontWeight: '700',
    fontSize: '0.95rem',
    borderRadius: '14px',
  },
  error: {
    color: 'var(--status-danger)',
    fontSize: '0.85rem',
    textAlign: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    width: '100%',
  },
  resultBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '14px',
    padding: '1rem',
    textAlign: 'center',
    width: '100%',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    animation: 'fadeIn 0.3s ease-out',
  },
  resultBadge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--accent-primary)',
    marginBottom: '0.25rem',
  },
  resultText: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
  },
  timerBox: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    padding: '0.6rem 1rem',
    borderRadius: '10px',
    width: '100%',
    textAlign: 'center',
  },
  rulesColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  prizesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  prizeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
  },
  colorPeg: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    flexShrink: 0,
  },
  prizeText: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    fontWeight: '600',
  },
  rulesList: {
    paddingLeft: '1.2rem',
    margin: '1rem 0 0 0',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    lineHeight: '1.5',
  }
};
