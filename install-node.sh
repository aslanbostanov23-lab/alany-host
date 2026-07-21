#!/bin/bash
# ==============================================================================
# Alany Host — Автоинсталлятор Внешней KVM-Ноды Серверов
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}      Установка демона Ноды Игровых Серверов Alany Host Daemon        ${NC}"
echo -e "${BLUE}======================================================================${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ОШИБКА] Запустите скрипт с правами root (sudo bash install-node.sh)${NC}"
  exit 1
fi

NODE_DIR="/opt/alany-node-daemon"
mkdir -p "$NODE_DIR"
mkdir -p /var/lib/alany-servers
chmod -R 777 /var/lib/alany-servers

echo -e "${YELLOW}[1/4] Установка игровых зависимостей (Java, Node.js, cURL)...${NC}"
apt-get update -y
apt-get install -y curl git psmisc unzip openjdk-17-jre-headless || true

if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2 || true

echo -e "${YELLOW}[2/4] Создание конфигурации Демона Ноды...${NC}"
SECRET_TOKEN=${1:-"alany_node_secret_key_2026"}
PUBLIC_IP=$(curl -s https://api.ipify.org || echo "127.0.0.1")

cat > "$NODE_DIR/index.js" << NODE_DAEMON_EOF
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 5001;
const SECRET_TOKEN = "${SECRET_TOKEN}";

app.use(cors({ origin: true }));
app.use(express.json());

// Auth Middleware
app.use((req, res, next) => {
  const token = req.headers['authorization'] || req.query.token;
  if (token !== \`Bearer \${SECRET_TOKEN}\` && token !== SECRET_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized node access' });
  }
  next();
});

app.get('/health', (req, res) => res.json({ status: 'online', ip: "${PUBLIC_IP}" }));

app.listen(PORT, () => {
  console.log(\`[ALANY NODE DAEMON] Running on port \${PORT}\`);
});
NODE_DAEMON_EOF

cat > "$NODE_DIR/package.json" << PKG_EOF
{
  "name": "alany-node-daemon",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2"
  }
}
PKG_EOF

cd "$NODE_DIR"
npm install

pm2 delete alany-node-daemon || true
pm2 start index.js --name alany-node-daemon
pm2 save || true

echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}        Внешняя нода Alany Host успешно установлена и запущена!      ${NC}"
echo -e "${BLUE}  IP ноды:             ${PUBLIC_IP}                                    ${NC}"
echo -e "${BLUE}  Порт ноды:           5001                                          ${NC}"
echo -e "${BLUE}  Секретный токен:     ${SECRET_TOKEN}                              ${NC}"
echo -e "${YELLOW}  Для подключения ноды в панель введите эти данные в вкладке 'Ноды'   ${NC}"
echo -e "${GREEN}======================================================================${NC}"
