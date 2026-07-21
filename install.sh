#!/bin/bash
# ==============================================================================
# Alany Host — Официальный автоинсталлятор Панели и Ноды (Чистая MariaDB/MySQL)
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}        Запуск установки Alany Host (MySQL Pure Edition)             ${NC}"
echo -e "${BLUE}======================================================================${NC}"

DOMAIN="cloud.alany.ru"
INSTALL_DIR="/var/www/alany-host"

# 1. Проверка прав root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ОШИБКА] Запустите скрипт с правами root (sudo bash install.sh)${NC}"
  exit 1
fi

# 2. Обновление пакетов и установка системных зависимостей
echo -e "${YELLOW}[1/7] Установка системных зависимостей (MariaDB, Nginx, PHP, Node.js)...${NC}"
apt-get update -y
apt-get install -y mariadb-server mariadb-client nginx php-fpm php-mysql phpmyadmin certbot python3-certbot-nginx curl git psmisc unzip openjdk-17-jre-headless || true

# 3. Настройка и запуск MariaDB (MySQL)
echo -e "${YELLOW}[2/7] Настройка базы данных MariaDB / MySQL...${NC}"
systemctl enable mariadb
systemctl start mariadb

mysql -u root << 'MYSQL_SQL'
CREATE DATABASE IF NOT EXISTS alany_host CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'alany_user'@'localhost' IDENTIFIED BY 'AlanyHost2026Pass!';
GRANT ALL PRIVILEGES ON alany_host.* TO 'alany_user'@'localhost';
ALTER USER 'alany_user'@'localhost' IDENTIFIED BY 'AlanyHost2026Pass!';
FLUSH PRIVILEGES;
MYSQL_SQL

echo -e "${GREEN}[УСПЕХ] База данных alany_host и пользователь alany_user успешно настроены!${NC}"

# 4. Подготовка директорий и разворачивание репозитория
echo -e "${YELLOW}[3/7] Подготовка рабочей директории ${INSTALL_DIR}...${NC}"
mkdir -p /var/www
mkdir -p /var/lib/alany-servers
chmod -R 777 /var/lib/alany-servers

if [ -d "$INSTALL_DIR" ]; then
  echo "Директория $INSTALL_DIR уже существует. Обновляем файлы..."
  cd "$INSTALL_DIR"
  git pull || true
else
  GITHUB_REPO=${1:-"https://github.com/aslanbostanov23-lab/alany-host.git"}
  echo "Клонирование репозитория: $GITHUB_REPO"
  git clone "$GITHUB_REPO" "$INSTALL_DIR" || mkdir -p "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# 5. Установка Node.js и PM2 (если не установлены)
if ! command -v node &> /dev/null; then
  echo "Установка Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2 || true

# 6. Установка зависимостей бэкенда и сборка фронтенда
echo -e "${YELLOW}[4/7] Установка NPM пакетов и сборка проекта...${NC}"
cd "$INSTALL_DIR/backend"
npm install

cd "$INSTALL_DIR/frontend"
npm install
npm run build
chmod -R 755 dist || true
chmod -R 755 .. || true

cd "$INSTALL_DIR"

# 7. Автоматическое определение PHP-FPM сокета и конфигурация Nginx + SSL
echo -e "${YELLOW}[5/7] Настройка Nginx и phpMyAdmin под ${DOMAIN}...${NC}"

PHP_SOCK=$(ls /run/php/php*-fpm.sock 2>/dev/null | head -n 1)
if [ -z "$PHP_SOCK" ]; then
    PHP_SOCK="unix:/run/php/php-fpm.sock"
else
    PHP_SOCK="unix:${PHP_SOCK}"
fi

cat > /etc/nginx/sites-available/alany-host <<NGINXEOF
server {
    listen 80;
    server_name ${DOMAIN};

    root ${INSTALL_DIR}/frontend/dist;
    index index.html;

    client_max_body_size 100M;

    location /phpmyadmin {
        root /usr/share;
        index index.php index.html;
        location ~ \.php\$ {
            include fastcgi_params;
            fastcgi_pass ${PHP_SOCK};
            fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
            fastcgi_param HTTPS on;
        }
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINXEOF

rm -f /etc/nginx/sites-enabled/*
rm -f /etc/nginx/sites-available/default
ln -sf /etc/nginx/sites-available/alany-host /etc/nginx/sites-enabled/alany-host

nginx -t || true
systemctl restart nginx || true
systemctl restart php*-fpm || true

# Выпуск SSL сертификата через Certbot
if command -v certbot &> /dev/null; then
  certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email -d "${DOMAIN}" || true
fi

# 8. Запуск бэкенда Alany Host через PM2 в режиме MySQL
echo -e "${YELLOW}[6/7] Запуск бэкенда через PM2...${NC}"
pm2 kill || true
pm2 start ecosystem.config.js
pm2 save || true

echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}        Установка Alany Host успешно завершена!                      ${NC}"
echo -e "${BLUE}  Панель управления:  https://${DOMAIN}/                             ${NC}"
echo -e "${BLUE}  База данных (PMA):  https://${DOMAIN}/phpmyadmin/                 ${NC}"
echo -e "${BLUE}  Логин PMA:          alany_user                                     ${NC}"
echo -e "${BLUE}  Пароль PMA:         AlanyHost2026Pass!                             ${NC}"
echo -e "${BLUE}  Админ панели:       admin / admin                                  ${NC}"
echo -e "${GREEN}======================================================================${NC}"
