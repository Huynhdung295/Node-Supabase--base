# 🌐 Nginx Guide - Load Balancing & SSL

## 🚀 Quick Setup

### 1. Start Multiple API Instances

```bash
# Terminal 1
PORT=3000 npm run dev

# Terminal 2
PORT=3001 npm run dev

# Terminal 3
PORT=3002 npm run dev
```

### 2. Start Nginx

```bash
# Docker
docker-compose -f nginx/docker-compose.nginx.yml up -d

# Or native
cd C:\nginx
start nginx
```

### 3. Test

```bash
curl http://localhost/health
```

## ⚙️ Configuration

### Load Balancing

```nginx
# nginx/nginx.conf
upstream api_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://api_backend;
    }
}
```

### SSL/HTTPS

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://api_backend;
    }
}
```

### Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location / {
        limit_req zone=api burst=20;
        proxy_pass http://api_backend;
    }
}
```

## 🔧 Commands

```bash
# Start
nginx

# Stop
nginx -s stop

# Reload config
nginx -s reload

# Test config
nginx -t
```

## 📊 Monitoring

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

---

**Scale with Nginx!** 🌐
