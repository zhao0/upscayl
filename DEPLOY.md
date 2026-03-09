# Upscayl Web — Deployment Guide

## Prerequisites

- **Node.js** 18+
- **macOS / Linux / Windows** (binary auto-detected via `process.platform`)
- GPU with Vulkan support (required by upscayl-bin)
- Git

## Quick Start

```bash
# 1. Clone
git clone https://github.com/zhao0/upscayl.git
cd upscayl

# 2. (Linux/macOS only) Ensure binary is executable
chmod +x resources/linux/bin/upscayl-bin   # Linux
chmod +x resources/mac/bin/upscayl-bin     # macOS

# 3. Build frontend
cd web && npm install && npm run build && cd ..

# 4. Build backend
cd server && npm install && npm run build

# 5. Start (production mode — frontend + API on single port)
NODE_ENV=production PORT=3001 node dist/index.js
```

Visit `http://your-server:3001` to use.

---

## Process Manager (PM2)

```bash
npm install -g pm2

cd server
pm2 start dist/index.js --name upscayl-web \
  --env production \
  -- --PORT=3001

pm2 save
pm2 startup    # auto-start on reboot
```

## Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Disable buffering for SSE progress events
    location /api/upscale/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Set to `production` to enable static file serving | — |
| `FRONTEND_URL` | CORS origin (only needed in non-production mode) | `http://localhost:5173` |

## GPU Requirements

upscayl-bin requires Vulkan support:

```bash
# Ubuntu/Debian
sudo apt install vulkan-tools mesa-vulkan-drivers

# Verify GPU availability
vulkaninfo | head -20
```

Without a GPU with Vulkan support, upscayl-bin will not run.
