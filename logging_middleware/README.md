# Logging Middleware

Node.js/Express logging middleware using Winston and Morgan.

## Features
- Logs method, URL, status code, response time per request
- Structured JSON logs
- Error logging with stack traces
- Separate error and combined log files in `/logs`

## Setup
```bash
npm install
npm run dev
```

## Log Files
- `logs/combined.log` — all logs
- `logs/error.log` — errors only

## Endpoints
- `GET /api/health` — health check
- `GET /api/error-test` — triggers error logging
