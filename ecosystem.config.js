module.exports = {
  apps: [
    {
      name: "alany-host-backend",
      script: "./backend/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        JWT_SECRET: "alany_host_secure_vps_key_2026",
        DB_TYPE: "mysql",
        DB_HOST: "127.0.0.1",
        DB_USER: "alany_user",
        DB_PASSWORD: "AlanyHost2026Pass!",
        DB_NAME: "alany_host"
      }
    }
  ]
};
