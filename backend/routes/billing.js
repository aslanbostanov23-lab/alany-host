const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Симуляция пополнения баланса
router.post('/refill', authenticateToken, (req, res) => {
  const { amount } = req.body;
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Сумма пополнения должна быть положительным числом' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 1. Обновляем баланс
    db.run(
      `UPDATE users SET balance = balance + ? WHERE id = ?`,
      [parsedAmount, req.user.id],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Ошибка при пополнении баланса' });
        }

        // 2. Логируем транзакцию
        db.run(
          `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'refill', ?)`,
          [req.user.id, parsedAmount, `Пополнение баланса через платежную систему`],
          function (txErr) {
            if (txErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Ошибка логирования транзакции' });
            }

            db.run('COMMIT');

            // Получаем новый баланс для отправки в ответе
            db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (userErr, user) => {
              if (userErr || !user) {
                return res.json({ message: 'Баланс пополнен', balance: parsedAmount });
              }
              res.json({
                message: 'Баланс успешно пополнен',
                balance: user.balance
              });
            });
          }
        );
      }
    );
  });
});

// Получить историю транзакций
router.get('/transactions', authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка получения транзакций' });
      }
      res.json(rows);
    }
  );
});

// Прокрутка колеса фортуны
router.post('/wheel/spin', authenticateToken, (req, res) => {
  const { is_free } = req.body;
  const price = is_free ? 0 : 25;

  db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (user.balance < price) {
      return res.status(400).json({ message: `Недостаточно средств. Для прокрутки требуется 25 ₽, ваш баланс: ${user.balance.toFixed(2)} ₽` });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Списываем средства
      db.run(
        `UPDATE users SET balance = balance - ? WHERE id = ?`,
        [price, req.user.id],
        (updErr) => {
          if (updErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Ошибка списания средств за прокрутку' });
          }

          // Логируем списание
          const desc = is_free ? 'Бесплатная прокрутка Колеса Фортуны' : 'Прокрутка Колеса Фортуны (25 ₽)';
          db.run(
            `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'payment', ?)`,
            [req.user.id, -price, desc],
            (txErr) => {
              if (txErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Ошибка записи транзакции' });
              }

              db.run('COMMIT');

              // Случайный выигрыш из 8 секторов:
              // 0: +10 ₽
              // 1: Скидка 10% на Minecraft
              // 2: +50 ₽
              // 3: Скидка 15% на SAMP
              // 4: +20 ₽
              // 5: Бесплатный сервер на 3 дня
              // 6: Скидка 50% на CS2
              // 7: +100 ₽
              const prizeIndex = Math.floor(Math.random() * 8);
              let prizeValue = 0;
              let prizeDesc = '';

              switch (prizeIndex) {
                case 0: prizeValue = 10; prizeDesc = 'Бонус +10 ₽'; break;
                case 1: prizeValue = 0; prizeDesc = 'Скидка 10% на Minecraft'; break;
                case 2: prizeValue = 50; prizeDesc = 'Бонус +50 ₽'; break;
                case 3: prizeValue = 0; prizeDesc = 'Скидка 15% на SAMP'; break;
                case 4: prizeValue = 20; prizeDesc = 'Бонус +20 ₽'; break;
                case 5: prizeValue = 0; prizeDesc = 'Бесплатный сервер на 3 дня'; break;
                case 6: prizeValue = 0; prizeDesc = 'Скидка 50% на CS2'; break;
                case 7: prizeValue = 100; prizeDesc = 'Бонус +100 ₽'; break;
              }

              if (prizeValue > 0) {
                db.serialize(() => {
                  db.run('BEGIN TRANSACTION');
                  db.run(
                    `UPDATE users SET balance = balance + ? WHERE id = ?`,
                    [prizeValue, req.user.id],
                    (addErr) => {
                      if (addErr) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ message: 'Ошибка начисления выигрыша' });
                      }

                      db.run(
                        `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'refill', ?)`,
                        [req.user.id, prizeValue, `Выигрыш в Колесе Фортуны: ${prizeDesc}`],
                        (txAddErr) => {
                          if (txAddErr) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ message: 'Ошибка записи транзакции выигрыша' });
                          }

                          db.run('COMMIT');
                          db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (finalErr, finalUser) => {
                            res.json({
                              prizeIndex,
                              prizeDesc,
                              balance: finalUser ? finalUser.balance : user.balance
                            });
                          });
                        }
                      );
                    }
                  );
                });
              } else {
                db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (finalErr, finalUser) => {
                  res.json({
                    prizeIndex,
                    prizeDesc,
                    balance: finalUser ? finalUser.balance : user.balance
                  });
                });
              }
            }
          );
        }
      );
    });
  });
});

// Заказ графического дизайна
router.post('/design/order', authenticateToken, (req, res) => {
  const { design_id, name, price } = req.body;
  const parsedPrice = parseFloat(price);

  if (!design_id || !name || isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ message: 'Неверные параметры заказа дизайна' });
  }

  db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (user.balance < parsedPrice) {
      return res.status(400).json({ message: `Недостаточно средств. Для заказа требуется ${parsedPrice} ₽, ваш баланс: ${user.balance.toFixed(2)} ₽` });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // 1. Списываем средства
      db.run(
        `UPDATE users SET balance = balance - ? WHERE id = ?`,
        [parsedPrice, req.user.id],
        (updErr) => {
          if (updErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Ошибка списания средств за дизайн' });
          }

          // 2. Логируем списание
          db.run(
            `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'payment', ?)`,
            [req.user.id, -parsedPrice, `Покупка услуги дизайна: "${name}"`],
            (txErr) => {
              if (txErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Ошибка записи транзакции' });
              }

              // 3. Создаем тикет поддержки для связи с дизайнером
              db.run(
                `INSERT INTO tickets (user_id, subject, status) VALUES (?, ?, 'open')`,
                [req.user.id, `Заказ дизайна: ${name}`],
                function (ticketErr) {
                  if (ticketErr) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Ошибка создания тикета заказа' });
                  }

                  const ticketId = this.lastID;
                  const firstMsg = `Здравствуйте! Вы успешно оплатили услугу: "${name}" (${parsedPrice} ₽).\n\nНаш графический дизайнер свяжется с вами здесь в течение ближайшего времени для обсуждения технического задания, пожеланий по цветам, логотипам и стилистике. Пожалуйста, напишите ваши пожелания ниже!`;

                  // Вставляем первое сообщение от системы
                  db.run(
                    `INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES (?, ?, ?)`,
                    [ticketId, req.user.id, `Запрос на разработку графического дизайна по услуге "${name}".`],
                    (msgErr) => {
                      if (msgErr) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ message: 'Ошибка отправки первого сообщения' });
                      }

                      // Ищем ID админа для отправки приветствия
                      db.get(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`, (adminErr, admin) => {
                        const adminId = admin ? admin.id : 1;
                        db.run(
                          `INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES (?, ?, ?)`,
                          [ticketId, adminId, firstMsg],
                          (welcomeErr) => {
                            if (welcomeErr) {
                              db.run('ROLLBACK');
                              return res.status(500).json({ message: 'Ошибка отправки приветственного сообщения' });
                            }

                            db.run('COMMIT');
                            
                            // Возвращаем новый баланс
                            db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (finalErr, finalUser) => {
                              res.json({
                                message: 'Услуга дизайна успешно заказана',
                                ticketId,
                                balance: finalUser ? finalUser.balance : user.balance
                              });
                            });
                          }
                        );
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});

module.exports = router;
