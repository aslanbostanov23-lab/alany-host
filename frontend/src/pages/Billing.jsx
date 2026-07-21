import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  Plus,
  HelpCircle,
  Clock
} from 'lucide-react';

const SbpLogo = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L2 9.5V22.5L16 30L30 22.5V9.5L16 2Z" fill="url(#sbp-grad)" />
    <path d="M16 6L7 11V21L16 26L25 21V11L16 6Z" fill="#09090b" />
    <path d="M16 9L11 12.5V19.5L16 23L21 19.5V12.5L16 9Z" fill="url(#sbp-grad2)" />
    <defs>
      <linearGradient id="sbp-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="0.5" stopColor="#a855f7" />
        <stop offset="1" stopColor="#10b981" />
      </linearGradient>
      <linearGradient id="sbp-grad2" x1="11" y1="9" x2="21" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
    </defs>
  </svg>
);

const MirCardLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '900', fontSize: '0.8rem', fontFamily: 'sans-serif', letterSpacing: '-0.5px' }}>
    <span style={{ color: '#00B4E6' }}>М</span>
    <span style={{ color: '#00B4E6' }}>И</span>
    <span style={{ color: '#00A859' }}>Р</span>
  </div>
);

const TPayLogo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
    <span style={{ backgroundColor: '#22c55e', color: '#000', fontWeight: '900', fontSize: '0.55rem', padding: '1px 3px', borderRadius: '3px', lineHeight: 1 }}>Sber</span>
    <span style={{ backgroundColor: '#ffdd2d', color: '#000', fontWeight: '900', fontSize: '0.55rem', padding: '1px 3px', borderRadius: '3px', lineHeight: 1 }}>T-Pay</span>
  </div>
);

const YooMoneyLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf6', color: '#fff', fontWeight: '900', fontSize: '0.75rem', width: '22px', height: '22px', borderRadius: '6px' }}>
    Ю
  </div>
);

const CryptoUsdtLogo = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path d="M17.922 17.383c-.11.008-.68.047-1.922.047-1.078 0-1.726-.039-1.914-.047-3.625-.164-6.336-.836-6.336-1.64 0-.914 3.484-1.633 7.828-1.633 4.344 0 7.828.719 7.828 1.633 0 .805-2.711 1.477-6.336 1.64zm0-3.648v-2.07h5.18v-2.617H8.898v2.617h5.18v2.07c-4.938.227-8.672 1.305-8.672 2.617 0 1.312 3.734 2.391 8.672 2.617v6.078h3.844v-6.078c4.938-.227 8.672-1.305 8.672-2.617 0-1.312-3.734-2.391-8.672-2.617z" fill="#FFF" />
  </svg>
);

const QUICK_AMOUNTS = [100, 300, 500, 1000, 5000];

const PAYMENT_METHODS = [
  { id: 'sbp', name: 'Система Быстрых Платежей (СБП)', desc: 'Мгновенно по QR-коду / приложению банка', logoComponent: <SbpLogo /> },
  { id: 'card', name: 'Банковские карты (МИР, Visa, MC)', desc: 'Карты любых банков РФ и СНГ', logoComponent: <MirCardLogo /> },
  { id: 'tpay', name: 'T-Pay / SberPay', desc: 'Оплата в один клик без ввода карты', logoComponent: <TPayLogo /> },
  { id: 'yoomoney', name: 'ЮMoney / YooMoney', desc: 'Электронный кошелек', logoComponent: <YooMoneyLogo /> },
  { id: 'crypto', name: 'Криптовалюта (USDT, TON, BTC)', desc: 'Автоматическое зачисление', logoComponent: <CryptoUsdtLogo /> }
];

export default function Billing({ user, onRefillSuccess }) {
  const [amount, setAmount] = useState('300');
  const [selectedMethod, setSelectedMethod] = useState('sbp');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await api.get('/billing/transactions');
      setTransactions(data);
    } catch (err) {
      console.error('Ошибка загрузки транзакций:', err);
    }
  };

  const handleRefillSubmit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Укажите корректную сумму пополнения');
      return;
    }
    setError('');
    setShowCheckoutModal(true);
  };

  const confirmPayment = async () => {
    setLoading(true);
    try {
      const res = await api.post('/billing/create-payment', { amount: parseFloat(amount), method: selectedMethod });
      
      if (res && res.payment_url && !res.is_test) {
        window.location.href = res.payment_url;
        return;
      }

      setCheckoutSuccess(true);
      setTimeout(() => {
        setShowCheckoutModal(false);
        setCheckoutSuccess(false);
        onRefillSuccess();
        fetchTransactions();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Ошибка обработки платежа');
      setShowCheckoutModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={styles.grid}>
      {/* Левая колонка - Пополнение баланса */}
      <div style={styles.leftColumn}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={styles.cardTitle}>Пополнение баланса</h3>

          <form onSubmit={handleRefillSubmit}>
            {/* Сумма */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Сумма платежа (₽)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Укажите сумму"
                className="form-input"
                min="10"
                required
              />
            </div>

            {/* Быстрый выбор */}
            <div style={styles.quickAmountsRow}>
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  style={{
                    ...styles.quickBtn,
                    ...(amount === val.toString() ? styles.quickBtnActive : {})
                  }}
                >
                  +{val} ₽
                </button>
              ))}
            </div>

            {/* Способ оплаты */}
            <div style={{ marginTop: '1.75rem', marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                Выберите способ оплаты
              </label>
              <div style={styles.methodsGrid}>
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedMethod === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      style={{
                        ...styles.methodCard,
                        borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-color)',
                        backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      }}
                    >
                      <div style={styles.methodIcon}>{method.logoComponent || method.logo}</div>
                      <div>
                        <span style={styles.methodName}>{method.name}</span>
                        <span style={styles.methodDesc}>{method.desc}</span>
                      </div>
                      {isSelected && (
                        <div style={styles.checkBadge}>
                          <Check size={12} color="#0b0c0e" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && <div style={styles.errorText}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
              Перейти к оплате
            </button>
          </form>
        </div>
      </div>

      {/* Правая колонка - История транзакций */}
      <div style={styles.rightColumn}>
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <h3 style={styles.cardTitle}>История транзакций</h3>
          
          <div style={styles.tableWrapper}>
            {transactions.length === 0 ? (
              <div style={styles.emptyTransactions}>
                <Clock size={32} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
                <span>История транзакций пуста</span>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Тип</th>
                    <th style={styles.th}>Описание</th>
                    <th style={styles.th}>Дата</th>
                    <th style={styles.th}>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isRefill = tx.type === 'refill';
                    return (
                      <tr key={tx.id} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.txIconWrapper,
                            backgroundColor: isRefill ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isRefill ? 'var(--status-success)' : 'var(--status-danger)'
                          }}>
                            {isRefill ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.txDesc}>{tx.description}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.txDate}>
                            {new Date(tx.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.txAmount,
                            color: isRefill ? 'var(--status-success)' : 'var(--text-primary)'
                          }}>
                            {isRefill ? '+' : ''}{Number(tx.amount || 0).toFixed(2)} ₽
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Интерактивный платежный терминал */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title={`Оплата через ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name || 'Платежный шлюз'}`}
      >
        {checkoutSuccess ? (
          <div style={styles.modalSuccess}>
            <div style={styles.successCircle}>
              <Check size={36} color="var(--status-success)" />
            </div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.3rem', margin: '0.5rem 0' }}>Оплата успешно проведена!</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              На ваш баланс зачислено: <strong style={{ color: 'var(--status-success)' }}>+{parseFloat(amount).toFixed(2)} ₽</strong>
            </p>
          </div>
        ) : (
          <div style={styles.modalBody}>
            {/* РЕНДЕР ИНТЕРФЕЙСА СБП */}
            {selectedMethod === 'sbp' && (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid #38bdf8' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://qr.nspk.ru/AD1000${Date.now()}?type=02&bank=100000000007&sum=${amount}`} 
                    alt="СБП QR Код"
                    style={{ display: 'block', width: '150px', height: '150px' }}
                  />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Отсканируйте QR-код в приложении любого банка РФ или нажмите кнопку ниже
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                  <button onClick={confirmPayment} disabled={loading} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem' }}>
                    {loading ? 'Проверка зачисления...' : `Оплатить ${amount} ₽ через СБП`}
                  </button>
                </div>
              </div>
            )}

            {/* РЕНДЕР ИНТЕРФЕЙСА БАНКОВСКИХ КАРТ */}
            {selectedMethod === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Номер карты</label>
                    <input className="form-input" defaultValue="2202 2026 4819 9012" placeholder="0000 0000 0000 0000" maxLength="19" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Срок действия</label>
                      <input className="form-input" defaultValue="12/28" placeholder="MM/YY" maxLength="5" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVC / CVV</label>
                      <input className="form-input" type="password" defaultValue="882" placeholder="***" maxLength="3" />
                    </div>
                  </div>
                </div>
                <button onClick={confirmPayment} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                  {loading ? 'Списание средств...' : `Списать ${amount} ₽ с карты`}
                </button>
              </div>
            )}

            {/* РЕНДЕР ИНТЕРФЕЙСА T-PAY / SBERPAY */}
            {selectedMethod === 'tpay' && (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Для оплаты с помощью T-Pay или SberPay подтвердите транзакцию в приложении вашего банка:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button onClick={confirmPayment} disabled={loading} className="btn btn-primary" style={{ backgroundColor: '#22c55e', color: '#000', fontWeight: 'bold', padding: '0.75rem' }}>
                    {loading ? 'Подключение к SberPay...' : `Оплатить через SberPay (${amount} ₽)`}
                  </button>
                  <button onClick={confirmPayment} disabled={loading} className="btn btn-primary" style={{ backgroundColor: '#ffdd2d', color: '#000', fontWeight: 'bold', padding: '0.75rem' }}>
                    {loading ? 'Подключение к T-Pay...' : `Оплатить через T-Pay (${amount} ₽)`}
                  </button>
                </div>
              </div>
            )}

            {/* РЕНДЕР ИНТЕРФЕЙСА ЮMONEY И КРИПТОВАЛЮТЫ */}
            {(selectedMethod === 'yoomoney' || selectedMethod === 'crypto') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Счет получателя Alany Host:</div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', wordBreak: 'break-all' }}>
                    {selectedMethod === 'crypto' ? 'T9xQzL2k98aWpLmn0028190XyZ_USDT_TRC20' : '410019283019203 (ЮMoney)'}
                  </strong>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-blue)' }}>
                    К зачислению: <strong>{amount} ₽</strong> {selectedMethod === 'crypto' && `(~ ${(amount / 92).toFixed(2)} USDT)`}
                  </div>
                </div>
                <button onClick={confirmPayment} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                  {loading ? 'Проверка блокчейн транзакции...' : 'Подтвердить проведение платежа'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
    fontWeight: '600',
    marginBottom: '1.25rem',
  },
  quickAmountsRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  quickBtn: {
    flex: 1,
    padding: '0.6rem 0.5rem',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-main)',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  quickBtnActive: {
    backgroundColor: 'var(--bg-tertiary)',
    borderColor: 'var(--accent-primary)',
    color: 'var(--text-primary)',
  },
  methodsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  methodCard: {
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    position: 'relative',
    transition: 'var(--transition-smooth)',
  },
  methodIcon: {
    fontSize: '1.5rem',
  },
  methodName: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  methodDesc: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.1rem',
  },
  checkBadge: {
    position: 'absolute',
    right: '12px',
    top: '12px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'var(--status-danger)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  tableWrapper: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '400px',
  },
  emptyTransactions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 1rem',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thRow: {
    borderBottom: '1px solid var(--border-color)',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 0.5rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
  },
  td: {
    padding: '0.85rem 0.5rem',
    verticalAlign: 'middle',
  },
  txIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    fontWeight: '500',
  },
  txDate: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  txAmount: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  modalText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  paymentSummary: {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  summaryLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  modalSuccess: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2rem 1rem',
    textAlign: 'center',
  },
  successCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem',
  },
};
