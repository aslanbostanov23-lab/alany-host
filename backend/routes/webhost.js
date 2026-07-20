const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 1. Получить список всех веб-хостов текущего пользователя
router.get('/my', (req, res) => {
  db.all(
    `SELECT * FROM webhosts WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Ошибка получения веб-хостингов' });
      res.json(rows || []);
    }
  );
});

// 2. Заказать новый веб-хостинг
router.post('/order', (req, res) => {
  const { domain, tarif_id, duration_days } = req.body;
  const userId = req.user.id;

  if (!domain) {
    return res.status(400).json({ message: 'Укажите доменное имя' });
  }

  // Тарифные сетки
  const prices = {
    start: 90,
    pro: 180,
    biz: 350
  };

  const tarifNames = {
    start: 'Веб-Старт',
    pro: 'Веб-Про',
    biz: 'Веб-Бизнес'
  };

  const basePrice = prices[tarif_id] || 180;
  const tarifTitle = tarifNames[tarif_id] || 'Веб-Про';

  db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) return res.status(500).json({ message: 'Пользователь не найден' });

    if (user.balance < basePrice) {
      return res.status(400).json({ message: `Недостаточно средств. Требуется ${basePrice} ₽` });
    }

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').trim();
    const randId = Math.floor(Math.random() * 899 + 100);
    
    const ftpHost = 'ftp.alany.host';
    const ftpUser = `web_user_${randId}`;
    const ftpPass = `aB${randId}#mK!`;
    const mysqlDb = `web_db_${randId}`;
    const mysqlPass = `aB${randId}#mK!`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (parseInt(duration_days, 10) || 30));
    const expiresStr = expiresAt.toISOString().slice(0, 10);

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // 1. Списываем баланс
      db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [basePrice, userId], (updErr) => {
        if (updErr) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Ошибка списания средств' });
        }

        // 2. Создаем веб-хост в БД
        db.run(
          `INSERT INTO webhosts 
           (user_id, domain, tarif, status, ftp_host, ftp_user, ftp_pass, mysql_db, mysql_pass, expires_at)
           VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)`,
          [userId, cleanDomain, tarifTitle, ftpHost, ftpUser, ftpPass, mysqlDb, mysqlPass, expiresStr],
          function (insErr) {
            if (insErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Ошибка создания веб-хоста' });
            }

            // 3. Записываем транзакцию
            db.run(
              `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'expense', ?)`,
              [userId, basePrice, `Заказ веб-хостинга для ${cleanDomain}`],
              (txErr) => {
                if (txErr) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ message: 'Ошибка записи транзакции' });
                }

                db.run('COMMIT');
                res.json({ 
                  message: 'Веб-хостинг успешно создан',
                  webhost_id: this.lastID
                });
              }
            );
          }
        );
      });
    });
  });
});

module.exports = router;
