const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Подключение и инициализация БД

const authRoutes = require('./routes/auth');
const billingRoutes = require('./routes/billing');
const serverRoutes = require('./routes/servers');
const ticketRoutes = require('./routes/tickets');
const adminRoutes = require('./routes/admin');
const webhostRoutes = require('./routes/webhost');
const servicesRoutes = require('./routes/services');

const app = express();
const PORT = process.env.PORT || 5000;

// Настройка CORS для взаимодействия с фронтендом (по умолчанию React Vite работает на 5173 порту)
app.use(cors({
  origin: true,
  credentials: true
}));

// Парсинг JSON и URL-encoded запросов (поддержка загрузки картинок аватаров до 10МБ)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Логирование запросов (простое)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Регистрация API-маршрутов
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/profile', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhost', webhostRoutes);
app.use('/api', servicesRoutes);

// Раздача собранного React приложения в продакшене
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// Явный JSON-ответ на любые отсутствующие API маршруты (гарантирует отсутствие HTML ответов)
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: `Метод API ${req.originalUrl} не найден` });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Бэкенд Alany Host работает! Соберите фронтенд: npm run build');
    }
  });
});

// Защита от фатальных падений сервера 24/7
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL SYSTEM LOG] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[CRITICAL SYSTEM LOG] Unhandled Rejection:', reason);
});

// Запуск сервера на 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(` Сервер Alany Host успешно запущен!`);
  console.log(` Порт: ${PORT}`);
  console.log(` База данных инициализирована и готова к работе.`);
  console.log(`==================================================`);
});
