const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const dbInstance = new sqlite3.Database(dbPath);

const db = {
  get: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    dbInstance.get(sql, params, callback);
  },

  all: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    dbInstance.all(sql, params, callback);
  },

  run: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    dbInstance.run(sql, params, function(err) {
      if (callback) callback.call(this, err);
    });
  },

  serialize: (callback) => {
    dbInstance.serialize(callback);
  }
};

// Инициализация таблиц базы данных
const initDatabase = () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      balance REAL DEFAULT 0,
      role VARCHAR(50) DEFAULT 'user',
      avatar TEXT,
      telegram VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createServersTable = `
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INT NOT NULL,
      game_type VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'stopped',
      ip_address VARCHAR(100) NOT NULL,
      port INT NOT NULL,
      ram_mb INT NOT NULL,
      cpu_cores INT NOT NULL,
      disk_gb INT NOT NULL,
      slots INT NOT NULL,
      price_per_day REAL NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createServerFilesTable = `
    CREATE TABLE IF NOT EXISTS server_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INT NOT NULL,
      filepath VARCHAR(500) NOT NULL,
      content LONGTEXT NOT NULL,
      is_directory INT DEFAULT 0
    )
  `;

  const createTicketsTable = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INT NOT NULL,
      subject VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createTicketMessagesTable = `
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INT NOT NULL,
      sender_id INT NOT NULL,
      message LONGTEXT NOT NULL,
      attachment LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createTransactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INT NOT NULL,
      amount REAL NOT NULL,
      type VARCHAR(50) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createPromocodesTable = `
    CREATE TABLE IF NOT EXISTS promocodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code VARCHAR(100) UNIQUE NOT NULL,
      amount REAL NOT NULL,
      uses_count INT DEFAULT 0,
      max_uses INT DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createWebhostsTable = `
    CREATE TABLE IF NOT EXISTS webhosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INT NOT NULL,
      domain VARCHAR(255) NOT NULL,
      tarif VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      ftp_host VARCHAR(100) NOT NULL,
      ftp_user VARCHAR(100) NOT NULL,
      ftp_pass VARCHAR(100) NOT NULL,
      mysql_db VARCHAR(100) NOT NULL,
      mysql_pass VARCHAR(100) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createNodesTable = `
    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      ip_address VARCHAR(100) NOT NULL,
      cpu_total INT NOT NULL,
      ram_total INT NOT NULL,
      ssd_total INT NOT NULL,
      status VARCHAR(50) DEFAULT 'online',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createServerDatabasesTable = `
    CREATE TABLE IF NOT EXISTS server_databases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      user VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      host VARCHAR(100) DEFAULT '127.0.0.1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createServerBackupsTable = `
    CREATE TABLE IF NOT EXISTS server_backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      size VARCHAR(100) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createServerTasksTable = `
    CREATE TABLE IF NOT EXISTS server_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      action VARCHAR(100) NOT NULL,
      cron VARCHAR(100) NOT NULL,
      command TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createUsersTable);
  db.run(createServersTable);
  db.run(createServerFilesTable);
  db.run(createTicketsTable);
  db.run(createTicketMessagesTable);
  db.run(createTransactionsTable);
  db.run(createPromocodesTable);
  db.run(createWebhostsTable);
  db.run(createNodesTable);
  db.run(createServerDatabasesTable);
  db.run(createServerBackupsTable);
  db.run(createServerTasksTable);

  // Инициализация администраторов и тестовых пользователей
  setTimeout(() => {
    db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
      if (!err && row && (row.count === 0 || row.count === '0')) {
        console.log("Создаем дефолтных пользователей в базе данных...");
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
      if (!err && row && (row.count === 0 || row.count === '0')) {
        db.run(`INSERT INTO nodes (name, location, ip_address, cpu_total, ram_total, ssd_total, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['MSK-NODE-1 (DataPro)', 'Москва, РФ', '194.58.118.23', 64, 256, 4096, 'online']
        );
        db.run(`INSERT INTO nodes (name, location, ip_address, cpu_total, ram_total, ssd_total, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['MSK-NODE-2 (IX-Cellent)', 'Москва, РФ', '185.189.15.112', 32, 128, 2048, 'online']
        );
        db.run(`INSERT INTO nodes (name, location, ip_address, cpu_total, ram_total, ssd_total, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['WEB-HOST-1 (Selectel)', 'Москва, РФ', '46.174.52.88', 16, 64, 1024, 'online']
        );
      }
    });
  }, 500);
};

initDatabase();

module.exports = db;
