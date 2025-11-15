# Deployment Guide

Hướng dẫn deploy Supabase Management API lên production.

## 📋 Mục Lục

- [Chuẩn Bị](#chuẩn-bị)
- [Deploy Supabase](#deploy-supabase)
- [Deploy API Server](#deploy-api-server)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)

## 🎯 Chuẩn Bị

### Checklist Trước Khi Deploy

- [ ] Code đã được test kỹ trên local
- [ ] Tất cả migrations đã được test
- [ ] Environment variables đã được chuẩn bị
- [ ] SSL certificates đã sẵn sàng
- [ ] Backup strategy đã được setup
- [ ] Monitoring tools đã được config
- [ ] Domain và DNS đã được setup

## 🚀 Deploy Supabase

### Option 1: Supabase Cloud (Recommended)

1. **Tạo Project trên Supabase**
   - Truy cập https://supabase.com
   - Click "New Project"
   - Chọn region gần users nhất
   - Lưu lại database password

2. **Lấy Credentials**
   ```
   Project URL: https://xxxxx.supabase.co
   Anon Key: eyJhbGc...
   Service Role Key: eyJhbGc...
   ```

3. **Link Local Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Push Migrations**
   ```bash
   supabase db push
   ```

5. **Verify**
   - Check Supabase Studio
   - Verify tables và RLS policies
   - Test authentication

### Option 2: Self-Hosted Supabase

Xem: https://supabase.com/docs/guides/self-hosting

## 🌐 Deploy API Server

### Option 1: Railway (Recommended)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Add Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   railway variables set SUPABASE_URL=your-url
   railway variables set SUPABASE_ANON_KEY=your-key
   railway variables set SUPABASE_SERVICE_ROLE_KEY=your-key
   railway variables set JWT_SECRET=your-secret
   railway variables set CORS_ORIGIN=your-frontend-url
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get URL**
   ```bash
   railway domain
   ```

### Option 2: Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add Environment Variables**
   - Vào Vercel Dashboard
   - Settings > Environment Variables
   - Thêm tất cả variables từ `.env.example`

4. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option 3: DigitalOcean App Platform

1. **Connect GitHub Repo**
   - Vào DigitalOcean Dashboard
   - Create App > GitHub

2. **Configure Build**
   ```yaml
   name: supabase-api
   services:
   - name: api
     github:
       repo: your-username/your-repo
       branch: main
     build_command: npm install
     run_command: npm start
     envs:
       - key: NODE_ENV
         value: production
       - key: PORT
         value: "3000"
   ```

3. **Add Environment Variables**
   - Settings > Environment Variables

4. **Deploy**

### Option 4: AWS EC2

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t2.micro (hoặc lớn hơn)
   - Security Group: Allow ports 22, 80, 443

2. **SSH vào Server**
   ```bash
   ssh -i your-key.pem ubuntu@your-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install -y nginx
   ```

4. **Clone và Setup Project**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   npm install
   ```

5. **Create .env File**
   ```bash
   nano .env
   # Paste your production environment variables
   ```

6. **Start với PM2**
   ```bash
   pm2 start src/server.js --name api
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/api
   ```
   
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Setup SSL với Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 5: Docker + Docker Compose

1. **Build Image**
   ```bash
   docker build -t supabase-api .
   ```

2. **Create docker-compose.prod.yml**
   ```yaml
   version: '3.8'
   
   services:
     api:
       image: supabase-api
       restart: always
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - PORT=3000
         - SUPABASE_URL=${SUPABASE_URL}
         - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
         - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
         - JWT_SECRET=${JWT_SECRET}
       networks:
         - app-network
   
   networks:
     app-network:
       driver: bridge
   ```

3. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🔐 Environment Variables

### Production .env Template

```bash
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# JWT
JWT_SECRET=your-super-secret-production-key-min-32-chars
JWT_EXPIRES_IN=7d

# Database (if direct connection needed)
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Audit Logs
AUDIT_LOGS_RETENTION_DAYS=90

# Email (if using)
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your-api-key
EMAIL_FROM=noreply@your-domain.com

# Frontend URL (for email links)
FRONTEND_URL=https://your-frontend-domain.com
```

### Security Best Practices

1. **JWT_SECRET**: Tạo random string mạnh
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Không commit .env** vào git

3. **Sử dụng secrets management**:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Railway/Vercel Environment Variables

## 🗄️ Database Migrations

### Production Migration Strategy

1. **Backup Database Trước**
   ```bash
   # Supabase Cloud
   # Backup tự động, hoặc manual backup trong Dashboard
   
   # Self-hosted
   pg_dump -h localhost -U postgres -d postgres > backup.sql
   ```

2. **Test Migration trên Staging**
   ```bash
   supabase db push --db-url postgresql://...staging...
   ```

3. **Apply to Production**
   ```bash
   supabase db push --db-url postgresql://...production...
   ```

4. **Verify**
   - Check tables
   - Check RLS policies
   - Test API endpoints

### Rollback Plan

```bash
# Restore from backup
psql -h localhost -U postgres -d postgres < backup.sql
```

## 📊 Monitoring

### Health Check Endpoint

```bash
curl https://your-api.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-14T10:00:00.000Z",
  "environment": "production"
}
```

### Monitoring Tools

1. **Uptime Monitoring**
   - UptimeRobot
   - Pingdom
   - StatusCake

2. **Application Monitoring**
   - New Relic
   - Datadog
   - Sentry (for errors)

3. **Log Management**
   - Papertrail
   - Loggly
   - CloudWatch (AWS)

### Setup Alerts

- API downtime
- High error rate (>5%)
- Slow response time (>2s)
- High memory usage (>80%)
- Database connection errors

## 💾 Backup & Recovery

### Database Backup

**Supabase Cloud:**
- Automatic daily backups
- Point-in-time recovery
- Manual backups in Dashboard

**Self-hosted:**
```bash
# Daily backup cron job
0 2 * * * pg_dump -h localhost -U postgres postgres > /backups/db_$(date +\%Y\%m\%d).sql
```

### Application Backup

- Code: Git repository
- Environment variables: Secure storage
- Logs: Log management service

### Recovery Procedure

1. **Database Recovery**
   ```bash
   psql -h localhost -U postgres -d postgres < backup.sql
   ```

2. **Application Recovery**
   ```bash
   git pull origin main
   npm install
   pm2 restart api
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 📝 Post-Deployment Checklist

- [ ] API health check returns OK
- [ ] Authentication works
- [ ] Database queries work
- [ ] CORS configured correctly
- [ ] SSL certificate valid
- [ ] Monitoring alerts setup
- [ ] Backup strategy verified
- [ ] Documentation updated
- [ ] Team notified

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**
```bash
# Check CORS_ORIGIN in .env
CORS_ORIGIN=https://your-frontend.com
```

**2. Database Connection Failed**
```bash
# Verify Supabase credentials
# Check network/firewall rules
```

**3. 502 Bad Gateway**
```bash
# Check if API server is running
pm2 status
pm2 logs api
```

**4. High Memory Usage**
```bash
# Restart application
pm2 restart api
```

## 📞 Support

- Documentation: README.md
- Issues: GitHub Issues
- Email: support@your-domain.com

---

Good luck with your deployment! 🚀
