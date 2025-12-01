# Deployment Guide: Proxmox Server

Complete guide for deploying Sunday League Manager on Hetzner Proxmox server.

## Table of Contents

1. [Option 1: Docker Deployment (Recommended)](#option-1-docker-deployment-recommended)
2. [Option 2: Manual Deployment with PM2](#option-2-manual-deployment-with-pm2)
3. [Database Setup](#database-setup)
4. [Nginx Reverse Proxy](#nginx-reverse-proxy)
5. [SSL/HTTPS Setup](#sslhttps-setup)
6. [Maintenance & Updates](#maintenance--updates)

---

## Option 1: Docker Deployment (Recommended)

### Step 1: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:./dev.db"
ENV NEXTAUTH_SECRET="temporary-secret-for-build"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_PUBLIC_LOCALE="en"
ENV NEXT_PUBLIC_APP_NAME="Sunday League Manager"

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Step 2: Create docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    container_name: sunday-league-manager
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/production.db
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXT_PUBLIC_LOCALE=${NEXT_PUBLIC_LOCALE}
      - NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
    volumes:
      - ./data:/app/data
    networks:
      - app-network

  # Optional: PostgreSQL instead of SQLite
  # postgres:
  #   image: postgres:16-alpine
  #   container_name: sunday-league-postgres
  #   restart: unless-stopped
  #   environment:
  #     - POSTGRES_USER=sunday_league
  #     - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
  #     - POSTGRES_DB=sunday_league
  #   volumes:
  #     - postgres-data:/var/lib/postgresql/data
  #   networks:
  #     - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

### Step 3: Create .env.production

```bash
# .env.production
DATABASE_URL="file:/app/data/production.db"
# OR for PostgreSQL:
# DATABASE_URL="postgresql://sunday_league:password@postgres:5432/sunday_league"

NEXTAUTH_SECRET="generate-a-strong-secret-with-32+-characters"
NEXTAUTH_URL="https://yourdomain.com"

NEXT_PUBLIC_LOCALE="en"
NEXT_PUBLIC_APP_NAME="Sunday League Manager"
```

### Step 4: Update next.config.ts for Standalone

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone', // Add this line
  webpack: (config) => {
    config.externals.push('@node-rs/argon2', '@node-rs/bcrypt');
    return config;
  },
  turbopack: {},
};
```

### Step 5: Deploy on Proxmox

SSH into your Proxmox VM/LXC container:

```bash
# SSH into your server
ssh root@your-server-ip

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y

# Create app directory
mkdir -p /opt/sunday-league-manager
cd /opt/sunday-league-manager

# Clone your repository
git clone https://github.com/maksm/sunday-league-manager.git .

# Create .env.production file
nano .env.production
# (Add your environment variables)

# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Build and run
docker compose up -d --build

# Check logs
docker compose logs -f

# Run database migrations
docker compose exec app npx prisma migrate deploy

# Create admin user
docker compose exec app npx tsx scripts/setup-admin.ts
```

---

## Option 2: Manual Deployment with PM2

### Step 1: Set Up VM/LXC Container

Create a new container in Proxmox:

- OS: Ubuntu 22.04 LTS
- RAM: 2GB minimum
- CPU: 2 cores
- Storage: 20GB

### Step 2: Install Prerequisites

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Git
apt install -y git
```

### Step 3: Clone and Setup Application

```bash
# Create app directory
mkdir -p /opt/sunday-league-manager
cd /opt/sunday-league-manager

# Clone repository
git clone https://github.com/maksm/sunday-league-manager.git .

# Install dependencies
npm ci --production=false

# Create .env.production
cat > .env.production << 'EOF'
DATABASE_URL="file:./data/production.db"
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_LOCALE="en"
NEXT_PUBLIC_APP_NAME="Sunday League Manager"
EOF

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
# Copy this and update .env.production

# Create data directory for SQLite
mkdir -p data

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build the application
npm run build

# Create admin user
npx tsx scripts/setup-admin.ts
```

### Step 4: Create PM2 Ecosystem File

```bash
# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sunday-league-manager',
    script: 'npm',
    args: 'start',
    cwd: '/opt/sunday-league-manager',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command that PM2 outputs

# Check status
pm2 status
pm2 logs
```

---

## Database Setup

### Option A: SQLite (Default - Good for Small/Medium Usage)

Already configured! Database will be created at `/app/data/production.db`

**Pros**: Simple, no extra setup
**Cons**: Not suitable for high concurrency

### Option B: PostgreSQL (Recommended for Production)

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Switch to postgres user
su - postgres

# Create database and user
psql
CREATE DATABASE sunday_league;
CREATE USER sunday_league_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE sunday_league TO sunday_league_user;
\q
exit

# Update .env.production
DATABASE_URL="postgresql://sunday_league_user:your-secure-password@localhost:5432/sunday_league"

# Update prisma/schema.prisma
# Change: provider = "sqlite"
# To:     provider = "postgresql"

# Regenerate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

---

## Nginx Reverse Proxy

### Install and Configure Nginx

```bash
# Install Nginx
apt install -y nginx

# Create site configuration
cat > /etc/nginx/sites-available/sunday-league << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for long operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/sunday-league /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

---

## SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure Nginx for HTTPS

# Test auto-renewal
certbot renew --dry-run

# Update NEXTAUTH_URL in .env.production
NEXTAUTH_URL="https://yourdomain.com"

# Restart app
pm2 restart all
# OR for Docker:
docker compose restart
```

---

## Firewall Configuration

```bash
# Install UFW (if not already installed)
apt install -y ufw

# Allow SSH (IMPORTANT!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## Backup Strategy

### Automated Backups Script

```bash
# Create backup script
cat > /opt/sunday-league-manager/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/sunday-league"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup SQLite database
cp /opt/sunday-league-manager/data/production.db $BACKUP_DIR/db_backup_$DATE.db

# OR for PostgreSQL:
# pg_dump sunday_league > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.db" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make executable
chmod +x /opt/sunday-league-manager/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/sunday-league-manager/backup.sh") | crontab -
```

---

## Maintenance & Updates

### Update Application

```bash
cd /opt/sunday-league-manager

# Pull latest changes
git pull

# Install new dependencies
npm ci

# Run new migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart PM2
pm2 restart all

# OR for Docker:
docker compose down
docker compose up -d --build
```

### Monitor Application

```bash
# PM2
pm2 monit
pm2 logs --lines 100

# Docker
docker compose logs -f --tail=100

# Check disk space
df -h

# Check memory
free -h

# Check system load
htop
```

---

## Troubleshooting

### Common Issues

**1. Port 3000 already in use**

```bash
lsof -i :3000
kill -9 <PID>
```

**2. Database locked (SQLite)**

```bash
# Stop application
pm2 stop all
# Wait a few seconds
pm2 start all
```

**3. Prisma migration fails**

```bash
# Reset database (CAUTION: loses data)
npx prisma migrate reset
npx prisma migrate deploy
```

**4. Environment variables not loaded**

```bash
# PM2: Restart with --update-env
pm2 restart all --update-env

# Docker: Recreate container
docker compose down
docker compose up -d
```

**5. Check application logs**

```bash
# PM2
pm2 logs --err

# Docker
docker compose logs app

# Nginx
tail -f /var/log/nginx/error.log
```

---

## Performance Optimization

### Enable Caching

```nginx
# Add to Nginx config
location /_next/static/ {
    proxy_pass http://localhost:3000;
    proxy_cache_valid 200 60m;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### PM2 Cluster Mode

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'sunday-league-manager',
      script: 'npm',
      args: 'start',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      // ... rest of config
    },
  ],
};
```

---

## Security Checklist

- [ ] Change default SSH port
- [ ] Disable root SSH login
- [ ] Set up fail2ban
- [ ] Enable UFW firewall
- [ ] Use strong database passwords
- [ ] Generate strong NEXTAUTH_SECRET (32+ characters)
- [ ] Enable HTTPS with SSL certificate
- [ ] Regular security updates: `apt update && apt upgrade`
- [ ] Set up automated backups
- [ ] Monitor logs regularly

---

## Quick Reference

### Useful Commands

```bash
# PM2
pm2 start ecosystem.config.js
pm2 stop all
pm2 restart all
pm2 logs
pm2 monit
pm2 delete all

# Docker
docker compose up -d
docker compose down
docker compose logs -f
docker compose restart
docker compose exec app sh

# Nginx
nginx -t                    # Test config
systemctl restart nginx
systemctl status nginx
tail -f /var/log/nginx/access.log

# Database
npx prisma studio           # Web UI for database
npx prisma migrate deploy   # Run migrations
npx tsx scripts/setup-admin.ts

# System
systemctl status <service>
journalctl -u <service> -f
htop
df -h
```

---

## Support

For issues or questions:

- GitHub: https://github.com/maksm/sunday-league-manager
- Check logs: `pm2 logs` or `docker compose logs`
- Review CLAUDE.md for application documentation
