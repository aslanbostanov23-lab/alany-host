const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Генерация случайного IP
const getRandomIP = () => {
  const ips = ['185.189.15.112', '46.174.52.88', '95.213.255.4', '194.58.118.23'];
  return ips[Math.floor(Math.random() * ips.length)];
};

// Генерация случайного порта
const getRandomPort = () => {
  return Math.floor(Math.random() * 55535) + 10000;
};

// Функция для генерации дефолтных файлов сервера
const createDefaultFiles = (serverId, gameType, serverName, dbTransaction, callback) => {
  let files = [];
  if (gameType === 'minecraft') {
    files = [
      {
        filepath: 'server.properties',
        content: `# Minecraft server properties\nenable-jmx-monitoring=false\nrcon.port=25575\nlevel-name=world\nenable-query=false\nallow-flight=false\nserver-port=25565\nonline-mode=false\npvp=true\ndifficulty=easy\nmax-players=20\nmotd=Welcome to ${serverName}!`
      },
      {
        filepath: 'ops.json',
        content: `[\n  {\n    "uuid": "d324b170-df2b-42fa-90cd-94776269275b",\n    "name": "admin",\n    "level": 4,\n    "bypassesPlayerLimit": false\n  }\n]`
      },
      {
        filepath: 'spigot.yml',
        content: `settings:\n  debug: false\n  save-user-cache-on-stop-only: false\n  sample-count: 12\n  bungeecord: false\n  player-shuffle: 0\n  user-cache-size: 1000`
      }
    ];
  } else if (gameType.startsWith('gta')) {
    files = [
      {
        filepath: 'server.cfg',
        content: `echo Executing Server Config...\nlanmode 0\nrcon_password admin_pass_123\nmaxplayers 50\nport 7777\nhostname [RU] ${serverName} - SAMP Server\ngamemode0 grandlarc 1\nfilterscripts base gl_actions gl_property gl_mapicon\nplugins mysql sscanf streamer`
      },
      {
        filepath: 'scriptfiles/database.ini',
        content: `host = 127.0.0.1\nuser = root\npassword = pass\ndatabase = srv_db`
      }
    ];
  } else if (gameType === 'cs2') {
    files = [
      {
        filepath: 'game/csgo/cfg/server.cfg',
        content: `// CS2 Server Config\nhostname "${serverName} [128-tick]"\nrcon_password "cs2_super_pass"\nsv_cheats 0\nmp_roundtime 1.92\nmp_maxrounds 24\nmp_freezetime 15\nsv_lan 0`
      }
    ];
  } else if (gameType === 'scp') {
    files = [
      {
        filepath: 'config_gameplay.txt',
        content: `# SCP: Secret Laboratory Gameplay Config\nserver_name: ${serverName}\nmax_players: 40\nspawn_protect_time: 5\nauto_round_restart_time: 10\nfriendly_fire: false\nscp_079_power: 100`
      },
      {
        filepath: 'config_remoteadmin.txt',
        content: `# SCP Remote Admin Access Config\nRoles:\n  owner: Owner\n  admin: Admin\n\nMembers:\n  - 76561198000000000@steam: owner`
      }
    ];
  } else {
    files = [
      {
        filepath: 'config.json',
        content: `{\n  "server_name": "${serverName}",\n  "version": "1.0.0",\n  "max_connections": 10,\n  "debug": true\n}`
      }
    ];
  }

  let completed = 0;
  let hasError = false;

  if (files.length === 0) return callback(null);

  files.forEach(f => {
    dbTransaction.run(
      `INSERT INTO server_files (server_id, filepath, content, is_directory) VALUES (?, ?, ?, 0)`,
      [serverId, f.filepath, f.content],
      (err) => {
        if (err && !hasError) {
          hasError = true;
          return callback(err);
        }
        completed++;
        if (completed === files.length && !hasError) {
          callback(null);
        }
      }
    );
  });
};

// 1. Получить серверы пользователя
router.get('/', authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM servers WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка получения списка серверов' });
      }
      res.json(rows);
    }
  );
});

// 2. Получить конкретный сервер
router.get('/:id', authenticateToken, (req, res) => {
  db.get(
    `SELECT * FROM servers WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка получения деталей сервера' });
      }
      if (!row) {
        return res.status(404).json({ message: 'Сервер не найден' });
      }
      res.json(row);
    }
  );
});

// 3. Заказать сервер
router.post('/buy', authenticateToken, (req, res) => {
  const { game_type, name, ram_mb, cpu_cores, disk_gb, slots, duration_days } = req.body;

  if (!game_type || !name || !ram_mb || !cpu_cores || !disk_gb || !slots) {
    return res.status(400).json({ message: 'Все параметры конфигурации обязательны' });
  }

  const days = duration_days || 30;

  // Формула расчета цены за 30 дней:
  // RAM: 0.5 руб за 1 МБ
  // CPU: 100 руб за ядро
  // Disk: 5 руб за 1 ГБ
  // Slots: 2 руб за слот
  const baseMonthlyPrice = (ram_mb * 0.4) + (cpu_cores * 80) + (disk_gb * 4) + (slots * 1.5);
  const totalPrice = parseFloat(((baseMonthlyPrice / 30) * days).toFixed(2));

  // Получаем текущего пользователя для проверки баланса
  db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (userErr, user) => {
    if (userErr || !user) {
      return res.status(500).json({ message: 'Пользователь не найден' });
    }

    if (user.balance < totalPrice) {
      return res.status(400).json({ message: `Недостаточно средств. Необходимо: ${totalPrice} ₽, на вашем балансе: ${user.balance.toFixed(2)} ₽` });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Списываем баланс
      db.run(
        `UPDATE users SET balance = balance - ? WHERE id = ?`,
        [totalPrice, req.user.id],
        (updateErr) => {
          if (updateErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Ошибка списания средств' });
          }

          // Создаем транзакцию
          db.run(
            `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'payment', ?)`,
            [req.user.id, -totalPrice, `Аренда сервера ${name} (${game_type}) на ${days} дней`],
            (txErr) => {
              if (txErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Ошибка записи транзакции' });
              }

              const ip = getRandomIP();
              const port = getRandomPort();
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + days);

              // Создаем сервер
              db.run(
                `INSERT INTO servers (user_id, game_type, name, status, ip_address, port, ram_mb, cpu_cores, disk_gb, slots, price_per_day, expires_at)
                 VALUES (?, ?, ?, 'stopped', ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  req.user.id,
                  game_type,
                  name,
                  ip,
                  port,
                  ram_mb,
                  cpu_cores,
                  disk_gb,
                  slots,
                  parseFloat((baseMonthlyPrice / 30).toFixed(2)),
                  expiresAt.toISOString()
                ],
                function (srvErr) {
                  if (srvErr) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Ошибка создания сервера' });
                  }

                  const newServerId = this.lastID;

                  // Создаем дефолтные файлы
                  createDefaultFiles(newServerId, game_type, name, db, (fileErr) => {
                    if (fileErr) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ message: 'Ошибка создания конфигурационных файлов сервера' });
                    }

                    db.run('COMMIT');
                    res.status(201).json({
                      message: 'Сервер успешно заказан и готов к работе!',
                      serverId: newServerId
                    });
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});

// 4. Управление питанием (запуск, остановка, перезапуск)
router.post('/:id/power', authenticateToken, (req, res) => {
  const { action } = req.body; // 'start', 'stop', 'restart'
  const serverId = req.params.id;

  db.get(
    `SELECT * FROM servers WHERE id = ? AND user_id = ?`,
    [serverId, req.user.id],
    (err, server) => {
      if (err || !server) {
        return res.status(404).json({ message: 'Сервер не найден' });
      }

      let newStatus = 'stopped';
      if (action === 'start') {
        newStatus = 'starting';
      } else if (action === 'stop') {
        newStatus = 'stopped';
      } else if (action === 'restart') {
        newStatus = 'starting';
      } else {
        return res.status(400).json({ message: 'Неверное действие питания' });
      }

      db.run(
        `UPDATE servers SET status = ? WHERE id = ?`,
        [newStatus, serverId],
        (updErr) => {
          if (updErr) {
            return res.status(500).json({ message: 'Ошибка переключения питания' });
          }

          // Если статус 'starting', через 3 секунды симулируем автозапуск в 'running'
          if (newStatus === 'starting') {
            setTimeout(() => {
              db.run(`UPDATE servers SET status = 'running' WHERE id = ?`, [serverId]);
            }, 3000);
          }

          res.json({ message: `Команда ${action} успешно отправлена`, status: newStatus });
        }
      );
    }
  );
});

// 5. Установка модов / сборок на сервер с разворачиванием файлов в SQLite DB
router.post('/:id/install-mod', authenticateToken, (req, res) => {
  const serverId = req.params.id;
  const { modId, modName } = req.body;

  db.get(`SELECT * FROM servers WHERE id = ? AND user_id = ?`, [serverId, req.user.id], (err, server) => {
    if (err || !server) return res.status(404).json({ message: 'Сервер не найден' });

    let modFiles = [];
    const dbName = `srv_db_${serverId}_${modId || 'mod'}`;
    const dbUser = `u_${serverId}_${modId || 'mod'}`;
    const dbPass = Math.random().toString(36).slice(-8);

    if (modId === 'diamond') {
      modFiles = [
        {
          filepath: 'server.cfg',
          content: `echo Executing Diamond RP Server Config...\nlanmode 0\nrcon_password diamond_pass_99\nmaxplayers ${server.slots || 100}\nport ${server.port}\nhostname [RU] Diamond RolePlay | Alany Host\ngamemode0 diamond_rp 1\nfilterscripts base gl_actions gl_property\nplugins mysql sscanf streamer cjson`
        },
        {
          filepath: 'gamemodes/diamond_rp.pwn',
          content: `/*\n * Diamond RolePlay Official Server Core Gamemode\n * Compiled for Alany Host Dedicated Server\n */\n#include <a_samp>\n#include <a_mysql>\n#include <sscanf2>\n#include <streamer>\n\n#define COLOR_GREEN 0x33AA33AA\n#define COLOR_RED 0xAA3333AA\n\nnew MySQL: g_SQL;\n\npublic OnGameModeInit()\n{\n    SetGameModeText("Diamond RP v6.4");\n    ShowPlayerMarkers(PLAYER_MARKERS_MODE_GLOBAL);\n    ShowNameTags(1);\n    EnableStuntBonusForAll(0);\n    \n    // Подключение к базе данных MySQL\n    g_SQL = mysql_connect("${dbName}", "${dbUser}", "127.0.0.1", "${dbPass}");\n    printf("[Diamond RP]: Connected to MySQL Database: ${dbName}");\n    return 1;\n}`
        },
        {
          filepath: 'scriptfiles/mysql.ini',
          content: `hostname = 127.0.0.1\nusername = ${dbUser}\npassword = ${dbPass}\ndatabase = ${dbName}\nport = 3306`
        }
      ];
    } else if (modId === 'arizona') {
      modFiles = [
        {
          filepath: 'server.cfg',
          content: `echo Executing Arizona RP Server Config...\nlanmode 0\nrcon_password arizona_rcon_123\nmaxplayers ${server.slots || 500}\nport ${server.port}\nhostname [RU] Arizona RP | Alany Host\ngamemode0 arizona_v2 1\nfilterscripts base arizona_bots\nplugins mysql sscanf streamer pawncmd`
        },
        {
          filepath: 'gamemodes/arizona_v2.pwn',
          content: `/*\n * Arizona RolePlay Modern Gamemode\n * Systems: Inventory, Business, Custom Cars, BattlePass\n */\n#include <a_samp>\n#include <a_mysql>\n\npublic OnGameModeInit()\n{\n    SetGameModeText("Arizona RP 2026");\n    printf("[Arizona RP]: Server Core Active. Loaded 14500 static objects.");\n    return 1;\n}`
        },
        {
          filepath: 'scriptfiles/database.ini',
          content: `host = 127.0.0.1\nuser = ${dbUser}\npass = ${dbPass}\ndb = ${dbName}`
        }
      ];
    } else if (modId === 'spigot_core') {
      modFiles = [
        {
          filepath: 'server.properties',
          content: `# Minecraft Spigot 1.20.4 Config\nserver-port=${server.port}\nmax-players=${server.slots || 50}\nmotd=Welcome to ${server.name} [Spigot Core]\nview-distance=10\nonline-mode=false\nenable-rcon=true\nrcon.password=spigot_rcon_pass`
        },
        {
          filepath: 'spigot.yml',
          content: `config-version: 12\nsettings:\n  debug: false\n  bungeecord: false\n  restart-on-crash: true\n  restart-script: ./start.sh\n  sample-count: 12\nworld-settings:\n  default:\n    verbose: false\n    mob-spawn-range: 6\n    growth:\n      cactus-modifier: 100\n      cane-modifier: 100`
        },
        {
          filepath: 'plugins/Essentials/config.yml',
          content: `# EssentialsX Configuration File\nops-name-color: 'c'\nnickname-prefix: '~'\nmax-nick-length: 15\nchange-displayname: true\nteleport-cooldown: 3\nauto-afk: 300\nkits:\n  start:\n    delay: 86400\n    items:\n      - 272 1\n      - 273 1\n      - 274 1\n      - 275 1\n      - 364 16`
        },
        {
          filepath: 'plugins/LuckPerms/config.yml',
          content: `server: global\nstorage-method: h2\nsplit-storage:\n  enabled: false\nuser-allow-invalid-usernames: false`
        }
      ];
    } else if (modId === 'skyblock') {
      modFiles = [
        {
          filepath: 'server.properties',
          content: `server-port=${server.port}\nlevel-name=skyblock_world\nlevel-type=FLAT\ngenerator-settings=3;1*minecraft:air;1;\nmotd=SkyBlock Island Survival!`
        },
        {
          filepath: 'plugins/ASkyBlock/config.yml',
          content: `island:\n  distance: 110\n  protectionRange: 100\n  startLevel: 1\n  resetLimit: 3\n  schematicName: island`
        }
      ];
    } else {
      modFiles = [
        {
          filepath: 'config/modpack.json',
          content: `{\n  "modpack_name": "${modName || 'Custom Mod'}",\n  "version": "1.0.0",\n  "installed_at": "${new Date().toISOString()}",\n  "auto_start": true\n}`
        }
      ];
    }

    // Записываем БД в SQLite
    db.run(
      `INSERT INTO server_databases (server_id, name, user, password) VALUES (?, ?, ?, ?)`,
      [serverId, dbName, dbUser, dbPass]
    );

    // Удаляем прошлые файлы и записываем новые в server_files
    db.run(`DELETE FROM server_files WHERE server_id = ?`, [serverId], () => {
      let inserted = 0;
      modFiles.forEach(f => {
        db.run(
          `INSERT INTO server_files (server_id, filepath, content, is_directory) VALUES (?, ?, ?, 0)`,
          [serverId, f.filepath, f.content],
          () => {
            inserted++;
            if (inserted === modFiles.length) {
              res.json({ message: `Сборка ${modName} успешно установлена!`, filesCount: inserted });
            }
          }
        );
      });
    });
  });
});

// 6. Симуляция графиков потребления ресурсов
router.get('/:id/stats', authenticateToken, (req, res) => {
  const serverId = req.params.id;

  db.get(
    `SELECT * FROM servers WHERE id = ? AND user_id = ?`,
    [serverId, req.user.id],
    (err, server) => {
      if (err || !server) {
        return res.status(404).json({ message: 'Сервер не найден' });
      }

      let cpu = 0;
      let ram = 0;
      let players = 0;

      if (server.status === 'running') {
        // Симуляция динамической нагрузки
        cpu = Math.floor(Math.random() * 45) + 15; // 15% - 60%
        ram = Math.floor(server.ram_mb * (0.4 + Math.random() * 0.25)); // 40% - 65% ОЗУ
        players = Math.floor(Math.random() * (server.slots / 2));
      } else if (server.status === 'starting') {
        cpu = 85; // Пик при запуске
        ram = Math.floor(server.ram_mb * 0.3);
        players = 0;
      }

      res.json({
        cpu: parseFloat(cpu.toFixed(1)),
        ram: Math.round(ram),
        ram_max: server.ram_mb,
        players: players,
        slots: server.slots,
        disk: Math.round(server.disk_gb * 0.25 * 1024), // в МБ
        disk_max: server.disk_gb * 1024
      });
    }
  );
});

// 6. Получить файлы сервера
router.get('/:id/files', authenticateToken, (req, res) => {
  db.all(
    `SELECT id, filepath, is_directory FROM server_files WHERE server_id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка получения файлов' });
      }
      res.json(rows);
    }
  );
});

// 7. Прочесть файл сервера
router.get('/:id/files/read', authenticateToken, (req, res) => {
  const { path: filepath } = req.query;
  db.get(
    `SELECT content FROM server_files WHERE server_id = ? AND filepath = ?`,
    [req.params.id, filepath],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка чтения файла' });
      }
      if (!row) {
        return res.status(404).json({ message: 'Файл не найден' });
      }
      res.json({ content: row.content });
    }
  );
});

// 8. Сохранить файл сервера
router.post('/:id/files/write', authenticateToken, (req, res) => {
  const { filepath, content } = req.body;

  if (!filepath) {
    return res.status(400).json({ message: 'Путь к файлу обязателен' });
  }

  db.get(
    `SELECT id FROM server_files WHERE server_id = ? AND filepath = ?`,
    [req.params.id, filepath],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка поиска файла' });
      }

      if (row) {
        // Обновляем
        db.run(
          `UPDATE server_files SET content = ? WHERE server_id = ? AND filepath = ?`,
          [content, req.params.id, filepath],
          (updErr) => {
            if (updErr) return res.status(500).json({ message: 'Ошибка сохранения файла' });
            res.json({ message: 'Файл успешно сохранен' });
          }
        );
      } else {
        // Создаем
        db.run(
          `INSERT INTO server_files (server_id, filepath, content, is_directory) VALUES (?, ?, ?, 0)`,
          [req.params.id, filepath, content],
          (insErr) => {
            if (insErr) return res.status(500).json({ message: 'Ошибка создания файла' });
            res.json({ message: 'Файл успешно создан и сохранен' });
          }
        );
      }
    }
  );
});

// 9. Удалить файл сервера
router.post('/:id/files/delete', authenticateToken, (req, res) => {
  const { filepath } = req.body;
  db.run(
    `DELETE FROM server_files WHERE server_id = ? AND filepath = ?`,
    [req.params.id, filepath],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка удаления файла' });
      }
      res.json({ message: 'Файл успешно удален' });
    }
  );
});

// 10. Переустановка сервера (дефолтные файлы)
router.post('/:id/reinstall', authenticateToken, (req, res) => {
  const serverId = req.params.id;

  db.get(
    `SELECT * FROM servers WHERE id = ? AND user_id = ?`,
    [serverId, req.user.id],
    (err, server) => {
      if (err || !server) {
        return res.status(404).json({ message: 'Сервер не найден' });
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`DELETE FROM server_files WHERE server_id = ?`, [serverId], (delErr) => {
          if (delErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Ошибка сброса файлов' });
          }

          createDefaultFiles(serverId, server.game_type, server.name, db, (fileErr) => {
            if (fileErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Ошибка создания новых файлов' });
            }

            // Выключаем сервер при переустановке
            db.run(`UPDATE servers SET status = 'stopped' WHERE id = ?`, [serverId]);
            db.run('COMMIT');
            res.json({ message: 'Сервер успешно переустановлен, файлы сброшены к дефолтным.' });
          });
        });
      });
    }
  );
});

// 11. Симуляция консоли сервера
router.get('/:id/console', authenticateToken, (req, res) => {
  const serverId = req.params.id;

  db.get(
    `SELECT * FROM servers WHERE id = ? AND user_id = ?`,
    [serverId, req.user.id],
    (err, server) => {
      if (err || !server) {
        return res.status(404).json({ message: 'Сервер не найден' });
      }

      const timestamp = () => new Date().toLocaleTimeString();

      if (server.status === 'stopped') {
        return res.json({
          logs: [
            `[${timestamp()}] [INFO] Server is currently offline. Press "Start" to boot the server.`
          ]
        });
      }

      if (server.status === 'starting') {
        return res.json({
          logs: [
            `[${timestamp()}] [INFO] Booting server core...`,
            `[${timestamp()}] [INFO] Loading resources, maps and engine config...`,
            `[${timestamp()}] [INFO] Loading server virtual file system...`,
            `[${timestamp()}] [INFO] Binding port ${server.port}...`
          ]
        });
      }

      // Если running, симулируем логи
      let logs = [];
      if (server.game_type === 'minecraft') {
        logs = [
          `[${timestamp()}] [Server thread/INFO]: Starting minecraft server version 1.20.1`,
          `[${timestamp()}] [Server thread/INFO]: Loading properties`,
          `[${timestamp()}] [Server thread/INFO]: Default game type: SURVIVAL`,
          `[${timestamp()}] [Server thread/INFO]: Generating keypair`,
          `[${timestamp()}] [Server thread/INFO]: Starting Minecraft server on ${server.ip_address}:${server.port}`,
          `[${timestamp()}] [Server thread/INFO]: Preparing level "world"`,
          `[${timestamp()}] [Server thread/INFO]: Preparing start region for dimension minecraft:overworld`,
          `[${timestamp()}] [Server thread/INFO]: Time elapsed: 1421 ms`,
          `[${timestamp()}] [Server thread/INFO]: Done (1.8s)! For help, type "help"`,
          `[${timestamp()}] [Server thread/INFO]: Player Steve connected from 127.0.0.1:5321`,
          `[${timestamp()}] [Server thread/INFO]: Steve joined the game`,
          `[${timestamp()}] [Server thread/INFO]: Steve issued server command: /spawn`,
          `[${timestamp()}] [Server/INFO]: [Steve: set world spawn point to current location]`
        ];
      } else if (server.game_type.startsWith('gta')) {
        logs = [
          `[${timestamp()}] `,
          `[${timestamp()}] Server Plugins: Loading mysql.dll ... Success`,
          `[${timestamp()}] Server Plugins: Loading streamer.dll ... Success`,
          `[${timestamp()}] Filterscripts: Loading base ... Success`,
          `[${timestamp()}] Filterscripts: Loading gl_property ... Success`,
          `[${timestamp()}] Gamemode: grandlarc by SAMP Team loaded.`,
          `[${timestamp()}] Started SAMP server on port ${server.port}`,
          `[${timestamp()}] [Connection] Incoming connection from Aslan_Alany[id: 0]`,
          `[${timestamp()}] [Join] Aslan_Alany has joined the server (0:127.0.0.1)`,
          `[${timestamp()}] [Login] Aslan_Alany logged in successfully`
        ];
      } else {
        logs = [
          `[${timestamp()}] [Engine] Loading virtual core configuration...`,
          `[${timestamp()}] [Engine] Port ${server.port} bound successfully.`,
          `[${timestamp()}] [INFO] Active tickrate: 128.0 hz`,
          `[${timestamp()}] [INFO] Server started successfully.`,
          `[${timestamp()}] [Connection] 127.0.0.1 connected.`
        ];
      }

      res.json({ logs });
    }
  );
});

// ══════════════════════════════════════════════════════════════
// 10. РАБОТА С БАЗАМИ ДАННЫХ MYSQL В SQLITE DB
// ══════════════════════════════════════════════════════════════
router.get('/:id/databases', authenticateToken, (req, res) => {
  const serverId = req.params.id;
  db.all(`SELECT * FROM server_databases WHERE server_id = ? ORDER BY created_at DESC`, [serverId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Ошибка получения баз данных' });
    if (rows.length === 0) {
      // Создаем дефолтную базу MySQL если нет
      const dbName = `srv_db_${serverId}`;
      const dbUser = `u_${serverId}`;
      const dbPass = Math.random().toString(36).slice(-10);
      db.run(
        `INSERT INTO server_databases (server_id, name, user, password) VALUES (?, ?, ?, ?)`,
        [serverId, dbName, dbUser, dbPass],
        function() {
          db.all(`SELECT * FROM server_databases WHERE server_id = ?`, [serverId], (err2, newRows) => {
            res.json(newRows);
          });
        }
      );
    } else {
      res.json(rows);
    }
  });
});

router.post('/:id/databases', authenticateToken, (req, res) => {
  const serverId = req.params.id;
  const { dbName } = req.body;
  const name = dbName ? `srv_${dbName}` : `srv_db_${serverId}_${Date.now().toString().slice(-4)}`;
  const user = `u_${serverId}_${Math.floor(Math.random() * 900 + 100)}`;
  const pass = Math.random().toString(36).slice(-10);

  db.run(
    `INSERT INTO server_databases (server_id, name, user, password) VALUES (?, ?, ?, ?)`,
    [serverId, name, user, pass],
    function(err) {
      if (err) return res.status(500).json({ message: 'Ошибка создания базы данных' });
      res.status(201).json({ id: this.lastID, name, user, password: pass, host: '127.0.0.1' });
    }
  );
});

router.delete('/:id/databases/:dbId', authenticateToken, (req, res) => {
  const { dbId } = req.params;
  db.run(`DELETE FROM server_databases WHERE id = ?`, [dbId], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка удаления базы данных' });
    res.json({ message: 'База данных успешно удалена!' });
  });
});

// ══════════════════════════════════════════════════════════════
// 11. РАБОТА С БЭКАПАМИ (РЕЗЕРВНЫМИ КОПИЯМИ) В SQLITE DB
// ══════════════════════════════════════════════════════════════
router.get('/:id/backups', authenticateToken, (req, res) => {
  const serverId = req.params.id;
  db.all(`SELECT * FROM server_backups WHERE server_id = ? ORDER BY created_at DESC`, [serverId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Ошибка получения бэкапов' });
    if (rows.length === 0) {
      // Добавляем стартовый автоматический бэкап
      const initFilename = `backup_server_${serverId}_init.tar.gz`;
      db.run(
        `INSERT INTO server_backups (server_id, filename, size) VALUES (?, ?, '118 MB')`,
        [serverId, initFilename],
        function() {
          db.all(`SELECT * FROM server_backups WHERE server_id = ?`, [serverId], (err2, newRows) => {
            res.json(newRows);
          });
        }
      );
    } else {
      res.json(rows);
    }
  });
});

router.post('/:id/backups', authenticateToken, (req, res) => {
  const serverId = req.params.id;
  const dateStr = new Date().toISOString().slice(0,10);
  const filename = `backup_server_${serverId}_${dateStr}_${Date.now().toString().slice(-4)}.tar.gz`;
  const size = `${Math.floor(Math.random() * 80 + 100)} MB`;

  db.run(
    `INSERT INTO server_backups (server_id, filename, size) VALUES (?, ?, ?)`,
    [serverId, filename, size],
    function(err) {
      if (err) return res.status(500).json({ message: 'Ошибка создания резервной копии' });
      res.status(201).json({ id: this.lastID, filename, size, created_at: new Date().toISOString() });
    }
  );
});

router.delete('/:id/backups/:backupId', authenticateToken, (req, res) => {
  const { backupId } = req.params;
  db.run(`DELETE FROM server_backups WHERE id = ?`, [backupId], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка удаления бэкапа' });
    res.json({ message: 'Резервная копия удалена!' });
  });
});

// ══════════════════════════════════════════════════════════════
// 12. РАБОТА С ПЛАНИРОВЩИКОМ ЗАДАЧ В SQLITE DB
// ══════════════════════════════════════════════════════════════
router.get('/:id/tasks', authenticateToken, (req, res) => {
  const serverId = req.params.id;
  db.all(`SELECT * FROM server_tasks WHERE server_id = ? ORDER BY created_at DESC`, [serverId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Ошибка получения задач' });
    if (rows.length === 0) {
      // Инициализируем стандартные задачи
      const defaultTasks = [
        { name: 'Ежедневный автоматический рестарт', action: 'restart', cron: 'Каждый день в 05:00', command: '' },
        { name: 'Автоматическое сохранение мира', action: 'command', cron: 'Каждые 2 часа', command: '/save-all' }
      ];
      defaultTasks.forEach(t => {
        db.run(
          `INSERT INTO server_tasks (server_id, name, action, cron, command, status) VALUES (?, ?, ?, ?, ?, 'active')`,
          [serverId, t.name, t.action, t.cron, t.command]
        );
      });
      setTimeout(() => {
        db.all(`SELECT * FROM server_tasks WHERE server_id = ?`, [serverId], (err2, newRows) => {
          res.json(newRows);
        });
      }, 300);
    } else {
      res.json(rows);
    }
  });
});

router.post('/:id/tasks', authenticateToken, (req, res) => {
  const serverId = req.params.id;
  const { name, action, cron, command } = req.body;
  if (!name) return res.status(400).json({ message: 'Название задачи обязательно' });

  db.run(
    `INSERT INTO server_tasks (server_id, name, action, cron, command, status) VALUES (?, ?, ?, ?, ?, 'active')`,
    [serverId, name, action || 'restart', cron || 'Каждые 12 часов', command || ''],
    function(err) {
      if (err) return res.status(500).json({ message: 'Ошибка создания задачи' });
      res.status(201).json({ id: this.lastID, name, action, cron, command, status: 'active' });
    }
  );
});

router.delete('/:id/tasks/:taskId', authenticateToken, (req, res) => {
  const { taskId } = req.params;
  db.run(`DELETE FROM server_tasks WHERE id = ?`, [taskId], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка удаления задачи' });
    res.json({ message: 'Задача удалена' });
  });
});

// 13. Автоустановка модов и фреймворков (EXILED SCP, Samp Diamond/Arizona)
router.post('/:id/install-mod', authenticateToken, (req, res) => {
  const { modId } = req.body;
  const serverId = req.params.id;

  db.get(`SELECT * FROM servers WHERE id = ? AND user_id = ?`, [serverId, req.user.id], (err, server) => {
    if (err || !server) return res.status(404).json({ message: 'Сервер не найден' });

    if (modId === 'scp_exiled' || modId === 'scp_rp' || modId === 'scp_classic') {
      const exiledPlugin = `[ExMod-Team/EXILED Loader Plugin v9.14.2]\nServerPort: ${server.port}\nAutoUpdate: true\nEnableDebug: false\nConfigVersion: 9.14.2`;
      const exiledConfig = `exiled:\n  version: 9.14.2\n  enable_events: true\n  admin_tools: true\n  custom_items: true\n  teleport_commands: true\n  auto_restart_on_crash: true`;

      db.run(`INSERT INTO server_files (server_id, filepath, content, is_directory) VALUES (?, 'EXILED/Plugins/Exiled.Events.dll', ?, 0)`, [serverId, exiledPlugin]);
      db.run(`INSERT INTO server_files (server_id, filepath, content, is_directory) VALUES (?, 'EXILED/Configs/config.yml', ?, 0)`, [serverId, exiledConfig]);
      db.run(`UPDATE server_files SET content = 'server_name: SCP Exiled RP Complex [v9.14.2]\\nserver_ip: 127.0.0.1\\nmax_players: 40' WHERE server_id = ? AND filepath = 'config_gameplay.txt'`, [serverId]);

      return res.json({ message: 'Официальный фреймворк ExMod-Team/EXILED v9.14.2 и плагины SCP успешно инсталлированы!' });
    }

    res.json({ message: `Мод ${modId} успешно установлен на сервер!` });
  });
});

module.exports = router;

