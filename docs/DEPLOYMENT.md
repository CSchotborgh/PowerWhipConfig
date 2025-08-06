# Deployment Guide

This guide covers deployment options for the Power Whip Configuration Tool.

## 🚀 Quick Deploy Options

### Replit Deployments (Recommended)
The easiest way to deploy this application is using Replit's built-in deployment system.

1. **Fork on Replit**: Import this repository to Replit
2. **Configure Environment**: Set up your environment variables in Replit Secrets
3. **Deploy**: Click the Deploy button in your Repl

**Environment Variables for Replit:**
```
DATABASE_URL=your_neon_postgresql_url
PGHOST=your_neon_host
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
PGPORT=5432
```

### Alternative Platforms

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

## 🗄️ Database Setup

### Neon Serverless (Recommended)
1. Create account at [Neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Add to environment variables

### PostgreSQL Self-Hosted
```bash
# Install PostgreSQL
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Create database
createdb power_whip_config

# Run migrations
npm run db:push
```

## 🔧 Production Configuration

### Environment Variables
Create production `.env` file:
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
PORT=3000

# Optional performance settings
NODE_OPTIONS="--max-old-space-size=4096"
UV_THREADPOOL_SIZE=128
```

### Build Configuration
```bash
# Production build
npm run build

# Start production server
npm start
```

### Performance Optimizations
```javascript
// vite.config.ts production settings
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-button'],
          'excel-vendor': ['xlsx', 'ag-grid-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

## 🔒 Security Considerations

### Environment Security
- Never commit `.env` files
- Use secure environment variable management
- Rotate database credentials regularly
- Enable SSL/TLS for database connections

### Application Security
```typescript
// Add security middleware
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### Database Security
```sql
-- Create restricted database user
CREATE USER power_whip_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE power_whip_config TO power_whip_app;
GRANT USAGE ON SCHEMA public TO power_whip_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO power_whip_app;
```

## 📊 Monitoring and Logging

### Application Monitoring
```typescript
// Add logging middleware
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Performance Monitoring
- Set up APM (Application Performance Monitoring)
- Monitor database query performance
- Track Excel processing times
- Monitor memory usage for large file uploads

## 🔄 CI/CD Pipeline

### GitHub Actions (Included)
The repository includes a comprehensive CI/CD pipeline:
- Automated testing on multiple Node.js versions
- Code quality checks (ESLint, Prettier)
- Security auditing
- Build verification

### Manual Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Build completed successfully
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Backup strategy implemented

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database connectivity
npx drizzle-kit studio
```

#### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Memory Issues with Large Files
```javascript
// Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"
```

### Performance Issues
- Enable database connection pooling
- Implement Redis caching for frequent queries
- Use CDN for static assets
- Optimize database indexes

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancers for multiple instances
- Implement session storage in Redis
- Use connection pooling for database
- Consider microservices architecture

### Vertical Scaling
- Monitor CPU and memory usage
- Optimize database queries
- Implement caching strategies
- Use background job processing

## 🔄 Updates and Maintenance

### Regular Maintenance
- Update dependencies monthly
- Monitor security advisories
- Database maintenance and optimization
- Performance monitoring and optimization

### Backup Strategy
```bash
# Database backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup setup
# Add to crontab: 0 2 * * * /path/to/backup_script.sh
```

---

For additional support, refer to the platform-specific documentation or create an issue in the GitHub repository.