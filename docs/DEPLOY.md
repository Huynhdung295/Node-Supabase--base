# 🚀 Deployment Guide

## ☁️ Deploy Options

### 1. Railway (Easiest)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 2. Vercel

```bash
npm install -g vercel
vercel
```

### 3. Docker

```bash
docker build -t api .
docker run -p 3000:3000 --env-file .env api
```

### 4. AWS EC2

```bash
# SSH to server
ssh -i key.pem ubuntu@ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone & setup
git clone repo
cd repo
npm install
npm run keys:append

# Start with PM2
npm install -g pm2
pm2 start src/server.js --name api
pm2 save
pm2 startup
```

## 🔐 Environment Variables

```bash
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
JWT_SECRET=xxx
CORS_ORIGIN=https://yourdomain.com
```

## ✅ Pre-Deploy Checklist

- [ ] Tests pass
- [ ] Environment variables set
- [ ] CORS configured
- [ ] HTTPS enabled
- [ ] Database migrated
- [ ] Monitoring setup

## 📊 Post-Deploy

```bash
# Health check
curl https://api.yourdomain.com/health

# Test endpoints
curl https://api.yourdomain.com/api/v1/auth/login
```

## 🔄 CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      - run: railway up
```

---

**Deploy in 10 minutes!** 🚀
