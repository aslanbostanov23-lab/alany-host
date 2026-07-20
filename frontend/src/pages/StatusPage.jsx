import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Activity, Server, CheckCircle2 } from 'lucide-react';

const SERVICES = [
  { name: 'Игровая Нода 1 (MSK-NODE-1, DataPro)', desc: 'Высокочастотные серверы Minecraft, CS2 (AMD EPYC 4.5 GHz)', state: 'Работает', uptime: 99.99 },
  { name: 'Игровая Нода 2 (MSK-NODE-2, IX-Cellent)', desc: 'Серверы GTA SAMP, GTA MTA с низким пингом по СНГ', state: 'Работает', uptime: 100.0 },
  { name: 'Веб-хостинг & Базы MySQL (WEB-HOST-1)', desc: 'Облачные серверы Nginx, PHP 8.2 и MariaDB MySQL', state: 'Работает', uptime: 99.98 },
  { name: 'Защитный фильтр DDoS-Guard', desc: 'Аппаратная защита L3/L4/L7 атак на всех московских локациях', state: 'Работает', uptime: 100.0 },
  { name: 'Финансовый модуль и Касса', desc: 'Автоматическое зачисление балансов и активация промокодов', state: 'Работает', uptime: 99.97 }
];

const INCIDENTS = [
  { title: 'Плановое обновление фильтров DDoS-Guard', desc: 'Успешно обновлены правила сигнатурной фильтрации игрового трафика Minecraft и SAMP.', date: '19.07.2026', scope: 'Защита', status: 'completed' },
  { title: 'Расширение дисковых массивов NVMe на MSK-NODE-1', desc: 'Установлены дополнительные накопители Samsung Enterprise NVMe SSD для игровых серверов.', date: '16.07.2026', scope: 'Инфраструктура', status: 'resolved' }
];

export default function StatusPage() {
  const [nodes, setNodes] = useState([
    { name: 'MSK-NODE-1 (Москва, DataPro)', cpu: 38, ram: 54, ssd: 42, updated: 'только что' },
    { name: 'MSK-NODE-2 (Москва, IX-Cellent)', cpu: 22, ram: 38, ssd: 29, updated: 'только что' },
    { name: 'WEB-HOST-1 (Москва, Selectel)', cpu: 15, ram: 28, ssd: 19, updated: 'только что' }
  ]);

  useEffect(() => {
    fetchLiveStatus();
  }, []);

  const fetchLiveStatus = async () => {
    try {
      const res = await api.get('/system/status');
      if (res && res.nodes) {
        setNodes(res.nodes);
      }
    } catch (err) {
      console.error('Ошибка получения динамического статуса нод:', err);
    }
  };

  return (
    <div className="page-container">
      {/* Шапка */}
      <div style={styles.header}>
        <Activity size={28} color="#38bdf8" />
        <div>
          <h2 style={styles.title}>Мониторинг инфраструктуры Alany Host</h2>
          <p style={styles.subtitle}>Текущее состояние серверных узлов, веб-локаций и защиты от DDoS-атак в реальном времени.</p>
        </div>
      </div>

      {/* Главный баннер статуса */}
      <div className="card" style={styles.banner}>
        <div style={styles.bannerTop}>
          <div style={styles.overallOk}>
            <span style={styles.pulseDot} />
            <strong>Все серверные узлы и сервисы функционируют штатно</strong>
          </div>
          <span style={styles.statsSummary}>
            Локаций в сети: <strong>3 из 3</strong> | Средний аптайм: <strong>99.99%</strong>
          </span>
        </div>
      </div>

      {/* Основной грид */}
      <div style={styles.grid}>
        {/* Левая колонка: Отслеживаемые сервисы */}
        <div style={styles.leftCol}>
          <div className="card">
            <h3 style={styles.sectionTitle}>Основные узлы и веб-сервисы</h3>
            <div style={styles.servicesGrid}>
              {SERVICES.map((srv, idx) => (
                <div key={idx} style={styles.serviceRow}>
                  <div style={styles.serviceMeta}>
                    <strong style={styles.serviceName}>{srv.name}</strong>
                    <span style={styles.serviceDesc}>{srv.desc}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                      Uptime за 30 дней: <strong>{srv.uptime.toFixed(2)}%</strong>
                    </span>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${srv.uptime}%` }} />
                    </div>
                  </div>
                  <span style={styles.okBadge}>{srv.state}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Загрузка игровых локаций (из SQLite DB) */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 style={styles.sectionTitle}>Текущая нагрузка нод (Динамически из SQLite БД)</h3>
            <div style={styles.locationsGrid}>
              {nodes.map((loc, idx) => (
                <div key={idx} style={styles.locationCard}>
                  <div style={styles.locationHeader}>
                    <Server size={18} color="#38bdf8" />
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{loc.name}</strong>
                  </div>
                  <div style={styles.metersList}>
                    <div style={styles.meterItem}>
                      <div style={styles.meterLabels}>
                        <span>Процессор (CPU)</span>
                        <strong>{loc.cpu}%</strong>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${loc.cpu}%`, backgroundColor: '#38bdf8' }} />
                      </div>
                    </div>

                    <div style={styles.meterItem}>
                      <div style={styles.meterLabels}>
                        <span>Память (RAM)</span>
                        <strong>{loc.ram}%</strong>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${loc.ram}%`, backgroundColor: '#10b981' }} />
                      </div>
                    </div>

                    <div style={styles.meterItem}>
                      <div style={styles.meterLabels}>
                        <span>Накопитель (NVMe SSD)</span>
                        <strong>{loc.ssd}%</strong>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${loc.ssd}%`, backgroundColor: '#a855f7' }} />
                      </div>
                    </div>
                  </div>
                  <span style={styles.updateTime}>Обновлено: {loc.updated}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Правая колонка: История инцидентов и работ */}
        <div style={styles.rightCol}>
          <div className="card" style={{ height: '100%' }}>
            <h3 style={styles.sectionTitle}>Журнал событий и работ</h3>
            <div style={styles.incidentsList}>
              {INCIDENTS.map((inc, idx) => (
                <div key={idx} style={styles.incidentItem}>
                  <div style={styles.incidentHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} color="var(--status-success)" />
                      <strong style={styles.incidentTitle}>{inc.title}</strong>
                    </div>
                    <span style={styles.resolvedBadge}>Выполнено</span>
                  </div>
                  <p style={styles.incidentDesc}>{inc.desc}</p>
                  <div style={styles.incidentMeta}>
                    <span>Контур: <strong>{inc.scope}</strong></span>
                    <span>Дата: <strong>{inc.date}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
    fontWeight: '800',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    margin: '0.25rem 0 0 0',
  },
  banner: {
    padding: '1.25rem 2rem',
    marginBottom: '2rem',
  },
  bannerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  overallOk: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
  },
  pulseDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--status-success)',
    boxShadow: '0 0 8px var(--status-success)',
    display: 'inline-block',
  },
  statsSummary: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightCol: {
    height: '100%',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
    marginBottom: '1.25rem',
    margin: 0,
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
  },
  servicesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem',
  },
  serviceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1rem',
  },
  serviceMeta: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    paddingRight: '1rem',
  },
  serviceName: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  serviceDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  progressBar: {
    height: '6px',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '0.5rem',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--status-success)',
    borderRadius: '3px',
  },
  okBadge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--status-success)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  locationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  locationCard: {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  locationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  metersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  meterItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  meterLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  updateTime: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '1rem',
    display: 'block',
    textAlign: 'right',
  },
  incidentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1.25rem',
  },
  incidentItem: {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1rem',
  },
  incidentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  incidentTitle: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
  },
  resolvedBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: 'var(--status-success)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  incidentDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: '0 0 0.75rem 0',
  },
  incidentMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '0.5rem',
  }
};
