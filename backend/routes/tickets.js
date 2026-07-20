const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// 1. Получить все тикеты пользователя
router.get('/', authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка получения тикетов' });
      }
      res.json(rows);
    }
  );
});

// 2. Создать новый тикет с первым сообщением
router.post('/', authenticateToken, (req, res) => {
  const { subject, message, attachment } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ message: 'Тема и сообщение обязательны' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      `INSERT INTO tickets (user_id, subject, status) VALUES (?, ?, 'open')`,
      [req.user.id, subject],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Ошибка создания тикета' });
        }

        const ticketId = this.lastID;

        db.run(
          `INSERT INTO ticket_messages (ticket_id, sender_id, message, attachment) VALUES (?, ?, ?, ?)`,
          [ticketId, req.user.id, message, attachment],
          function (msgErr) {
            if (msgErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Ошибка отправки первого сообщения' });
            }

            db.run('COMMIT');

            // Симулируем автоматический ответ техподдержки через 4 секунды
            setTimeout(() => {
              const botReplies = [
                "Здравствуйте! Ваше обращение принято и передано специалистам. Мы изучим проблему и вернемся к вам в ближайшее время.",
                "Приветствуем! Техподдержка Alany Host уже занимается вашим вопросом. Уточните, пожалуйста, если есть дополнительные подробности или скриншоты.",
                "Здравствуйте! Специалист первой линии поддержки подключился к тикету. Ожидайте ответа в течение нескольких минут."
              ];
              const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];

              // Ищем ID админа (обычно 1)
              db.get(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`, (adminErr, admin) => {
                const adminId = admin ? admin.id : 1;
                db.run(
                  `INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES (?, ?, ?)`,
                  [ticketId, adminId, randomReply]
                );
              });
            }, 4000);

            res.status(201).json({
              message: 'Тикет успешно создан!',
              ticketId: ticketId
            });
          }
        );
      }
    );
  });
});

// 3. Получить все сообщения конкретного тикета
router.get('/:id/messages', authenticateToken, (req, res) => {
  const ticketId = req.params.id;

  // Проверяем, принадлежит ли тикет пользователю (или пользователь является админом)
  db.get(
    `SELECT * FROM tickets WHERE id = ?`,
    [ticketId],
    (err, ticket) => {
      if (err || !ticket) {
        return res.status(404).json({ message: 'Тикет не найден' });
      }

      if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Нет доступа к этому тикету' });
      }

      db.all(
        `SELECT tm.*, u.username as sender_name, u.role as sender_role 
         FROM ticket_messages tm 
         JOIN users u ON tm.sender_id = u.id 
         WHERE tm.ticket_id = ? 
         ORDER BY tm.created_at ASC`,
        [ticketId],
        (msgErr, rows) => {
          if (msgErr) {
            return res.status(500).json({ message: 'Ошибка получения сообщений' });
          }
          res.json({
            ticket,
            messages: rows
          });
        }
      );
    }
  );
});

// 4. Отправить сообщение в тикет
router.post('/:id/messages', authenticateToken, (req, res) => {
  const ticketId = req.params.id;
  const { message, attachment } = req.body;

  if (!message && !attachment) {
    return res.status(400).json({ message: 'Сообщение не может быть пустым' });
  }

  // Проверяем доступ к тикету
  db.get(
    `SELECT * FROM tickets WHERE id = ?`,
    [ticketId],
    (err, ticket) => {
      if (err || !ticket) {
        return res.status(404).json({ message: 'Тикет не найден' });
      }

      if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Нет доступа к этому тикету' });
      }

      db.run(
        `INSERT INTO ticket_messages (ticket_id, sender_id, message, attachment) VALUES (?, ?, ?, ?)`,
        [ticketId, req.user.id, message || '', attachment],
        function (insErr) {
          if (insErr) {
            return res.status(500).json({ message: 'Ошибка отправки сообщения' });
          }

          // Если сообщение отправил пользователь, можно также обновить статус тикета на open и запустить бота
          if (req.user.role !== 'admin') {
            db.run(`UPDATE tickets SET status = 'open' WHERE id = ?`, [ticketId]);

            // Симулируем ответ через 4 секунды
            setTimeout(() => {
              db.get(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`, (adminErr, admin) => {
                const adminId = admin ? admin.id : 1;
                const supportReply = "Ваше сообщение получено. Специалист ответит в ближайшее время. Спасибо за ожидание!";
                db.run(
                  `INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES (?, ?, ?)`,
                  [ticketId, adminId, supportReply]
                );
              });
            }, 4000);
          }

          res.status(201).json({ message: 'Сообщение успешно отправлено' });
        }
      );
    }
  );
});

module.exports = router;
