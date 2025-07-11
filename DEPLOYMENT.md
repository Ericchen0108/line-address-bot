# Deployment Guide

## Environment Separation

This project supports multiple environments: development, production, and testing.

### Environment Files

- `.env.development` - Development settings
- `.env.production` - Production settings  
- `.env` - Default/local overrides (gitignored)

### Running Different Environments

```bash
# Development (with hot reload)
npm run dev

# Production
npm run start:prod

# Testing
npm run test
```

### Environment Variables

| Variable | Description | Dev | Prod |
|----------|-------------|-----|------|
| `NODE_ENV` | Environment name | development | production |
| `PORT` | Server port | 8080 | 8080 |
| `CHANNEL_SECRET` | LINE Bot channel secret | dev_secret | prod_secret |
| `CHANNEL_ACCESS_TOKEN` | LINE Bot access token | dev_token | prod_token |
| `DB_PATH` | Database file path | ./address-dev.db | ./address.db |
| `LOG_LEVEL` | Logging level | debug | info |

## Railway Deployment

### Production Environment Variables

Set these in Railway dashboard:

```
NODE_ENV=production
CHANNEL_SECRET=your_production_channel_secret
CHANNEL_ACCESS_TOKEN=your_production_channel_access_token
LOG_LEVEL=info
```

### Deployment Commands

```bash
# Deploy current branch to Railway
railway up

# Deploy specific environment
railway up --environment production
```

## Local Development Setup

1. Copy environment template:
```bash
cp .env.development .env
```

2. Update `.env` with your development LINE Bot credentials

3. Start development server:
```bash
npm run dev
```

4. Test the API:
```bash
curl http://localhost:8080
```

## Health Check

The `/` endpoint provides environment information:

```json
{
  "message": "LINE Address Bot is running!",
  "timestamp": "2025-01-11T...",
  "environment": "development",
  "version": "1.0.0",
  "env": {
    "hasChannelSecret": true,
    "hasChannelAccessToken": true
  }
}
```

## Database Management

- Development uses `./address-dev.db`
- Production uses `./address.db`
- Database is automatically created and populated from API on first run
- Use different database files to prevent dev/prod data conflicts

## Testing

```bash
# Run tests in test environment
npm run test

# Run tests in development environment  
npm run test:dev
```

## Logging

- Development: `debug` level (verbose)
- Production: `info` level (essential only)
- Logs include environment context for debugging

## Security

- Environment files with secrets are gitignored
- Use Railway environment variables for production secrets
- Never commit real credentials to version control