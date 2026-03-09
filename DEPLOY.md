# Upscayl Web 部署指南

## 前置要求

- **Node.js** 18+ 
- **Linux** 服务器（需要 Vulkan 支持的 GPU 来运行 upscayl-bin）
- Git

## 部署步骤

### 1. 克隆项目

```bash
git clone https://github.com/zhao0/upscayl.git
cd upscayl
```

### 2. 确保 Linux 二进制可执行

```bash
chmod +x resources/linux/bin/upscayl-bin
```

### 3. 构建前端

```bash
cd web
npm install
npm run build    # 输出到 web/dist/
cd ..
```

### 4. 构建后端

```bash
cd server
npm install
npm run build    # TypeScript 编译到 server/dist/
cd ..
```

### 5. 启动服务

```bash
cd server
NODE_ENV=production PORT=3001 node dist/index.js
```

生产模式下，Express 会同时：
- 提供 API 服务（`/api/*`）
- 托管前端静态文件（从 `web/dist/` 读取）

访问 `http://your-server:3001` 即可使用。

---

## 使用 PM2 守护进程（推荐）

```bash
npm install -g pm2

cd server
pm2 start dist/index.js --name upscayl-web \
  --env production \
  -- --PORT=3001

pm2 save
pm2 startup    # 开机自启
```

## 使用 Nginx 反向代理（可选）

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

    # SSE 需要关闭缓冲
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

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3001` |
| `NODE_ENV` | 环境（`production` 开启静态托管） | — |
| `FRONTEND_URL` | 前端地址（仅非 production 模式需设置 CORS） | `http://localhost:5173` |

## GPU 注意事项

upscayl-bin 依赖 Vulkan，确保服务器已安装：

```bash
# Ubuntu/Debian
sudo apt install vulkan-tools mesa-vulkan-drivers

# 验证 GPU 可用
vulkaninfo | head -20
```

如果是无 GPU 的服务器，upscayl-bin 将无法运行。
