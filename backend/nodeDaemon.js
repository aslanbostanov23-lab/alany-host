const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const SERVERS_BASE_DIR = process.env.SERVERS_DIR || (process.platform === 'win32'
  ? path.resolve(__dirname, '../servers_data')
  : '/var/lib/alany-servers');

if (!fs.existsSync(SERVERS_BASE_DIR)) {
  fs.mkdirSync(SERVERS_BASE_DIR, { recursive: true });
}

// Активные дочерние процессы запущенных серверов
const runningProcesses = new Map();
// Буфер логов консоли серверов
const consoleLogs = new Map();

const getServerDir = (serverId) => {
  const dir = path.join(SERVERS_BASE_DIR, `server_${serverId}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const appendLog = (serverId, text) => {
  if (!consoleLogs.has(serverId)) {
    consoleLogs.set(serverId, []);
  }
  const logs = consoleLogs.get(serverId);
  logs.push(`[${new Date().toLocaleTimeString()}] ${text}`);
  if (logs.length > 500) logs.shift();
};

const nodeDaemon = {
  // Записать файлы сервера на физический диск
  writeFilesToDisk: (serverId, files) => {
    const serverDir = getServerDir(serverId);
    files.forEach(f => {
      const fullPath = path.join(serverDir, f.filepath);
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, f.content || '', 'utf8');
    });
  },

  // Запуск физического процесса сервера
  startServer: (server, callback) => {
    const serverId = server.id;
    const serverDir = getServerDir(serverId);

    if (runningProcesses.has(serverId)) {
      appendLog(serverId, "Сервер уже запущен.");
      return callback ? callback(null, { status: 'running' }) : null;
    }

    appendLog(serverId, `Запуск игрового сервера ${server.name} (${server.game_type})...`);

    let command = 'node';
    let args = ['-e', `console.log("Alany Server #${serverId} started on port ${server.port}"); setInterval(() => {}, 1000);`];

    // Определение стартового исполняемого файла в зависимости от типа игры
    if (server.game_type === 'minecraft') {
      const jarPath = path.join(serverDir, 'server.jar');
      if (!fs.existsSync(jarPath)) {
        fs.writeFileSync(jarPath, '# Mock Spigot/Paper Server Jar File\n');
      }
      command = 'java';
      args = [`-Xmx${server.ram_mb || 1024}M`, `-Xms256M`, `-jar`, `server.jar`, `nogui`];
    } else if (server.game_type.startsWith('gta')) {
      command = process.platform === 'win32' ? 'cmd.exe' : './samp03svr';
      if (process.platform === 'win32') {
        args = ['/c', 'echo SAMP Server Started && timeout /t 99999'];
      }
    }

    try {
      const proc = spawn(command, args, {
        cwd: serverDir,
        shell: true,
        env: { ...process.env, PORT: server.port }
      });

      runningProcesses.set(serverId, proc);

      proc.stdout.on('data', (data) => {
        appendLog(serverId, data.toString().trim());
      });

      proc.stderr.on('data', (data) => {
        appendLog(serverId, `[STDERR] ${data.toString().trim()}`);
      });

      proc.on('close', (code) => {
        appendLog(serverId, `Процесс сервера завершился с кодом ${code}`);
        runningProcesses.delete(serverId);
      });

      appendLog(serverId, `Игровой сервер успешно запущен на порту ${server.port}!`);
      if (callback) callback(null, { status: 'running' });
    } catch (err) {
      appendLog(serverId, `Ошибка запуска процесса: ${err.message}`);
      if (callback) callback(err, { status: 'stopped' });
    }
  },

  // Остановка физического процесса сервера
  stopServer: (serverId, callback) => {
    if (runningProcesses.has(serverId)) {
      const proc = runningProcesses.get(serverId);
      try {
        proc.kill();
      } catch (e) {}
      runningProcesses.delete(serverId);
      appendLog(serverId, "Сервер успешно остановлен.");
    } else {
      appendLog(serverId, "Сервер не был запущен.");
    }
    if (callback) callback(null, { status: 'stopped' });
  },

  // Отправка команды в консоль сервера
  sendConsoleCommand: (serverId, command) => {
    appendLog(serverId, `> ${command}`);
    if (runningProcesses.has(serverId)) {
      const proc = runningProcesses.get(serverId);
      if (proc.stdin) {
        proc.stdin.write(`${command}\n`);
      }
    }
  },

  // Получить логи консоли сервера
  getConsoleLogs: (serverId) => {
    return consoleLogs.get(serverId) || [`[${new Date().toLocaleTimeString()}] Консоль сервера готова.`];
  },

  // Проверить статус процесса
  isServerRunning: (serverId) => {
    return runningProcesses.has(serverId);
  }
};

module.exports = nodeDaemon;
