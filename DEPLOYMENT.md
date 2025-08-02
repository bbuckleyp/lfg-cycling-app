# LFG Cycling App - Deployment Guide

This guide covers how to deploy the LFG Cycling App in both development and production environments.

## Prerequisites

Before deploying, ensure you have:

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- A [Strava API application](https://developers.strava.com/) created
- A domain name (for production deployment)

## Quick Start (Development)

1. **Clone the repository and navigate to the project directory**
   ```bash
   git clone <repository-url>
   cd lfg-cycling-app
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   ./deploy.sh start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## Environment Configuration

### Development Environment

Copy `.env.example` to `.env` and configure:

```bash
# Database Configuration
DB_PASSWORD=your_secure_database_password
DATABASE_URL=postgresql://lfg_user:your_secure_database_password@localhost:5432/lfg_cycling

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# Strava API Configuration
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret

# Application URLs
FRONTEND_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:5000/api
```

### Production Environment

Copy `.env.production.example` to `.env.production` and configure:

```bash
# Domain Configuration
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# Use strong passwords and secrets
DB_PASSWORD=your_very_secure_database_password_at_least_32_chars
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_for_security
REDIS_PASSWORD=your_secure_redis_password_at_least_16_chars

# Strava API Configuration
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret

# Application URLs
FRONTEND_URL=https://yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## Deployment Commands

The `deploy.sh` script provides convenient commands for managing the application:

### Basic Commands

```bash
# Start the application
./deploy.sh start

# Stop the application
./deploy.sh stop

# Restart the application
./deploy.sh restart

# View logs
./deploy.sh logs

# Check service status
./deploy.sh status
```

### Production Commands

```bash
# Deploy to production
./deploy.sh -e production start

# Pull updates and deploy
./deploy.sh -e production pull

# Create database backup
./deploy.sh -e production backup

# Deploy with automatic backup
./deploy.sh -e production -b start
```

### Maintenance Commands

```bash
# Build Docker images
./deploy.sh build

# Run database migrations
./deploy.sh migrate

# Create database backup
./deploy.sh backup
```

## Production Deployment

### Server Setup

1. **Prepare your server**
   - Ubuntu 20.04+ or similar Linux distribution
   - Docker and Docker Compose installed
   - Domain name pointing to your server
   - Ports 80 and 443 open for HTTP/HTTPS traffic

2. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lfg-cycling-app
   ```

3. **Configure environment**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your production values
   ```

4. **Create Docker network for Traefik**
   ```bash
   docker network create web
   ```

5. **Deploy the application**
   ```bash
   ./deploy.sh -e production start
   ```

### DNS Configuration

Set up the following DNS records:

```
A    yourdomain.com        -> YOUR_SERVER_IP
A    api.yourdomain.com    -> YOUR_SERVER_IP
A    traefik.yourdomain.com -> YOUR_SERVER_IP  (optional, for Traefik dashboard)
```

### SSL Certificates

The production setup uses Traefik with Let's Encrypt for automatic SSL certificates. Make sure:

- Your domain is pointing to your server
- Ports 80 and 443 are accessible
- The `ACME_EMAIL` is set in your `.env.production` file

### Strava API Configuration

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new application
3. Set the authorization callback domain to your production domain
4. Update your `.env.production` with the client ID and secret

## Monitoring and Maintenance

### Health Checks

All services include health checks. Check service status:

```bash
./deploy.sh status
```

### Logs

View application logs:

```bash
# All services
./deploy.sh logs

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Database Backups

Create regular database backups:

```bash
# Manual backup
./deploy.sh backup

# Automated backup (add to crontab)
0 2 * * * cd /path/to/lfg-cycling-app && ./deploy.sh backup
```

### Updates

Pull the latest code and update:

```bash
# Development
./deploy.sh pull

# Production (with backup)
./deploy.sh -e production -b pull
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   - Make sure ports 3000, 5000, and 5432 are not in use
   - Use `docker-compose ps` to check running services

2. **Database connection issues**
   - Verify `DATABASE_URL` in your environment file
   - Check if PostgreSQL container is healthy: `docker-compose ps`

3. **Strava API issues**
   - Verify your Strava client ID and secret
   - Check that your callback URL is correctly configured

4. **SSL certificate issues (production)**
   - Ensure your domain is pointing to the server
   - Check Traefik logs: `docker-compose logs traefik`
   - Verify ports 80 and 443 are accessible

### Service Management

```bash
# Restart specific service
docker-compose restart backend

# Rebuild specific service
docker-compose build --no-cache frontend

# View service logs
docker-compose logs -f postgres

# Execute commands in container
docker-compose exec backend bash
docker-compose exec postgres psql -U lfg_user -d lfg_cycling
```

### Performance Tuning

For production deployments, consider:

1. **Database optimization**
   - Increase PostgreSQL shared_buffers
   - Set up connection pooling
   - Regular VACUUM and ANALYZE

2. **Redis caching**
   - Configure Redis memory limits
   - Set up Redis persistence

3. **Container resources**
   - Set memory and CPU limits in docker-compose files
   - Monitor resource usage with `docker stats`

## Security Considerations

1. **Environment variables**
   - Use strong passwords (32+ characters)
   - Never commit `.env` files to version control
   - Rotate secrets regularly

2. **Database security**
   - Use strong database passwords
   - Limit database access to application containers only
   - Regular security updates

3. **HTTPS/SSL**
   - All production traffic should use HTTPS
   - HSTS headers are configured in production
   - Regular certificate renewals via Let's Encrypt

4. **Container security**
   - Containers run as non-root users
   - Regular base image updates
   - Security scanning with tools like `docker scan`

## Support

For issues and questions:

1. Check the logs: `./deploy.sh logs`
2. Verify service status: `./deploy.sh status`
3. Review this deployment guide
4. Check the application's README.md for development information

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │────│     Traefik     │────│     Backend     │
│   (React App)   │    │  (Load Balancer)│    │   (Node.js)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │                 │
                                               │   PostgreSQL    │
                                               │   (Database)    │
                                               │                 │
                                               └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │                 │
                                               │     Redis       │
                                               │   (Caching)     │
                                               │                 │
                                               └─────────────────┘
```

This setup provides:
- High availability with health checks
- Automatic SSL certificates
- Horizontal scaling capabilities
- Security best practices
- Easy backup and recovery