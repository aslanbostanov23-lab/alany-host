const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Регистрация
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (username, email, password_hash, balance, role) VALUES (?, ?, ?, 0.0, 'user')`,
    [username, email, passwordHash],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ message: 'Имя пользователя или email уже зарегистрированы' });
        }
        return res.status(500).json({ message: 'Ошибка базы данных при регистрации' });
      }

      // Генерируем токен для нового пользователя
      const userId = this.lastID;
      const token = jwt.sign({ id: userId, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        token,
        user: { id: userId, username, email, role: 'user', balance: 0.0 }
      });
    }
  );
});

// Вход
router.post('/login', (req, res) => {
  const { login, password } = req.body; // login может быть именем или email

  if (!login || !password) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }

  db.get(
    `SELECT * FROM users WHERE username = ? OR email = ?`,
    [login, login],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка сервера при авторизации' });
      }

      if (!user) {
        return res.status(400).json({ message: 'Неверное имя пользователя, email или пароль' });
      }

      const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
      if (!passwordIsValid) {
        return res.status(400).json({ message: 'Неверное имя пользователя, email или пароль' });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          balance: parseFloat(user.balance) || 0.0
        }
      });
    }
  );
});

// Получить профиль
router.get('/me', authenticateToken, (req, res) => {
  db.get(`SELECT id, username, email, balance, role, avatar, telegram, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка получения профиля' });
    }
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    user.balance = parseFloat(user.balance) || 0.0;
    res.json(user);
  });
});

// Обновить профиль (username, avatar, telegram)
router.put(['/', '/profile'], authenticateToken, (req, res) => {
  const { username, avatar, telegram } = req.body;
  const userId = req.user.id;

  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, currentUser) => {
    if (err || !currentUser) {
      return res.status(500).json({ message: 'Пользователь не найден' });
    }

    const newUsername = username !== undefined ? username : currentUser.username;
    const newAvatar = avatar !== undefined ? avatar : currentUser.avatar;
    const newTelegram = telegram !== undefined ? telegram : currentUser.telegram;

    db.run(
      `UPDATE users SET username = ?, avatar = ?, telegram = ? WHERE id = ?`,
      [newUsername, newAvatar, newTelegram, userId],
      function (updateErr) {
        if (updateErr) {
          if (updateErr.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Имя пользователя уже занято' });
          }
          return res.status(500).json({ message: 'Ошибка обновления профиля' });
        }

        db.get(`SELECT id, username, email, balance, role, avatar, telegram, created_at FROM users WHERE id = ?`, [userId], (err2, updatedUser) => {
          res.json({ message: 'Профиль успешно обновлен', user: updatedUser });
        });
      }
    );
  });
});

// Обновить пароль
router.put(['/password', '/profile/password'], authenticateToken, (req, res) => {
  const { current_password, new_password } = req.body;
  const userId = req.user.id;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }

  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ message: 'Пользователь не найден' });
    }

    const validPassword = bcrypt.compareSync(current_password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Неверный текущий пароль' });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, userId], function (updateErr) {
      if (updateErr) {
        return res.status(500).json({ message: 'Ошибка при изменении пароля' });
      }
      res.json({ message: 'Пароль успешно обновлен' });
    });
  });
});

module.exports = router;
