# Merlin BESS Quote Builder - Deployment Guide

## 🚀 Deployment Options

### Option 1: Traditional Server Deployment

#### Prerequisites
- Node.js 18+ installed
- Git access to your repository
- Domain name and SSL certificate (recommended)

#### Steps

1. **Clone the repository on your server:**
```bash
git clone https://github.com/ugobe007/Merlin.git
cd Merlin
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the production application:**
```bash
npm run build
```

4. **Set environment variables:**
```bash
export NODE_ENV=production
export PORT=5001
```

5. **Start the application:**
```bash
npm start
```

6. **Set up process manager (PM2 recommended):**
```bash
npm install -g pm2
pm2 start server/index.cjs --name "merlin-bess"
pm2 startup
pm2 save
```

### Option 2: Docker Deployment

#### Build and run with Docker:

```bash
# Build the Docker image
docker build -t merlin-bess-quote-builder .

# Run the container
docker run -d \
  --name merlin-bess \
  -p 5001:5001 \
  -v $(pwd)/server/data:/app/server/data \
  merlin-bess-quote-builder
```

#### Using Docker Compose:

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  merlin-bess:
    build: .
    ports:
      - "5001:5001"
    volumes:
      - ./server/data:/app/server/data
    environment:
      - NODE_ENV=production
      - PORT=5001
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

### Option 3: Cloud Platform Deployment

#### Heroku
1. Install Heroku CLI
2. Create Heroku app: `heroku create your-app-name`
3. Set buildpack: `heroku buildpacks:set heroku/nodejs`
4. Configure environment variables in Heroku dashboard
5. Deploy: `git push heroku main`

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts for deployment

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set run command: `npm start`
4. Configure environment variables

### Option 4: VPS/Cloud Server (Ubuntu/CentOS)

#### Setup steps:

1. **Update system:**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install Nginx (reverse proxy):**
```bash
sudo apt install nginx -y
```

4. **Configure Nginx:**
Create `/etc/nginx/sites-available/merlin-bess`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Enable site and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/merlin-bess /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Install SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Set to 'production' for production deployment
- `PORT`: Port number (default: 5001)
- `DB_PATH`: SQLite database path
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

### Database Setup
The SQLite database will be automatically created on first run at:
- Development: `./server/data/merlin_quotes.db`
- Production: Ensure data directory is writable

### File Uploads
- Template files are stored in `./server/templates/`
- Ensure directory exists and is readable
- Maximum upload size: 5MB (configurable)

## 🔍 Monitoring

### Health Check Endpoint
```bash
curl http://your-domain.com/api/health
```

### Database Statistics
```bash
curl http://your-domain.com/api/db/stats
```

### Logs
- PM2 logs: `pm2 logs merlin-bess`
- Docker logs: `docker logs merlin-bess`

## 🛡️ Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **CORS**: Configure allowed origins properly
3. **Rate Limiting**: Consider implementing rate limiting
4. **File Uploads**: Validate file types and sizes
5. **Database**: Regular backups of SQLite database
6. **SSL**: Always use HTTPS in production

## 📊 Performance Optimization

1. **Compression**: Enabled via compression middleware
2. **Caching**: Static files cached by Nginx
3. **Database**: SQLite with proper indexing
4. **Memory**: Monitor Node.js memory usage
5. **CDN**: Consider CDN for static assets

## 🔄 Updates and Maintenance

### Application Updates:
```bash
git pull origin main
npm install
npm run build
pm2 restart merlin-bess
```

### Database Backup:
```bash
cp server/data/merlin_quotes.db server/data/merlin_quotes_backup_$(date +%Y%m%d).db
```

### Monitoring Disk Space:
```bash
df -h
```

## 🆘 Troubleshooting

### Common Issues:
1. **Port conflicts**: Change PORT environment variable
2. **Database permissions**: Ensure data directory is writable
3. **Template files**: Verify template directory exists
4. **CORS errors**: Check ALLOWED_ORIGINS configuration
5. **Build failures**: Clear node_modules and reinstall

### Logs Location:
- Application logs: PM2 or Docker logs
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -u nginx`

## 📞 Support

For deployment assistance, check:
1. Application logs for error messages
2. Network connectivity and firewall settings
3. SSL certificate validity
4. Database file permissions
5. Environment variable configuration