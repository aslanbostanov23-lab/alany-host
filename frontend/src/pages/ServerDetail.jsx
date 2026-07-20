import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { 
  Play, 
  Square, 
  RotateCw, 
  Terminal, 
  FolderOpen, 
  Database, 
  Settings, 
  Send,
  FileText,
  Trash2,
  Edit,
  RefreshCw,
  ArrowLeft,
  Download,
  Clock,
  Archive,
  Plus,
  Copy,
  Key,
  Info,
  Layers,
  Globe,
  Cpu,
  Users,
  Zap
} from 'lucide-react';

export default function ServerDetail({ serverId, onBack, user }) {
  const [server, setServer] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ cpu: 0, ram: 0, ram_max: 1024, players: 0, slots: 0, disk: 0, disk_max: 10240 });
  const [historyData, setHistoryData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [files, setFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null); // { filepath, content }
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReinstalling, setIsReinstalling] = useState(false);
  
  // Состояния для автоустановщика модов
  const [isInstallingMod, setIsInstallingMod] = useState(false);
  const [installationLogs, setInstallationLogs] = useState([]);
  const [installProgress, setInstallProgress] = useState(0);
  const [selectedModName, setSelectedModName] = useState('');

  // Состояния для планировщика задач
  const [tasksList, setTasksList] = useState([
    { id: 1, name: 'Ежедневный рестарт', action: 'restart', cron: 'Каждый день в 05:00', status: 'active' },
    { id: 2, name: 'Автоматическое сохранение мира', action: 'command', command: '/save-all', cron: 'Каждые 2 часа', status: 'active' },
    { id: 3, name: 'Очистка логов сервера', action: 'command', command: '/clear-logs', cron: 'Каждое воскресенье в 04:00', status: 'inactive' }
  ]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskAction, setNewTaskAction] = useState('restart');
  const [newTaskCron, setNewTaskCron] = useState('Каждые 12 часов');
  const [newTaskCommand, setNewTaskCommand] = useState('');

  // Состояния для резервных копий
  const [backupsList, setBackupsList] = useState([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Состояния для веб-хостинга PHP
  const [webDomains, setWebDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [isInstallingCMS, setIsInstallingCMS] = useState(false);
  const [cmsInstallLogs, setCmsInstallLogs] = useState([]);
  const [cmsInstallProgress, setCmsInstallProgress] = useState(0);
  const [selectedCMS, setSelectedCMS] = useState('');

  useEffect(() => {
    if (serverId) {
      setBackupsList([
        { id: 1, filename: `backup_server_${serverId}_19-08-2026.tar.gz`, size: '148 MB', date: '19.08.2026, 12:45' },
        { id: 2, filename: `backup_server_${serverId}_init.tar.gz`, size: '92 MB', date: '18.08.2026, 09:12' }
      ]);
      setWebDomains([`site-${serverId}.alany-host.ru`]);
    }
  }, [serverId]);

  const consoleEndRef = useRef(null);

  useEffect(() => {
    fetchServerDetails();
    fetchFiles();
    loadMockDatabases();

    // Запускаем интервал обновления статистики и логов консоли
    const interval = setInterval(() => {
      updateStatsAndLogs();
    }, 2000);

    return () => clearInterval(interval);
  }, [serverId]);

  useEffect(() => {
    // Прокрутка консоли вниз при появлении логов
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const fetchServerDetails = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/servers/${serverId}`);
      setServer(data);
    } catch (error) {
      console.error(error);
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const data = await api.get(`/servers/${serverId}/files`);
      setFiles(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadMockDatabases = () => {
    // Временный список баз данных
    setDatabases([
      { name: `srv_db_${serverId}`, user: 'root', host: '127.0.0.1', port: 3306 }
    ]);
  };

  const updateStatsAndLogs = async () => {
    if (!serverId) return;
    try {
      // 1. Обновляем статус и характеристики
      const statsRes = await api.get(`/servers/${serverId}/stats`);
      setStats(statsRes);

      // Записываем историю для графиков (максимум 10 точек)
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHistoryData(prev => {
        const next = [...prev, { time: now, cpu: statsRes.cpu, ram: parseFloat((statsRes.ram / 1024).toFixed(2)) }];
        if (next.length > 10) next.shift();
        return next;
      });

      // 2. Обновляем логи
      const consoleRes = await api.get(`/servers/${serverId}/console`);
      setLogs(consoleRes.logs);

      // Обновляем статус сервера, если он изменился (например, с starting на running)
      const details = await api.get(`/servers/${serverId}`);
      setServer(details);
    } catch (error) {
      console.error('Ошибка фонового обновления:', error);
    }
  };

  const handlePower = async (action) => {
    if (!server) return;
    setServer({ ...server, status: action === 'start' || action === 'restart' ? 'starting' : 'stopped' });
    try {
      await api.post(`/servers/${serverId}/power`, { action });
      setTimeout(updateStatsAndLogs, 1000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendCommand = (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    // Добавляем отправленную команду в консоль
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] [USER] Executed command: ${command}`]);

    // Имитируем выполнение команды
    setTimeout(() => {
      const respTime = new Date().toLocaleTimeString();
      let responseLog = `[${respTime}] [Server/INFO]: Command execution successful.`;
      
      if (command.toLowerCase().includes('help')) {
        responseLog = `[${respTime}] [Server/INFO]: Available commands: help, status, op <player>, reload, stop`;
      } else if (command.toLowerCase().startsWith('op ')) {
        const player = command.split(' ')[1];
        responseLog = `[${respTime}] [Server/INFO]: Made ${player} a server operator`;
      } else if (command.toLowerCase().includes('status')) {
        responseLog = `[${respTime}] [Server/INFO]: Online. CPU: ${stats.cpu}%, RAM: ${stats.ram}/${stats.ram_max}MB`;
      }

      setLogs(prev => [...prev, responseLog]);
    }, 800);

    setCommand('');
  };

  // Файловый менеджер
  const handleEditFile = async (filepath) => {
    try {
      const data = await api.get(`/servers/${serverId}/files/read?path=${filepath}`);
      setEditingFile({ filepath, content: data.content });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    try {
      await api.post(`/servers/${serverId}/files/write`, {
        filepath: editingFile.filepath,
        content: editingFile.content
      });
      setEditingFile(null);
      fetchFiles();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteFile = async (filepath) => {
    if (!window.confirm(`Вы уверены, что хотите удалить файл ${filepath}?`)) return;
    try {
      await api.post(`/servers/${serverId}/files/delete`, { filepath });
      fetchFiles();
    } catch (error) {
      console.error(error);
    }
  };

  const handleReinstall = async () => {
    if (!window.confirm("Внимание! Все конфигурационные файлы сервера будут сброшены к значениям по умолчанию. Продолжить?")) return;
    setIsReinstalling(true);
    try {
      await api.post(`/servers/${serverId}/reinstall`);
      fetchFiles();
      alert("Сервер успешно переустановлен!");
    } catch (error) {
      console.error(error);
    } finally {
      setIsReinstalling(false);
    }
  };

  const fetchDatabases = async () => {
    try {
      const data = await api.get(`/servers/${serverId}/databases`);
      setDatabases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки БД:', err);
    }
  };

  const fetchBackups = async () => {
    try {
      const data = await api.get(`/servers/${serverId}/backups`);
      setBackupsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки бэкапов:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await api.get(`/servers/${serverId}/tasks`);
      setTasksList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки задач:', err);
    }
  };

  useEffect(() => {
    if (serverId) {
      fetchDatabases();
      fetchBackups();
      fetchTasks();
      setWebDomains([`site-${serverId}.alany-host.ru`]);
    }
  }, [serverId]);

  // Базы данных
  const handleCreateDB = async () => {
    try {
      await api.post(`/servers/${serverId}/databases`, {});
      fetchDatabases();
    } catch (err) {
      alert('Ошибка создания базы данных');
    }
  };

  const handleDeleteDB = async (dbId) => {
    if (!window.confirm('Вы действительно хотите удалить эту базу данных?')) return;
    try {
      await api.delete(`/servers/${serverId}/databases/${dbId}`);
      fetchDatabases();
    } catch (err) {
      alert('Ошибка удаления базы данных');
    }
  };

  // Резервные копии
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await api.post(`/servers/${serverId}/backups`, {});
      fetchBackups();
      alert('Резервная копия успешно создана и сохранена в базу данных!');
    } catch (err) {
      alert('Ошибка создания резервной копии');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = (filename) => {
    if (!window.confirm(`Вы уверены, что хотите восстановить сервер из копии ${filename}? Все текущие файлы будут заменены.`)) return;
    setIsReinstalling(true);
    setTimeout(() => {
      setIsReinstalling(false);
      alert('Сервер успешно восстановлен из резервной копии и запущен!');
      handlePower('restart');
    }, 2000);
  };

  const handleDeleteBackup = async (id) => {
    if (!window.confirm('Вы действительно хотите удалить эту резервную копию?')) return;
    try {
      await api.delete(`/servers/${serverId}/backups/${id}`);
      fetchBackups();
    } catch (err) {
      alert('Ошибка удаления бэкапа');
    }
  };

  // Планировщик задач
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    try {
      await api.post(`/servers/${serverId}/tasks`, {
        name: newTaskName,
        action: newTaskAction,
        cron: newTaskCron,
        command: newTaskAction === 'command' ? newTaskCommand : ''
      });
      setShowCreateTaskModal(false);
      setNewTaskName('');
      setNewTaskCommand('');
      fetchTasks();
    } catch (err) {
      alert('Ошибка создания задачи');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Вы действительно хотите удалить эту задачу?')) return;
    try {
      await api.delete(`/servers/${serverId}/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      alert('Ошибка удаления задачи');
    }
  };

  const handleToggleTaskStatus = (id) => {
    setTasksList(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'active' ? 'inactive' : 'active' };
      }
      return t;
    }));
  };

  // Автоустановка модов
  const getModsForGame = () => {
    const game = server?.game_type || '';
    if (game.includes('samp') || game.includes('gta')) {
      return [
        { id: 'diamond', name: 'Diamond RP (MySQL)', desc: 'Готовая копия Diamond RolePlay с базой данных, фракциями, работами и полностью оптимизированным кодом.', price: 'Бесплатно' },
        { id: 'arizona', name: 'Arizona RP (MySQL)', desc: 'Полноценный мод Arizona RP с современными системами, бизнесами, домами и кастомными машинами.', price: 'Бесплатно' },
        { id: 'drift', name: 'Drift Sandbox Edition', desc: 'Развлекательный мод со спавном любого транспорта, тюнинг-ателье и дрифт-трассами по всей карте.', price: 'Бесплатно' },
        { id: 'zombie', name: 'Zombie Survival Post-Apocalypse', desc: 'Мод на выживание: зомби по всей карте, система инвентаря, поиск лута, спавн оружия и крафт.', price: 'Бесплатно' }
      ];
    } else if (game === 'minecraft') {
      return [
        { id: 'spigot_core', name: 'Spigot 1.20 + Core Plugins', desc: 'Сборка с плагинами авторизации, WorldEdit, EssentialsX, Vault и настроенными правами LuckPerms.', price: 'Бесплатно' },
        { id: 'skyblock', name: 'SkyBlock Adventure Pack', desc: 'Готовая сборка выживания на небесном острове: квесты, магазин блоков, экономика и паркур-арены.', price: 'Бесплатно' },
        { id: 'bedwars', name: 'BedWars Mini-Game Setup', desc: 'Полностью настроенный сервер BedWars с генераторами ресурсов, лобби ожидания и автоматическим запуском арен.', price: 'Бесплатно' },
        { id: 'anarchy', name: 'Hardcore Anarchy Setup', desc: 'Готовая сборка для сервера анархии: приват сундуков, гриферство, оптимизированный античит и кланы.', price: 'Бесплатно' }
      ];
    } else if (game === 'scp') {
      return [
        { id: 'scp_exiled', name: 'EXILED Framework + Plugins', desc: 'Модифицированное ядро EXILED с плагинами кастомных предметов, SCP-035 и плагином авто-баланса.', price: 'Бесплатно' },
        { id: 'scp_roleplay', name: 'SCP Containment RolePlay', desc: 'Сборка для RP-сервера с ролями ученых, охраны, МОГ, хаоса и расширенными картами доступа.', price: 'Бесплатно' }
      ];
    } else {
      return [
        { id: 'default_mod_1', name: 'Базовая оптимизация сервера', desc: 'Установка пакета плагинов оптимизации сетевого трафика и снижения пинга.', price: 'Бесплатно' },
        { id: 'default_mod_2', name: 'Административные плагины', desc: 'Набор плагинов для расширенного управления сервером, бан-листов и логов действий.', price: 'Бесплатно' }
      ];
    }
  };

  const handleInstallMod = (mod) => {
    if (!window.confirm(`Вы уверены, что хотите установить сборку ${mod.name}? Текущие файлы конфигурации будут перезаписаны.`)) return;
    setIsInstallingMod(true);
    setInstallProgress(0);
    setSelectedModName(mod.name);
    setInstallationLogs([]);

    const logSteps = [
      { prg: 0, text: '[System]: Establishing connection with Server Node...' },
      { prg: 10, text: '[System]: Sending command to stop game server process...' },
      { prg: 20, text: '[System]: Wiping current conflicting configurations...' },
      { prg: 30, text: `[System]: Fetching mod repository archive: ${mod.id}_mod.tar.gz...` },
      { prg: 50, text: '[System]: Extracting archive files into server root (this may take a few seconds)...' },
      { prg: 70, text: `[System]: Linking game client configurations to MySQL database: srv_db_${serverId}...` },
      { prg: 85, text: '[System]: Database tables imported successfully (48 structure files built).' },
      { prg: 95, text: '[System]: Flushing server cache and setting permissions: chmod 777...' },
      { prg: 100, text: `[System]: Installation of ${mod.name} completed successfully! Restarting game server.` }
    ];

    let currentStep = 0;
    const interval = setInterval(async () => {
      if (currentStep < logSteps.length) {
        const step = logSteps[currentStep];
        setInstallProgress(step.prg);
        setInstallationLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${step.text}`]);
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Вызываем серверный роут для создания реальных файлов мода и БД в SQLite
        try {
          await api.post(`/servers/${serverId}/install-mod`, { modId: mod.id, modName: mod.name });
        } catch (err) {
          console.error('Ошибка записи мода:', err);
        }

        setTimeout(() => {
          setIsInstallingMod(false);
          fetchFiles();
          fetchDatabases();
          handlePower('restart');
          alert(`Сборка ${mod.name} успешно развернута, создана база данных MySQL и файлы в Файловом Менеджере!`);
        }, 800);
      }
    }, 650);
  };

  // Управление веб-хостингом
  const handleAddDomain = (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    if (webDomains.includes(newDomain.trim())) {
      alert('Этот домен уже добавлен!');
      return;
    }
    setWebDomains(prev => [...prev, newDomain.trim()]);
    setNewDomain('');
    alert('Домен успешно направлен на веб-хостинг! Записи DNS обновятся в течение нескольких минут.');
  };

  const handleDeleteDomain = (domain) => {
    if (webDomains.length <= 1) {
      alert('Нельзя удалить единственный домен!');
      return;
    }
    if (!window.confirm(`Вы уверены, что хотите удалить домен ${domain}?`)) return;
    setWebDomains(prev => prev.filter(d => d !== domain));
  };

  const handleInstallCMS = (cmsName, cmsId) => {
    if (!window.confirm(`Вы действительно хотите установить CMS ${cmsName} на основной домен? Все существующие файлы в директории public_html будут перезаписаны.`)) return;
    
    setIsInstallingCMS(true);
    setCmsInstallProgress(0);
    setSelectedCMS(cmsName);
    setCmsInstallLogs([]);

    const logSteps = [
      { prg: 0, text: '[Webhost]: Establishing secure SSH session with hosting node...' },
      { prg: 15, text: `[Webhost]: Downloading official ${cmsName} installation package...` },
      { prg: 35, text: '[Webhost]: Wiping public_html directory for primary site...' },
      { prg: 50, text: `[Webhost]: Extracting ${cmsId}.zip source files to public_html...` },
      { prg: 70, text: `[Webhost]: Creating MySQL database and user: u_${serverId}_${cmsId}...` },
      { prg: 85, text: '[Webhost]: Injecting SQL structure and configurations...' },
      { prg: 95, text: '[Webhost]: Setting web server directory permissions (chown -R www-data)...' },
      { prg: 100, text: `[Webhost]: CMS ${cmsName} has been successfully installed!` }
    ];

    let currentStep = 0;
    const interval = setInterval(async () => {
      if (currentStep < logSteps.length) {
        const step = logSteps[currentStep];
        setCmsInstallProgress(step.prg);
        setCmsInstallLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${step.text}`]);
        currentStep++;
      } else {
        clearInterval(interval);

        // Записываем файлы CMS в дисковый массив, чтобы они появились в Файловом менеджере!
        try {
          await api.post(`/servers/${serverId}/files/write`, {
            filepath: 'public_html/index.php',
            content: `<?php\n// CMS ${cmsName} initialized\ndefine('CMS_ACTIVE', true);\necho "Welcome to ${cmsName} installed via Alany Host Web-Hosting Panel!";`
          });
          await api.post(`/servers/${serverId}/files/write`, {
            filepath: 'public_html/config.php',
            content: `<?php\n// CMS configuration\n$db_host = '127.0.0.1';\n$db_name = 'u_${serverId}_${cmsId}';\n$db_user = 'u_${serverId}_${cmsId}';\n$db_pass = 'sql_pass_123';`
          });
        } catch (err) {
          console.error('Ошибка записи файлов CMS:', err);
        }

        setTimeout(() => {
          setIsInstallingCMS(false);
          fetchFiles();
          alert(`CMS ${cmsName} успешно установлена! Вы можете перейти в файловый менеджер.`);
        }, 800);
      }
    }, 700);
  };

  if (loading || !server) {
    return <div className="page-container"><div style={styles.loading}>Загрузка деталей сервера...</div></div>;
  }

  const isOnline = server.status === 'running';
  const isStarting = server.status === 'starting';

  return (
    <div className="page-container">
      {/* Кнопка назад */}
      <button onClick={onBack} style={styles.backBtn} className="btn btn-secondary">
        <ArrowLeft size={16} />
        <span>Вернуться к списку</span>
      </button>

      {/* Шапка сервера */}
      <div className="card" style={styles.serverHeaderCard}>
        <div style={styles.headerInfo}>
          <h2 style={styles.serverTitle}>{server.name}</h2>
          <span style={styles.ipText}>{server.ip_address}:{server.port}</span>
        </div>
        <div style={styles.headerControls}>
          <div style={styles.powerButtons}>
            {!isOnline && !isStarting && (
              <button onClick={() => handlePower('start')} className="btn btn-primary" style={styles.controlBtn}>
                <Play size={16} fill="currentColor" />
                <span>Запустить</span>
              </button>
            )}
            {(isOnline || isStarting) && (
              <button onClick={() => handlePower('stop')} className="btn btn-danger" style={styles.controlBtn}>
                <Square size={16} fill="currentColor" />
                <span>Остановить</span>
              </button>
            )}
            {(isOnline || isStarting) && (
              <button onClick={() => handlePower('restart')} className="btn btn-secondary" style={styles.controlBtn}>
                <RotateCw size={16} />
                <span>Перезапустить</span>
              </button>
            )}
          </div>
          <div style={styles.statusSection}>
            <span style={{ 
              ...styles.indicator, 
              backgroundColor: isOnline ? 'var(--status-success)' : isStarting ? 'var(--status-warning)' : 'var(--status-danger)',
              boxShadow: `0 0 10px ${isOnline ? 'var(--status-success)' : isStarting ? 'var(--status-warning)' : 'var(--status-danger)'}`
            }}></span>
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
              {isOnline ? 'РАБОТАЕТ' : isStarting ? 'ЗАПУСКАЕТСЯ' : 'ВЫКЛЮЧЕН'}
            </span>
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div style={styles.tabsRow}>
        <button 
          onClick={() => setActiveTab('overview')} 
          style={{ ...styles.tabBtn, ...(activeTab === 'overview' ? styles.activeTabBtn : {}) }}
        >
          <Info size={18} />
          <span>Обзор & Инфо</span>
        </button>
        <button 
          onClick={() => setActiveTab('console')} 
          style={{ ...styles.tabBtn, ...(activeTab === 'console' ? styles.activeTabBtn : {}) }}
        >
          <Terminal size={18} />
          <span>Консоль & Ресурсы</span>
        </button>
        <button 
          onClick={() => setActiveTab('files')} 
          style={{ ...styles.tabBtn, ...(activeTab === 'files' ? styles.activeTabBtn : {}) }}
        >
          <FolderOpen size={18} />
          <span>Файлы</span>
        </button>
        <button 
          onClick={() => setActiveTab('databases')} 
          style={{ ...styles.tabBtn, ...(activeTab === 'databases' ? styles.activeTabBtn : {}) }}
        >
          <Database size={18} />
          <span>Базы MySQL</span>
        </button>
        <button 
          onClick={() => setActiveTab('autoinstall')} 
          style={{ ...styles.tabBtn, ...(activeTab === 'autoinstall' ? styles.activeTabBtn : {}) }}
        >
          <Download size={18} />
          <span>Автоустановка</span>
        </button>
        <button 
          onClick={() => setActiveTab('tasks')} 
          style={{ ...styles.tabBtn, ...(activeTab === 'tasks' ? styles.activeTabBtn : {}) }}
        >
          <Clock size={18} />
          <span>Планировщик</span>
        </button>
        <button 
          onClick={() => setActiveTab('backups')} 
          style={{ ...styles.tabBtn, ...(activeTab === 'backups' ? styles.activeTabBtn : {}) }}
        >
          <Archive size={18} />
          <span>Бэкапы</span>
        </button>
      </div>

      {/* Содержимое вкладок */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Быстрые метрики сервера */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            
            {/* IP и Порт */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IP АДРЕС И ПОРТ</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem', wordBreak: 'break-all' }}>
                {server.ip_address}:{server.port}
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  navigator.clipboard.writeText(`${server.ip_address}:${server.port}`);
                  alert('IP адрес скопирован в буфер обмена!');
                }}
                style={{ width: '100%', justifyContent: 'center', padding: '0.45rem', fontSize: '0.8rem', gap: '0.4rem' }}
              >
                <Copy size={13} />
                <span>Скопировать IP</span>
              </button>
            </div>

            {/* Загрузка процессора и ОЗУ */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ПАМЯТЬ & ЦП</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
                {stats.ram} MB <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {stats.ram_max} MB</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#10b981' : '#ef4444' }} />
                <span>CPU: {stats.cpu}% ({server.cpu || 2} vCPU)</span>
              </div>
            </div>

            {/* Игроки и онлайн */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ИГРОКИ ОНЛАЙН</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
                {stats.players} <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {stats.slots || 50} слотов</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Локация: Москва, RU (DDoS Protection)
              </div>
            </div>

            {/* Срок аренды */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>СРОК АРЕНДЫ</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
                30 дней <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>● Активен</span>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => alert('Сервер успешно продлён на 30 дней!')}
                style={{ width: '100%', justifyContent: 'center', padding: '0.45rem', fontSize: '0.8rem', gap: '0.4rem' }}
              >
                <Zap size={13} color="#f59e0b" />
                <span>Продлить аренду</span>
              </button>
            </div>

          </div>

          {/* Детальная информация о сервере и FTP доступы */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Карточка Подключения FTP & MySQL */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="#38bdf8" />
                <span>Данные для подключения FTP</span>
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Хост FTP:</span>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>ftp.alany-host.ru</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Логин:</span>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>srv_{server.id}_user</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Порт FTP:</span>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>21</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Пароль:</span>
                  <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>••••••••••••</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    navigator.clipboard.writeText(`ftp.alany-host.ru|srv_${server.id}_user|21`);
                    alert('Данные FTP скопированы в буфер обмена!');
                  }}
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.82rem', justifyContent: 'center' }}
                >
                  <Copy size={14} />
                  <span>Скопировать FTP</span>
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('files')}
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.82rem', justifyContent: 'center' }}
                >
                  <FolderOpen size={14} />
                  <span>В файловый менеджер</span>
                </button>
              </div>
            </div>

            {/* Карточка спецификации тарифа */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="#10b981" />
                <span>Конфигурация сервера</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Игровой Сервис:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{server.game_type ? server.game_type.toUpperCase() : 'MINECRAFT'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Выделенные ядра CPU:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{server.cpu || 2} vCPU (AMD EPYC 4.5 GHz)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Оперативная память:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{stats.ram_max >= 1024 ? `${stats.ram_max / 1024} GB` : `${stats.ram_max} MB`} DDR5 ECC</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Дисковое пространство:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{stats.disk_max >= 1024 ? `${(stats.disk_max / 1024).toFixed(0)} GB` : `${stats.disk_max} MB`} NVMe SSD</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setActiveTab('console')}
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.82rem', justifyContent: 'center' }}
                >
                  <Terminal size={14} />
                  <span>Открыть Консоль</span>
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('autoinstall')}
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.82rem', justifyContent: 'center' }}
                >
                  <Download size={14} />
                  <span>Автоустановка сборки</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Содержимое вкладок */}
      {activeTab === 'console' && (
        server.game_type === 'webhost' ? (
          /* Webhost UI Control Panel */
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Левая панель - Управление сайтами */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Управление сайтами и доменами</h4>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-success)', boxShadow: '0 0 8px var(--status-success)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nginx + PHP-FPM: Работает</span>
                </div>
              </div>

              {/* Форма добавления домена */}
              <form onSubmit={handleAddDomain} style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="Добавить новый домен (например, forum.project.ru)..."
                  className="form-input"
                  style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  required
                />
                <button type="submit" className="btn btn-cyan" style={{ fontSize: '0.85rem' }}>Направить домен</button>
              </form>

              {/* Список доменов */}
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>Привязанные домены ({webDomains.length} из {server.slots}):</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {webDomains.map((domain, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--accent-blue)', fontWeight: '600', fontSize: '0.9rem' }}>{domain}</span>
                        <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>SSL Активен</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteDomain(domain)}
                        className="btn btn-danger btn-icon"
                        title="Удалить домен"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Установщик CMS */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Автоустановка CMS (Форумы / Сайты)</h4>
                
                {isInstallingCMS ? (
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Установка {selectedCMS}...</strong>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold', fontSize: '0.85rem' }}>{cmsInstallProgress}%</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cmsInstallProgress}%`, backgroundColor: 'var(--accent-blue)', transition: 'width 0.2s ease', borderRadius: '3px' }} />
                    </div>
                    <div style={{ backgroundColor: '#0a0b0d', borderRadius: '8px', padding: '0.75rem', height: '120px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem', color: '#10b981', border: '1px solid var(--border-color)' }}>
                      {cmsInstallLogs.map((log, idx) => (
                        <div key={idx} style={{ marginBottom: '0.2rem' }}>{log}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', padding: '1rem', backgroundColor: 'var(--bg-secondary)' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>XenForo 2.2</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem', lineHeight: '1.4' }}>Самый популярный игровой форум для проектов SAMP, MTA, Minecraft. Полная база данных и плагины.</span>
                      </div>
                      <button onClick={() => handleInstallCMS('XenForo', 'xenforo')} className="btn btn-cyan" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', marginTop: '1rem', width: 'fit-content' }}>Установить форум</button>
                    </div>

                    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', padding: '1rem', backgroundColor: 'var(--bg-secondary)' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>WordPress 6.2</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem', lineHeight: '1.4' }}>Идеально подходит для создания главной страницы проекта, автодоната или блогов новостей.</span>
                      </div>
                      <button onClick={() => handleInstallCMS('WordPress', 'wordpress')} className="btn btn-cyan" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', marginTop: '1rem', width: 'fit-content' }}>Установить сайт</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Правая панель - Характеристики */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Характеристики хостинга</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Память (RAM):</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{stats.ram_max} MB</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Диск (SSD):</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{(stats.disk_max / 1024).toFixed(0)} GB</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CPU Cores:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{server.cpu_cores} Core</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Веб-сервер:</span>
                    <strong style={{ color: 'var(--accent-blue)' }}>Nginx 1.22</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>База данных:</span>
                    <strong style={{ color: 'var(--accent-blue)' }}>MySQL 8.0</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Версия PHP:</span>
                    <strong style={{ color: 'var(--accent-blue)' }}>PHP-FPM 8.1</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Обычный Console / Charts UI */
          <div style={styles.consoleGrid}>
            {/* Консоль */}
            <div className="card" style={styles.consoleCard}>
              <div style={styles.cardTitle}>
                <Terminal size={16} color="var(--accent-blue)" />
                <span>Терминал сервера</span>
              </div>
              <div style={styles.terminalWindow}>
                {logs.map((log, index) => (
                  <div key={index} style={styles.logLine}>{log}</div>
                ))}
                <div ref={consoleEndRef} />
              </div>
              <form onSubmit={handleSendCommand} style={styles.consoleInputRow}>
                <input 
                  type="text" 
                  placeholder="Введите команду сервера (например, help)..." 
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  style={styles.consoleInput}
                  disabled={!isOnline}
                />
                <button type="submit" className="btn btn-primary" style={styles.sendBtn} disabled={!isOnline}>
                  <Send size={16} />
                </button>
              </form>
            </div>

            {/* Графики ресурсов */}
            <div style={styles.chartsColumn}>
              {/* Карточка ЦП */}
              <div className="card" style={styles.chartCard}>
                <div style={styles.cardTitle}>
                  <span>Загрузка процессора (CPU)</span>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>{stats.cpu}%</span>
                </div>
                <div style={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                      <Area type="monotone" dataKey="cpu" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#colorCpu)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Карточка ОЗУ */}
              <div className="card" style={styles.chartCard}>
                <div style={styles.cardTitle}>
                  <span>Использование памяти (RAM)</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                    {stats.ram} MB / {stats.ram_max} MB
                  </span>
                </div>
                <div style={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[0, parseFloat((stats.ram_max/1024).toFixed(1))]} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                      <Area type="monotone" dataKey="ram" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorRam)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {activeTab === 'files' && (
        <div className="card">
          <div style={styles.filesHeader}>
            <h4>Файлы в корневой директории</h4>
            <button 
              onClick={handleReinstall} 
              disabled={isReinstalling}
              className="btn btn-danger"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={isReinstalling ? 'spin' : ''} />
              <span>Сбросить / Переустановить</span>
            </button>
          </div>

          <div style={styles.filesList}>
            {files.map((file) => (
              <div key={file.id} style={styles.fileRow}>
                <div style={styles.fileNameCell}>
                  <FileText size={18} color="var(--text-secondary)" />
                  <span style={styles.fileName}>{file.filepath}</span>
                </div>
                <div style={styles.fileActions}>
                  <button 
                    onClick={() => handleEditFile(file.filepath)}
                    className="btn btn-secondary btn-icon" 
                    title="Редактировать"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteFile(file.filepath)}
                    className="btn btn-danger btn-icon"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Модалка редактирования файлов */}
          <Modal 
            isOpen={editingFile !== null} 
            onClose={() => setEditingFile(null)}
            title={`Редактирование: ${editingFile?.filepath}`}
          >
            {editingFile && (
              <div style={styles.editorContainer}>
                <textarea 
                  value={editingFile.content}
                  onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                  style={styles.editorArea}
                  rows={15}
                />
                <div style={styles.editorFooter}>
                  <button onClick={() => setEditingFile(null)} className="btn btn-secondary">Отмена</button>
                  <button onClick={handleSaveFile} className="btn btn-primary">Сохранить изменения</button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      )}

      {activeTab === 'databases' && (
        <div className="card">
          <div style={styles.filesHeader}>
            <h4>Базы данных MySQL</h4>
            <button onClick={handleCreateDB} className="btn btn-cyan" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Создать базу данных
            </button>
          </div>

          <div style={styles.dbList}>
            {databases.map((db, index) => (
              <div key={index} className="card" style={styles.dbCard}>
                <div style={styles.dbGrid}>
                  <div>
                    <span style={styles.dbLabel}>СУБД</span>
                    <span style={styles.dbValue}>MySQL</span>
                  </div>
                  <div>
                    <span style={styles.dbLabel}>Хост</span>
                    <span style={styles.dbValue}>{db.host}</span>
                  </div>
                  <div>
                    <span style={styles.dbLabel}>Порт</span>
                    <span style={styles.dbValue}>{db.port}</span>
                  </div>
                  <div>
                    <span style={styles.dbLabel}>Имя БД</span>
                    <span style={styles.dbValue}>{db.name}</span>
                  </div>
                  <div>
                    <span style={styles.dbLabel}>Пользователь</span>
                    <span style={styles.dbValue}>{db.user}</span>
                  </div>
                  <div>
                    <span style={styles.dbLabel}>Пароль</span>
                    <span style={styles.dbValue}>{db.password || '••••••••'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Вкладка Автоустановка */}
      {activeTab === 'autoinstall' && (
        <div className="card">
          <div style={styles.filesHeader}>
            <div>
              <h4 style={{ margin: 0 }}>Автоустановка готовых сборок / модов</h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Выберите и установите готовую сборку игры в один клик. Все необходимые файлы и БД MySQL будут настроены автоматически.
              </p>
            </div>
          </div>

          {isInstallingMod ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Установка сборки: {selectedModName}</strong>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>{installProgress}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${installProgress}%`, backgroundColor: 'var(--accent-blue)', transition: 'width 0.3s ease', borderRadius: '4px' }} />
              </div>
              <div style={{ backgroundColor: '#0a0b0d', borderRadius: '8px', padding: '1rem', height: '180px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', color: '#10b981', border: '1px solid var(--border-color)' }}>
                {installationLogs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '0.25rem' }}>{log}</div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              {getModsForGame().map(mod => (
                <div key={mod.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '1.25rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>{mod.name}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '1.25rem' }}>{mod.desc}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--status-success)', fontWeight: 'bold' }}>{mod.price}</span>
                    <button 
                      onClick={() => handleInstallMod(mod)}
                      className="btn btn-primary" 
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    >
                      Установить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Вкладка Планировщик */}
      {activeTab === 'tasks' && (
        <div className="card">
          <div style={styles.filesHeader}>
            <div>
              <h4 style={{ margin: 0 }}>Планировщик задач (Cron)</h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Автоматизируйте рестарты или выполнение консольных команд по расписанию.
              </p>
            </div>
            <button 
              onClick={() => setShowCreateTaskModal(true)} 
              className="btn btn-cyan" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <Plus size={14} style={{ marginRight: '0.25rem' }} />
              <span>Создать задачу</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            {tasksList.map(task => (
              <div key={task.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem' }}>
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>{task.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                    Действие: <strong>{task.action === 'restart' ? 'Рестарт сервера' : `Команда: ${task.command}`}</strong> | Расписание: <strong>{task.cron}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => handleToggleTaskStatus(task.id)}
                    className={`btn ${task.status === 'active' ? 'btn-success' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    {task.status === 'active' ? 'Активна' : 'Выключена'}
                  </button>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="btn btn-danger btn-icon"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Модалка создания задачи */}
          <Modal 
            isOpen={showCreateTaskModal} 
            onClose={() => setShowCreateTaskModal(false)}
            title="Создание запланированной задачи"
          >
            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Название задачи</label>
                <input 
                  type="text" 
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="form-input"
                  placeholder="Например: Авторестарт ночью"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Действие</label>
                <select 
                  value={newTaskAction}
                  onChange={(e) => setNewTaskAction(e.target.value)}
                  className="form-input"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  <option value="restart">Перезапустить сервер</option>
                  <option value="stop">Остановить сервер</option>
                  <option value="start">Запустить сервер</option>
                  <option value="command">Выполнить консольную команду</option>
                </select>
              </div>

              {newTaskAction === 'command' && (
                <div className="form-group">
                  <label className="form-label">Команда консоли</label>
                  <input 
                    type="text" 
                    value={newTaskCommand}
                    onChange={(e) => setNewTaskCommand(e.target.value)}
                    className="form-input"
                    placeholder="Например: /say Server saving"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Периодичность (Cron)</label>
                <select 
                  value={newTaskCron}
                  onChange={(e) => setNewTaskCron(e.target.value)}
                  className="form-input"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  <option value="Каждый час">Каждый час</option>
                  <option value="Каждые 2 часа">Каждые 2 часа</option>
                  <option value="Каждые 12 часов">Каждые 12 часов</option>
                  <option value="Каждый день в 00:00">Каждый день в 00:00</option>
                  <option value="Каждый день в 05:00">Каждый день в 05:00</option>
                  <option value="Каждое воскресенье в 04:00">Каждое воскресенье в 04:00</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateTaskModal(false)} className="btn btn-secondary">Отмена</button>
                <button type="submit" className="btn btn-primary">Создать задачу</button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* Вкладка Бэкапы */}
      {activeTab === 'backups' && (
        <div className="card">
          <div style={styles.filesHeader}>
            <div>
              <h4 style={{ margin: 0 }}>Резервные копии сервера</h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Создавайте снимки файлов и баз данных вашего сервера для быстрого восстановления в случае сбоев.
              </p>
            </div>
            <button 
              onClick={handleCreateBackup} 
              disabled={isCreatingBackup}
              className="btn btn-cyan" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              {isCreatingBackup ? 'Создание...' : 'Создать резервную копию'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            {backupsList.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Резервных копий пока нет. Нажмите «Создать резервную копию» выше.
              </div>
            ) : (
              backupsList.map(bkp => (
                <div key={bkp.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'monospace', margin: 0 }}>{bkp.filename}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                      Размер: <strong>{bkp.size}</strong> | Дата создания: <strong>{bkp.date}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleRestoreBackup(bkp.filename)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      Восстановить
                    </button>
                    <button 
                      onClick={() => handleDeleteBackup(bkp.id)}
                      className="btn btn-danger btn-icon"
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  backBtn: {
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--text-secondary)',
  },
  serverHeaderCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, #121418 0%, #161a22 100%)',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  serverTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  ipText: {
    fontSize: '0.95rem',
    color: 'var(--accent-blue)',
    fontFamily: 'monospace',
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  powerButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  controlBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.2rem',
    fontSize: '0.9rem',
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--bg-primary)',
    padding: '0.6rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
  },
  indicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  tabsRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    overflowX: 'auto',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-main)',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  activeTabBtn: {
    backgroundColor: 'var(--bg-tertiary)',
    borderColor: 'var(--accent-primary)',
    color: 'var(--text-primary)',
  },
  consoleGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1.5rem',
  },
  consoleCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '480px',
    backgroundColor: '#07080a',
    borderColor: '#181b22',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #13161c',
    marginBottom: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  terminalWindow: {
    flex: 1,
    backgroundColor: '#040507',
    border: '1px solid #11141a',
    borderRadius: '10px',
    padding: '1rem',
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    color: '#cfd4de',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    marginBottom: '1rem',
  },
  logLine: {
    lineHeight: '1.4',
    wordBreak: 'break-all',
  },
  consoleInputRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  consoleInput: {
    flex: 1,
    backgroundColor: '#040507',
    border: '1px solid #1e222b',
    borderRadius: '10px',
    color: '#fff',
    padding: '0.75rem 1rem',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
  },
  sendBtn: {
    padding: '0 1rem',
  },
  chartsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  chartCard: {
    padding: '1.25rem',
  },
  chartWrapper: {
    marginTop: '1rem',
  },
  filesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  filesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  fileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    transition: 'var(--transition-smooth)',
  },
  fileNameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  fileName: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    fontWeight: '500',
  },
  fileActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editorContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  editorArea: {
    backgroundColor: '#040507',
    color: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '1rem',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    resize: 'vertical',
  },
  editorFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  dbList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  dbCard: {
    backgroundColor: 'var(--bg-primary)',
  },
  dbGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
  },
  dbLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    marginBottom: '0.25rem',
  },
  dbValue: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    wordBreak: 'break-all',
  },
};
