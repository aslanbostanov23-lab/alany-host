import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  ArrowLeft, 
  User, 
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Image,
  X
} from 'lucide-react';

export default function Support({ user }) {
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  
  // Модалка создания тикета
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [chatAttachment, setChatAttachment] = useState(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Периодическое обновление сообщений, если открыт конкретный тикет
  useEffect(() => {
    if (!activeTicketId) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);

    return () => clearInterval(interval);
  }, [activeTicketId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchTickets = async () => {
    try {
      const data = await api.get('/tickets');
      setTickets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    if (!activeTicketId) return;
    try {
      const data = await api.get(`/tickets/${activeTicketId}/messages`);
      setTicketDetails(data.ticket);
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/tickets', {
        subject,
        message: initialMessage,
        attachment
      });

      setSubject('');
      setInitialMessage('');
      setAttachment(null);
      setShowCreateModal(false);
      
      // Открываем созданный тикет
      setActiveTicketId(res.ticketId);
      fetchTickets();
    } catch (err) {
      setError(err.message || 'Ошибка создания тикета');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() && !chatAttachment) return;

    const textToSend = newMsg;
    const attachmentToSend = chatAttachment;
    setNewMsg('');
    setChatAttachment(null);

    // Оптимистичный коммит
    const localMsg = {
      id: Date.now(),
      message: textToSend,
      attachment: attachmentToSend,
      sender_id: user.id,
      sender_name: user.username,
      sender_role: user.role,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, localMsg]);

    try {
      await api.post(`/tickets/${activeTicketId}/messages`, { 
        message: textToSend,
        attachment: attachmentToSend
      });
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      {activeTicketId ? (
        // Режим Чат-комнаты тикета
        <div style={styles.chatRoom}>
          {/* Шапка чата */}
          <div style={styles.chatHeader}>
            <button onClick={() => { setActiveTicketId(null); setTicketDetails(null); fetchTickets(); }} style={styles.backBtn} className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Назад</span>
            </button>
            <div style={styles.chatMeta}>
              <h4 style={styles.chatSubject}>{ticketDetails?.subject}</h4>
              <span style={styles.chatId}>Обращение #{activeTicketId}</span>
            </div>
            <div style={styles.chatStatus}>
              {ticketDetails?.status === 'resolved' ? (
                <span className="badge badge-success">Решено</span>
              ) : (
                <span className="badge badge-warning">В обработке</span>
              )}
            </div>
          </div>

          {/* Окно сообщений */}
          <div style={styles.messagesWindow}>
            <div style={styles.welcomeSupportNote}>
              <HelpCircle size={28} color="var(--accent-primary)" style={{ marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '380px' }}>
                Диалог со специалистом службы поддержки Alany Host. Пожалуйста, опишите проблему детально.
              </span>
            </div>

            {messages.map((msg) => {
              const isAdmin = msg.sender_role === 'admin';
              return (
                <div 
                  key={msg.id} 
                  style={{
                    ...styles.messageRow,
                    justifyContent: isAdmin ? 'flex-start' : 'flex-end',
                    alignItems: 'flex-end',
                    marginBottom: '0.75rem'
                  }}
                >
                  {/* Аватар техподдержки слева */}
                  {isAdmin && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid var(--accent-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '0.75rem',
                      marginBottom: '0.25rem',
                      flexShrink: 0
                    }}>
                      <ShieldCheck size={16} color="var(--accent-blue)" />
                    </div>
                  )}

                  <div style={{
                    ...styles.msgBubble,
                    ...(isAdmin ? styles.msgBubbleAdmin : styles.msgBubbleUser)
                  }}>
                    <div style={styles.msgHeader}>
                      <span style={{
                        ...styles.msgSender,
                        color: isAdmin ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.9)'
                      }}>
                        {isAdmin ? '🛡️ Техподдержка' : msg.sender_name}
                      </span>
                      <span style={{
                        ...styles.msgTime,
                        color: isAdmin ? 'var(--text-muted)' : 'rgba(255, 255, 255, 0.6)'
                      }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.message && <p style={{
                      ...styles.msgText,
                      color: isAdmin ? 'var(--text-primary)' : '#ffffff'
                    }}>{msg.message}</p>}
                    {msg.attachment && (
                      <div 
                        style={{ 
                          marginTop: '0.5rem', 
                          borderRadius: '8px', 
                          overflow: 'hidden', 
                          border: isAdmin ? '1px solid var(--border-color)' : '1px solid rgba(255, 255, 255, 0.2)', 
                          maxWidth: '300px', 
                          cursor: 'pointer' 
                        }} 
                        onClick={() => window.open(msg.attachment, '_blank')}
                      >
                        <img src={msg.attachment} style={{ width: '100%', display: 'block', maxHeight: '200px', objectFit: 'cover' }} alt="Attachment" />
                      </div>
                    )}
                  </div>

                  {/* Аватар пользователя справа */}
                  {!isAdmin && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '0.75rem',
                      marginBottom: '0.25rem',
                      flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      {user && user.avatar ? (
                        <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="User avatar" />
                      ) : (
                        <User size={16} color="var(--text-secondary)" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Превью прикрепленного изображения в чате */}
          {chatAttachment && (
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={chatAttachment} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Attachment Preview" />
                <button 
                  type="button" 
                  onClick={() => setChatAttachment(null)}
                  style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Изображение готово к отправке</span>
            </div>
          )}

          {/* Ввод сообщения */}
          <form onSubmit={handleSendMessage} style={styles.msgInputRow}>
            <input 
              type="file" 
              id="chatAttachmentInput" 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setChatAttachment(reader.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <button 
              type="button" 
              onClick={() => document.getElementById('chatAttachmentInput').click()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.75rem' }}
              disabled={ticketDetails?.status === 'resolved'}
              title="Прикрепить скриншот"
            >
              <Image size={18} />
            </button>
            <input 
              type="text" 
              placeholder={ticketDetails?.status === 'resolved' ? "Тикет закрыт. Создайте новое обращение для продолжения." : "Напишите ваше сообщение здесь..."} 
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              style={styles.chatInput}
              disabled={ticketDetails?.status === 'resolved'}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={styles.sendBtn}
              disabled={ticketDetails?.status === 'resolved'}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        // Режим списка тикетов
        <div>
          <div style={styles.listHeader}>
            <h3>Обращения в техподдержку</h3>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-cyan">
              <Plus size={16} />
              <span>Создать тикет</span>
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="card" style={styles.emptyCard}>
              <MessageSquare size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h4>У вас нет открытых обращений</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', textAlign: 'center' }}>
                Если у вас возник вопрос по работе серверов, оплате или настройкам, создайте тикет!
              </p>
            </div>
          ) : (
            <div style={styles.ticketsList}>
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="card" 
                  style={styles.ticketCard}
                  onClick={() => setActiveTicketId(ticket.id)}
                >
                  <div style={styles.ticketMain}>
                    <div style={styles.ticketIcon}>
                      <MessageSquare size={20} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <h4 style={styles.ticketSubjectTitle}>{ticket.subject}</h4>
                      <span style={styles.ticketDate}>
                        Создан: {new Date(ticket.created_at).toLocaleDateString()} в {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div>
                    {ticket.status === 'resolved' ? (
                      <span className="badge badge-success">Решено</span>
                    ) : (
                      <span className="badge badge-warning">В обработке</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Модалка создания тикета */}
          <Modal 
            isOpen={showCreateModal} 
            onClose={() => setShowCreateModal(false)}
            title="Создание нового обращения"
          >
            <form onSubmit={handleCreateTicket} style={styles.modalForm}>
              {error && <div style={styles.modalError}>{error}</div>}

              <div className="form-group">
                <label className="form-label">Тема обращения</label>
                <input 
                  type="text" 
                  placeholder="Например: Не запускается GTA сервер" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Описание проблемы / Сообщение</label>
                <textarea 
                  placeholder="Опишите проблему как можно подробнее..." 
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  className="form-input"
                  rows={6}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label className="form-label">Прикрепить скриншот / фото</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    id="ticketAttachmentInput"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAttachment(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => document.getElementById('ticketAttachmentInput').click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}
                  >
                    <Image size={16} />
                    <span>Выберите файл</span>
                  </button>
                  {attachment && (
                    <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={attachment} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => setAttachment(null)}
                        style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Создание...' : 'Отправить обращение'}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
}

const styles = {
  chatRoom: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - var(--navbar-height) - 4rem)',
    maxHeight: '700px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-primary)',
  },
  backBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.85rem',
  },
  chatMeta: {
    textAlign: 'center',
  },
  chatSubject: {
    fontSize: '1rem',
    color: 'var(--text-primary)',
    fontWeight: '600',
  },
  chatId: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  chatStatus: {},
  messagesWindow: {
    flex: 1,
    padding: '1.5rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: 'var(--bg-primary)',
  },
  welcomeSupportNote: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: 'transparent',
    border: '1px dashed var(--border-color)',
    borderRadius: '12px',
    alignSelf: 'center',
    marginBottom: '1rem',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  msgBubble: {
    maxWidth: '75%',
    padding: '0.85rem 1.1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
  },
  msgBubbleAdmin: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px 16px 16px 4px',
  },
  msgBubbleUser: {
    background: 'linear-gradient(135deg, var(--accent-blue) 0%, #1d4ed8 100%)',
    color: '#ffffff',
    borderRadius: '16px 16px 4px 16px',
  },
  msgHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    fontSize: '0.75rem',
  },
  msgSender: {
    fontWeight: 'bold',
  },
  msgTime: {},
  msgText: {
    fontSize: '0.9rem',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
  },
  msgInputRow: {
    padding: '1rem',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: 'var(--bg-primary)',
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    color: '#fff',
    padding: '0.75rem 1rem',
    fontFamily: 'var(--font-main)',
    fontSize: '0.9rem',
    outline: 'none',
  },
  sendBtn: {
    padding: '0 1.25rem',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem 2rem',
  },
  ticketsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  ticketCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  ticketMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  ticketIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketSubjectTitle: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    fontWeight: '600',
  },
  ticketDate: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  modalError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: 'var(--status-danger)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1rem',
  },
};
