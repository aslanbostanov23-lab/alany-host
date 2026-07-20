const jwt = require('jsonwebtoken');
const JWT_SECRET = 'alany_host_secret_key_12345';

module.exports = {
  JWT_SECRET,
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Неверный или устаревший токен' });
      }
      req.user = user;
      next();
    });
  }
};
