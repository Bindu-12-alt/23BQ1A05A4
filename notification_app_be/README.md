# Campus Notifications Microservice

Production-ready Node.js/Express backend for campus notifications.

## Tech Stack
- Express.js, PostgreSQL (Sequelize ORM), Redis, AWS SQS, Socket.IO, JWT, Winston

## Setup

```bash
npm install
cp .env.example .env
# fill in your credentials
npm run dev
```

## Docker

```bash
docker-compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notifications` | Create notification |
| GET | `/api/v1/students/:studentId/notifications` | Get notifications (paginated) |
| PATCH | `/api/v1/notifications/:id/read` | Mark as read |
| GET | `/api/v1/students/:studentId/unread-count` | Get unread count |
| DELETE | `/api/v1/notifications/:id` | Delete notification |
| GET | `/api/v1/priority-inbox?n=10` | Get top N priority notifications |

## Workers

```bash
npm run worker:email   # Email worker (SQS consumer)
npm run worker:push    # Push worker (SQS consumer)
```

## Auth
All routes require `Authorization: Bearer <token>` header.
