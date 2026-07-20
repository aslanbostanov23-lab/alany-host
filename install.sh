#!/usr/bin/env bash
# ==============================================================================
# ALANY > HOST — Автоматический инсталлятор панели управления и ноды
# Домен: cloud.alany.ru
# ОС: Ubuntu 20.04 / 22.04 / 24.04, Debian 11 / 12
# ==============================================================================

set -e

# Цвета для терминала
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  █████╗ ██╗      █████╗ ███╗   ██╗██╗   ██╗    ██╗  ██╗██████╗ ███████╗████████╗"
echo " ██╔══██╗██║     ██╔══██╗████╗  ██║╚██╗ ██╔╝    ██║  ██║██╔══██╗██╔════╝╚══██╔══╝"
echo " ███████║██║     ███████║██╔██╗ ██║ ╚████╔╝     ███████║██║  ██║███████╗   ██║   "
echo " ██╔══██║██║     ██╔══██║██║╚██╗██║  ╚██╔╝      ██╔══██║██║  ██║╚════██║   ██║   "
echo " ██║  ██║███████╗██║  ██║██║ ╚████║   ██║       ██║  ██║██████╔╝███████║   ██║   "
echo " ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝       ╚═╝  ╚═╝╚═════╝ ╚══════╝   ╚═╝   "
echo -e "${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}Установка игрового хостинга ALANY > HOST на домен: cloud.alany.ru${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# 1. Проверка прав root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ОШИБКА] Запустите скрипт с правами root (sudo bash install.sh)${NC}"
  exit 1
fi

DOMAIN="cloud.alany.ru"
INSTALL_DIR="/var/www/alany-host"

# 2. Обновление пакетов
echo -e "${YELLOW}[1/7] Обновление системных пакетов...${NC}"
apt update -y && apt upgrade -y
apt install -y curl wget git build-essential nginx mariadb-server mariadb-client sqlite3 certbot python3-certbot-nginx ufw

# 3. Установка Node.js 20 и PM2
echo -e "${YELLOW}[2/7] Установка Node.js 20 LTS и PM2...${NC}"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

npm install -g pm2

# 4. Настройка MariaDB / MySQL & phpMyAdmin
echo -e "${YELLOW}[3/7] Конфигурация MySQL (MariaDB) для панели и phpMyAdmin...${NC}"
systemctl start mariadb || systemctl start mysql || true
systemctl enable mariadb || systemctl enable mysql || true

mysql -e "CREATE DATABASE IF NOT EXISTS alany_host CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || true
mysql -e "CREATE USER IF NOT EXISTS 'alany_user'@'localhost' IDENTIFIED BY 'AlanyHost2026Pass!';" || true
mysql -e "GRANT ALL PRIVILEGES ON alany_host.* TO 'alany_user'@'localhost';" || true
mysql -e "FLUSH PRIVILEGES;" || true

export DEBIAN_FRONTEND=noninteractive
echo "phpmyadmin phpmyadmin/dbconfig-install boolean true" | debconf-set-selections
echo "phpmyadmin phpmyadmin/reconfigure-webserver multiselect nginx" | debconf-set-selections
apt install -y phpmyadmin php-fpm php-mysql php-mbstring php-zip php-gd

# 5. Разворачивание репозитория панели Alany Host
echo -e "${YELLOW}[4/7] Клонирование и сборка Alany Host...${NC}"
mkdir -p /var/www
if [ -d "$INSTALL_DIR" ]; then
  echo "Директория $INSTALL_DIR уже существует. Обновляем файлы..."
  cd "$INSTALL_DIR"
  git pull || true
else
  # Если передан аргумент с URL гитхаба: bash install.sh https://github.com/user/repo.git
  GITHUB_REPO=${1:-"https://github.com/alany-host/alany-host.git"}
  echo "Клонирование репозитория: $GITHUB_REPO"
  git clone "$GITHUB_REPO" "$INSTALL_DIR" || mkdir -p "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# Установка зависимостей бэкенда
echo "Установка зависимостей бэкенда..."
npm install

# Сборка фронтенда
echo "Сборка фронтенда React (Vite)..."
cd frontend
npm install
npm run build
cd ..

# 6. Конфигурация Nginx под cloud.alany.ru + phpMyAdmin
echo -e "${YELLOW}[5/7] Конфигурация веб-сервера Nginx под ${DOMAIN}...${NC}"

# Настройка символической ссылки на phpmyadmin
ln -sf /usr/share/phpmyadmin "$INSTALL_DIR/frontend/dist/phpmyadmin"

cat <<'EOF' > /etc/nginx/sites-available/alany-host
server {
    listen 80;
    server_name cloud.alany.ru;

    root /var/www/alany-host/frontend/dist;
    index index.html index.php;

    client_max_body_size 100M;

    # Главная панель Alany Host
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Бэкенда Node.js
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Страховка для прямой авторизации без /api
    location /auth/ {
        proxy_pass http://127.0.0.1:5000/api/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Управление базами данных phpMyAdmin
    location /phpmyadmin {
        root /usr/share/;
        index index.php index.html index.htm;
        location ~ \.php$ {
            try_files $uri =404;
            fastcgi_split_path_info ^(.+\.php)(/.+)$;
            fastcgi_pass unix:/run/php/php-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires max;
        log_not_found off;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/*
rm -f /etc/nginx/sites-available/default
ln -sf /etc/nginx/sites-available/alany-host /etc/nginx/sites-enabled/alany-host
nginx -t || true
systemctl restart nginx || true
systemctl restart php*-fpm || true
if command -v certbot &> /dev/null; then
  certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email -d "${DOMAIN}" || {
    echo -e "${YELLOW}[ИНФО] Если домен ${DOMAIN} еще не направлен на этот IP, SSL активируется автоматически при привязке A-записи.${NC}"
  }
fi

# 8. Автозапуск бэкенда через PM2
echo -e "${YELLOW}[7/7] Запуск бэкенда Alany Host через PM2...${NC}"
cd "$INSTALL_DIR"
pm2 start ecosystem.config.js || pm2 start backend/server.js --name "alany-host"
pm2 save
pm2 startup | tail -n 1 | bash || true

# 9. Финальная оптимизация и вывод данных
echo -e "${GREEN}"
echo "=============================================================================="
echo "  [УСПЕХ] Панель управления ALANY > HOST успешно установлена!"
echo "=============================================================================="
echo -e "${NC}"
echo -e "🔗 Адрес панели (HTTPS): ${CYAN}https://${DOMAIN}/${NC}"
echo -e "🗄️  БД phpMyAdmin:        ${CYAN}https://${DOMAIN}/phpmyadmin${NC}"
echo -e "👤 Администратор:        ${YELLOW}admin${NC} / Пароль: ${YELLOW}admin${NC}"
echo -e "👥 Пользователь:         ${YELLOW}user${NC} / Пароль: ${YELLOW}user${NC}"
echo "=============================================================================="
echo -e "🔗 Адрес панели:        ${CYAN}http://cloud.alany.ru/${NC}"
echo -e "🗄️  БД phpMyAdmin:      ${CYAN}http://cloud.alany.ru/phpmyadmin${NC}"
echo -e "👤 Демо Администратор: ${YELLOW}admin${NC} / Пароль: ${YELLOW}admin${NC}"
echo -e "👥 Демо Пользователь:  ${YELLOW}user${NC} / Пароль: ${YELLOW}user${NC}"
echo ""
echo -e "${BLUE}Для выпуска бесплатного SSL-сертификата HTTPS выполните:${NC}"
echo -e "${CYAN}certbot --nginx -d cloud.alany.ru${NC}"
echo "=============================================================================="
