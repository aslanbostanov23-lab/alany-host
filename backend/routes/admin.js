const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Middleware для проверки прав администратора и техподдержки
const requireAdminOrSupport = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'support')) {
    next();
  } else {
    res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора или поддержки' });
  }
};

// Применяем авторизацию
router.use(authenticateToken, requireAdminOrSupport);

// 1. Получить общую статистику хостинга
router.get('/stats', (req, res) => {
  const stats = {};

  db.get(`SELECT COUNT(*) as count FROM users`, (err, userRow) => {
    if (err) return res.status(500).json({ message: 'Ошибка получения статистики' });
    stats.total_users = userRow?.count || 0;

    db.get(`SELECT COUNT(*) as count FROM servers`, (err2, srvRow) => {
      if (err2) return res.status(500).json({ message: 'Ошибка получения статистики' });
      stats.total_servers = srvRow?.count || 0;

      db.get(`SELECT COUNT(*) as count FROM servers WHERE status = 'running'`, (err3, actSrvRow) => {
        if (err3) return res.status(500).json({ message: 'Ошибка получения статистики' });
        stats.active_servers = actSrvRow?.count || 0;

        db.get(`SELECT SUM(amount) as sum FROM transactions WHERE type = 'refill'`, (err4, refillRow) => {
          if (err4) return res.status(500).json({ message: 'Ошибка получения статистики' });
          stats.total_refills = refillRow?.sum || 0;

          db.get(`SELECT COUNT(*) as count FROM tickets WHERE status = 'open'`, (err5, tktRow) => {
            stats.open_tickets = tktRow?.count || 0;
            res.json(stats);
          });
        });
      });
    });
  });
});

// 2. Список всех пользователей
router.get('/users', (req, res) => {
  db.all(
    `SELECT id, username, email, balance, role, created_at FROM users ORDER BY created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Ошибка получения списка пользователей' });
      res.json(rows || []);
    }
  );
});

// 3. Изменение баланса пользователя администратором
router.post('/users/:id/balance', (req, res) => {
  const { amount, action } = req.body;
  const userId = req.params.id;
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount)) {
    return res.status(400).json({ message: 'Неверный формат суммы' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    let sql = (action === 'add') 
      ? `UPDATE users SET balance = balance + ? WHERE id = ?` 
      : `UPDATE users SET balance = ? WHERE id = ?`;
    let params = [parsedAmount, userId];

    db.run(sql, params, function (err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Ошибка изменения баланса пользователя' });
      }

      db.run(
        `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'refill', ?)`,
        [userId, parsedAmount, `Корректировка баланса администратором (${action === 'add' ? 'Начисление' : 'Установка'})`],
        (txErr) => {
          if (txErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Ошибка записи транзакции' });
          }

          db.run('COMMIT');
          res.json({ message: 'Баланс успешно обновлен' });
        }
      );
    });
  });
});

// 4. Смена роли пользователя (admin / user / support)
router.post('/users/:id/role', (req, res) => {
  const { role } = req.body;
  db.run(`UPDATE users SET role = ? WHERE id = ?`, [role, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка изменения роли' });
    res.json({ message: 'Роль пользователя изменена' });
  });
});

// 5. Полноценное редактирование пользователя (Имя, Email, Роль, Баланс, Пароль)
router.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const { username, email, role, balance, password } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: 'Имя пользователя и email обязательны' });
  }

  const bcrypt = require('bcryptjs');

  if (password && password.trim().length > 0) {
    const passwordHash = bcrypt.hashSync(password.trim(), 10);
    db.run(
      `UPDATE users SET username = ?, email = ?, role = ?, balance = ?, password_hash = ? WHERE id = ?`,
      [username, email, role || 'user', parseFloat(balance) || 0.0, passwordHash, userId],
      (err) => {
        if (err) return res.status(500).json({ message: 'Ошибка обновления пользователя с паролем' });
        res.json({ message: 'Профиль пользователя и пароль успешно обновлены!' });
      }
    );
  } else {
    db.run(
      `UPDATE users SET username = ?, email = ?, role = ?, balance = ? WHERE id = ?`,
      [username, email, role || 'user', parseFloat(balance) || 0.0, userId],
      (err) => {
        if (err) return res.status(500).json({ message: 'Ошибка обновления пользователя' });
        res.json({ message: 'Профиль пользователя успешно обновлен!' });
      }
    );
  }
});

// 6. Удаление пользователя
router.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  if (parseInt(userId, 10) === req.user.id) {
    return res.status(400).json({ message: 'Вы не можете удалить собственный аккаунт' });
  }

  db.run(`DELETE FROM users WHERE id = ?`, [userId], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка удаления пользователя' });
    res.json({ message: 'Пользователь удален' });
  });
});

// 6. Все серверы (для админа)
router.get('/servers', (req, res) => {
  db.all(
    `SELECT s.*, u.username as owner_name 
     FROM servers s 
     JOIN users u ON s.user_id = u.id 
     ORDER BY s.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Ошибка получения серверов' });
      res.json(rows || []);
    }
  );
});

// 7. Действие над сервером (start/stop/restart)
router.post('/servers/:id/action', (req, res) => {
  const serverId = req.params.id;
  const { action } = req.body; // 'start' | 'stop' | 'restart'

  let newStatus = 'stopped';
  if (action === 'start' || action === 'restart') newStatus = 'running';

  db.run(`UPDATE servers SET status = ? WHERE id = ?`, [newStatus, serverId], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка обновления статуса сервера' });
    res.json({ message: `Статус сервера изменен на ${newStatus}` });
  });
});

// 8. Удаление сервера
router.delete('/servers/:id', (req, res) => {
  const serverId = req.params.id;
  db.run(`DELETE FROM servers WHERE id = ?`, [serverId], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка удаления сервера' });
    res.json({ message: 'Сервер удален' });
  });
});

// 9. Получить список промокодов
router.get('/promo', (req, res) => {
  db.all(`SELECT * FROM promocodes ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Ошибка получения промокодов' });
    res.json(rows || []);
  });
});

// 10. Создать промокод
router.post('/promo', (req, res) => {
  const { code, amount, max_uses } = req.body;
  if (!code || !amount) {
    return res.status(400).json({ message: 'Укажите код и сумму бонуса' });
  }

  const cleanCode = code.toUpperCase().trim();
  db.run(
    `INSERT INTO promocodes (code, amount, max_uses) VALUES (?, ?, ?)`,
    [cleanCode, parseFloat(amount), max_uses || 100],
    (err) => {
      if (err) return res.status(400).json({ message: 'Промокод с таким названием уже существует' });
      res.json({ message: 'Промокод успешно создан' });
    }
  );
});

// 11. Удалить промокод
router.delete('/promo/:id', (req, res) => {
  db.run(`DELETE FROM promocodes WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка удаления промокода' });
    res.json({ message: 'Промокод удален' });
  });
});

// 12. Получить тикеты
router.get('/tickets', (req, res) => {
  db.all(
    `SELECT t.*, u.username as creator_name 
     FROM tickets t 
     JOIN users u ON t.user_id = u.id 
     ORDER BY t.status DESC, t.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Ошибка получения тикетов' });
      res.json(rows || []);
    }
  );
});

// 13. Закрыть тикет
router.post('/tickets/:id/resolve', (req, res) => {
  db.run(`UPDATE tickets SET status = 'resolved' WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка закрытия тикета' });
    res.json({ message: 'Тикет закрыт' });
  });
});

// 15. Управление KVM-Нодами хостинга
router.get('/nodes', (req, res) => {
  db.all(`SELECT * FROM nodes ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Ошибка получения списка нод' });
    res.json(rows || []);
  });
});

router.post('/nodes', (req, res) => {
  const { name, location, ip_address, cpu_total, ram_total, ssd_total } = req.body;
  if (!name || !ip_address) return res.status(400).json({ message: 'Имя и IP ноды обязательны' });

  db.run(
    `INSERT INTO nodes (name, location, ip_address, cpu_total, ram_total, ssd_total, status)
     VALUES (?, ?, ?, ?, ?, ?, 'online')`,
    [
      name,
      location || 'Москва, РФ',
      ip_address,
      parseInt(cpu_total) || 32,
      parseInt(ram_total) || 128,
      parseInt(ssd_total) || 2048
    ],
    function(err) {
      if (err) return res.status(500).json({ message: 'Ошибка добавления ноды' });
      res.status(201).json({ id: this.lastID, message: 'Новый KVM-узел успешно добавлен!' });
    }
  );
});

router.delete('/nodes/:id', (req, res) => {
  db.run(`DELETE FROM nodes WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка удаления ноды' });
    res.json({ message: 'Нода удалена' });
  });
});

module.exports = router;
