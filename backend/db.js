const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

console.log('Инициализация подключения к СУБД MySQL / MariaDB (alany_host)...');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'alany_user',
  password: process.env.DB_PASS || 'AlanyHost2026Pass!',
  database: process.env.DB_NAME || 'alany_host',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  decimalNumbers: true,
  charset: 'utf8mb4'
});

const db = {
  get: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    pool.query(sql, params || [], (err, results) => {
      if (err) return callback ? callback(err, null) : null;
      callback ? callback(null, results && results[0] ? results[0] : null) : null;
    });
  },

  all: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    pool.query(sql, params || [], (err, results) => {
      if (err) return callback ? callback(err, []) : null;
      callback ? callback(null, results || []) : null;
    });
  },

  run: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    // Совместимость с SQLite транзакциями и типами данных
    let cleanSql = sql
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
      .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
      .replace(/BEGIN TRANSACTION/gi, 'START TRANSACTION');

    pool.query(cleanSql, params || [], function(err, results) {
      const context = {
        lastID: results ? results.insertId : 0,
        changes: results ? results.affectedRows : 0
      };
      if (callback) callback.call(context, err);
    });
  },

  serialize: (callback) => {
    if (callback) callback();
  }
};

// Инициализация таблиц базы данных MariaDB / MySQL
const initDatabase = () => {
  const autoInc = 'INT AUTO_INCREMENT PRIMARY KEY';
  const datetime = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id ${autoInc},
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      balance DECIMAL(12,2) DEFAULT 0.00,
      role VARCHAR(50) DEFAULT 'user',
      avatar TEXT,
      telegram VARCHAR(255),
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createServersTable = `
    CREATE TABLE IF NOT EXISTS servers (
      id ${autoInc},
      user_id INT NOT NULL,
      node_id INT DEFAULT 1,
      game_type VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'stopped',
      ip_address VARCHAR(100) NOT NULL,
      port INT NOT NULL,
      ram_mb INT NOT NULL,
      cpu_cores INT NOT NULL,
      disk_gb INT NOT NULL,
      slots INT NOT NULL,
      price_per_day DECIMAL(10,2) NOT NULL,
      expires_at TIMESTAMP NULL,
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createServerFilesTable = `
    CREATE TABLE IF NOT EXISTS server_files (
      id ${autoInc},
      server_id INT NOT NULL,
      filepath VARCHAR(500) NOT NULL,
      content LONGTEXT NOT NULL,
      is_directory TINYINT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createTicketsTable = `
    CREATE TABLE IF NOT EXISTS tickets (
      id ${autoInc},
      user_id INT NOT NULL,
      subject VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'open',
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createTicketMessagesTable = `
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id ${autoInc},
      ticket_id INT NOT NULL,
      sender_id INT NOT NULL,
      message LONGTEXT NOT NULL,
      attachment LONGTEXT,
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createTransactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id ${autoInc},
      user_id INT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      type VARCHAR(50) NOT NULL,
      description TEXT,
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createPromocodesTable = `
    CREATE TABLE IF NOT EXISTS promocodes (
      id ${autoInc},
      code VARCHAR(100) UNIQUE NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      uses_count INT DEFAULT 0,
      max_uses INT DEFAULT 100,
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createWebhostsTable = `
    CREATE TABLE IF NOT EXISTS webhosts (
      id ${autoInc},
      user_id INT NOT NULL,
      domain VARCHAR(255) NOT NULL,
      tarif VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      ftp_host VARCHAR(100) NOT NULL,
      ftp_user VARCHAR(100) NOT NULL,
      ftp_pass VARCHAR(100) NOT NULL,
      mysql_db VARCHAR(100) NOT NULL,
      mysql_pass VARCHAR(100) NOT NULL,
      expires_at TIMESTAMP NULL,
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createNodesTable = `
    CREATE TABLE IF NOT EXISTS nodes (
      id ${autoInc},
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      ip_address VARCHAR(100) NOT NULL,
      port INT DEFAULT 5001,
      secret_token VARCHAR(255) DEFAULT 'alany_node_secret_key_2026',
      cpu_total INT DEFAULT 32,
      ram_total INT DEFAULT 128,
      ssd_total INT DEFAULT 2048,
      status VARCHAR(50) DEFAULT 'online',
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createServerDatabasesTable = `
    CREATE TABLE IF NOT EXISTS server_databases (
      id ${autoInc},
      server_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      user VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      host VARCHAR(100) DEFAULT '127.0.0.1',
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createServerBackupsTable = `
    CREATE TABLE IF NOT EXISTS server_backups (
      id ${autoInc},
      server_id INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      size VARCHAR(100) NOT NULL,
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createServerTasksTable = `
    CREATE TABLE IF NOT EXISTS server_tasks (
      id ${autoInc},
      server_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      action VARCHAR(100) NOT NULL,
      cron VARCHAR(100) NOT NULL,
      command TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at ${datetime}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const tables = [
    createUsersTable,
    createServersTable,
    createServerFilesTable,
    createTicketsTable,
    createTicketMessagesTable,
    createTransactionsTable,
    createPromocodesTable,
    createWebhostsTable,
    createNodesTable,
    createServerDatabasesTable,
    createServerBackupsTable,
    createServerTasksTable
  ];

  tables.forEach(tableSql => {
    db.run(tableSql);
  });

  // Автосоздание стартового администратора и локальной ноды в MySQL
  setTimeout(() => {
    db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
      if (!err && row && (row.count === 0 || row.count === '0' || row.count === 0)) {
        console.log("Инициализация начальных записей в MySQL (пользователь admin и user)...");
        const adminPassHash = bcrypt.hashSync('admin', 10);
        const userPassHash = bcrypt.hashSync('user', 10);

        db.run(
          `INSERT INTO users (username, email, password_hash, balance, role) VALUES (?, ?, ?, 1000000.0, 'admin')`,
          ['admin', 'admin@alany.host', adminPassHash]
        );

        db.run(
          `INSERT INTO users (username, email, password_hash, balance, role) VALUES (?, ?, ?, 500.0, 'user')`,
          ['user', 'user@alany.host', userPassHash]
        );
      }
    });

    db.get("SELECT COUNT(*) as count FROM nodes", [], (err, row) => {
      if (!err && row && (row.count === 0 || row.count === '0' || row.count === 0)) {
        console.log("Инициализация локальной KVM-ноды по умолчанию...");
        db.run(
          `INSERT INTO nodes (name, location, ip_address, port, secret_token, cpu_total, ram_total, ssd_total, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ['MSK-NODE-1 (Main Node)', 'Москва, РФ (Главный узел)', '127.0.0.1', 5001, 'alany_node_secret_key_2026', 64, 256, 4096, 'online']
        );
      }
    });
  }, 1000);
};

initDatabase();

module.exports = db;
