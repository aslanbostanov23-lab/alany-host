import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { 
  Server, 
  Play, 
  Square, 
  RotateCw, 
  ExternalLink,
  Copy,
  Check,
  Plus,
  Gamepad2
} from 'lucide-react';

export default function MyServers({ user, onSelectServer, setCurrentPage }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const serverList = await api.get('/servers');
      setServers(Array.isArray(serverList) ? serverList : []);
    } catch (error) {
      console.error('Ошибка загрузки серверов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyIP = (id, ip, port) => {
    navigator.clipboard.writeText(`${ip}:${port}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePowerAction = async (e, serverId, action) => {
    e.stopPropagation();
    setServers(servers.map(s => {
      if (s.id === serverId) {
        return { 
          ...s, 
          status: action === 'start' || action === 'restart' ? 'starting' : 'stopped' 
        };
      }
      return s;
    }));

    try {
      await api.post(`/servers/${serverId}/power`, { action });
      setTimeout(fetchServers, 2000);
    } catch (error) {
      console.error('Ошибка управления питанием:', error);
      fetchServers();
    }
  };

  const getGameBadge = (type) => {
    switch (type) {
      case 'minecraft': return { label: 'Minecraft', color: 'var(--text-primary)' };
      case 'cs2': return { label: 'Counter-Strike 2', color: 'var(--text-primary)' };
      case 'gta_samp': return { label: 'GTA SAMP', color: 'var(--text-primary)' };
      case 'gta_mta': return { label: 'GTA MTA', color: 'var(--text-primary)' };
      case 'discord_bot': return { label: 'Discord Bot', color: 'var(--text-primary)' };
      default: return { label: 'Сервер', color: 'var(--text-primary)' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running': return <span className="badge badge-success">В работе</span>;
      case 'starting': return <span className="badge badge-warning">Запускается</span>;
      default: return <span className="badge badge-danger">Остановлен</span>;
    }
  };

  return (
    <div className="page-container">
      <div style={st.headerBar}>
        <div>
          <h1 style={st.pageTitle}>Мои игровые серверы</h1>
          <p style={st.pageSubtitle}>Управление ареной, файлами, конфигами и статусом серверов.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCurrentPage('order')}>
          <Plus size={16} />
          <span>Создать сервер</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Загрузка ваших серверов...
        </div>
      ) : servers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Gamepad2 size={56} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>У вас пока нет активных серверов</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Закажите ваш первый игровой сервер Minecraft, CS2 или SAMP прямо сейчас!
          </p>
          <button className="btn btn-primary" onClick={() => setCurrentPage('order')}>
            Заказать сервер
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {servers.map(server => {
            const badge = getGameBadge(server.game_type);
            const isRunning = server.status === 'running';

            return (
              <div key={server.id} className="card" style={st.serverCard} onClick={() => onSelectServer(server.id)}>
                <div style={st.cardHeader}>
                  <span className="badge badge-info">{badge.label}</span>
                  {getStatusBadge(server.status)}
                </div>

                <h3 style={st.serverName}>{server.name}</h3>

                <div style={st.ipBlock} onClick={(e) => e.stopPropagation()}>
                  <code style={st.ipText}>{server.ip_address}:{server.port}</code>
                  <button onClick={() => handleCopyIP(server.id, server.ip_address, server.port)} style={st.copyBtn}>
                    {copiedId === server.id ? <Check size={14} color="var(--status-success)" /> : <Copy size={14} />}
                  </button>
                </div>

                <div style={st.specsGrid}>
                  <div style={st.specRow}><span>Процессор (CPU):</span> <strong>{server.cpu_cores} Cores</strong></div>
                  <div style={st.specRow}><span>Память (RAM):</span> <strong>{server.ram_mb >= 1024 ? `${server.ram_mb / 1024} GB` : `${server.ram_mb} MB`}</strong></div>
                  <div style={st.specRow}><span>Диск (SSD):</span> <strong>{server.disk_gb} GB NVMe</strong></div>
                  <div style={st.specRow}><span>Слоты:</span> <strong>{server.slots} игроков</strong></div>
                </div>

                <div style={st.cardFooter} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {isRunning ? (
                      <button className="btn btn-secondary" onClick={(e) => handlePowerAction(e, server.id, 'stop')} style={{ padding: '0.45rem 0.75rem' }}>
                        <Square size={14} /> Stop
                      </button>
                    ) : (
                      <button className="btn btn-success" onClick={(e) => handlePowerAction(e, server.id, 'start')} style={{ padding: '0.45rem 0.75rem' }}>
                        <Play size={14} /> Start
                      </button>
                    )}
                    <button className="btn btn-secondary" onClick={(e) => handlePowerAction(e, server.id, 'restart')} style={{ padding: '0.45rem 0.6rem' }}>
                      <RotateCw size={14} />
                    </button>
                  </div>

                  <button className="btn btn-secondary" onClick={() => onSelectServer(server.id)} style={{ padding: '0.45rem 0.85rem' }}>
                    <span>Управлять</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            );
          })}
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
    gap: '1rem',
    flexWrap: 'wrap',
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
  serverCard: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  serverName: {
    margin: '0 0 0.75rem',
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  ipBlock: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--bg-tertiary)',
    padding: '0.45rem 0.75rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    marginBottom: '1rem',
  },
  ipText: {
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
  },
  specsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    marginBottom: '1.25rem',
  },
  specRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1rem',
  }
};
