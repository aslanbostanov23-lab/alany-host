# Инструкция по перенесению Alany Host на выделенный VPS сервер

## 1. Подготовка системы Ubuntu / Debian
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git nginx sqlite3
sudo npm install -g pm2
```

## 2. Клонирование и Установка зависимостей
```bash
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> /var/www/alany-host
cd /var/www/alany-host

# Установка пакетов бэкенда и фронтенда
npm install
cd frontend && npm install && npm run build && cd ..
```

## 3. Запуск бэкенда через PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. Конфигурация Nginx (/etc/nginx/sites-available/alany-host)
```nginx
server {
    listen 80;
    server_name alany-host.ru www.alany-host.ru;

    root /var/www/alany-host/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Активация:
```bash
sudo ln -s /etc/nginx/sites-available/alany-host /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

## 5. Роли пользователей
- `admin` — Полный доступ ко всей админ-панели (клиенты, сервера, ноды, касса, промокоды).
- `support` — Доступ в админке ИСКЛЮЧИТЕЛЬНО к чату техподдержки и обработке тикетов.
- `user` — Клиентский аккаунт хостинга.
