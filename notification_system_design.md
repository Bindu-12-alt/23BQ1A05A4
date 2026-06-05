# Campus Notifications Microservice – System Design

---

## Stage 1 – REST API Design

### Platform Support
- Placement notifications
- Event notifications
- Result notifications

### Endpoints
Implemented in `notification_app_be/src/routes/notifications.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notifications` | Create notification |
| GET | `/api/v1/students/:studentId/notifications` | Get student notifications (paginated) |
| PATCH | `/api/v1/notifications/:id/read` | Mark notification as read |
| GET | `/api/v1/students/:studentId/unread-count` | Get unread count |
| DELETE | `/api/v1/notifications/:id` | Delete notification |
| GET | `/api/v1/priority-inbox?n=10` | Get top N priority notifications |

### Headers
All routes are protected with JWT authentication (`src/middleware/auth.js`):
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Create Notification – Request
```json
{
  "type": "Placement",
  "title": "Microsoft Hiring",
  "message": "Applications open",
  "targetAudience": "all"
}
```

### Create Notification – Response
```json
{
  "notificationId": "uuid",
  "status": "created"
}
```

### Notification Schema
Defined in `notification_app_be/src/models/Notification.js`:
```json
{
  "id": "uuid",
  "studentId": 1042,
  "type": "Placement",
  "title": "Microsoft Hiring",
  "message": "Applications Open",
  "isRead": false,
  "createdAt": "2026-04-22T17:51:18Z"
}
```

### Real-Time Notifications – Socket.IO
Implemented in `notification_app_be/src/sockets/notificationSocket.js`:
```
Student Browser ↔ Socket.IO Gateway ↔ Notification Service
```
- Students connect with `?studentId=<id>` query param
- Server pushes events via `io.to(socketId).emit('notification', data)`
- Benefits: real-time delivery, low latency, no polling

---

## Stage 2 – Database Design

### Recommended: PostgreSQL
- ACID compliance, strong indexing, mature ecosystem

### Schema
Implemented via Sequelize ORM in `notification_app_be/src/models/`:

```sql
CREATE TABLE students (
  id    BIGINT PRIMARY KEY,
  email VARCHAR(255),
  name  VARCHAR(255)
);

CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        BIGINT REFERENCES students(id),
  notification_type VARCHAR(20),
  title             TEXT,
  message           TEXT,
  is_read           BOOLEAN   DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT NOW()
);
```

### Indexes
Defined in `notification_app_be/src/models/Notification.js`:
```sql
CREATE INDEX idx_notifications_student_read_created
  ON notifications(student_id, is_read, created_at DESC);

CREATE INDEX idx_type_created
  ON notifications(notification_type, created_at DESC);
```

### Scaling Strategy
- **Partitioning**: Monthly partitions (`notifications_2026_01`, `notifications_2026_02`)
- **Archiving**: Move records older than 1 year to cold storage
- **Read Replicas**: Route all SELECT queries to replicas

### Sample Queries
Used in `notification_app_be/src/repositories/notificationRepository.js`:

Unread notifications:
```sql
SELECT * FROM notifications
WHERE student_id = $1 AND is_read = FALSE
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

Mark as read:
```sql
UPDATE notifications SET is_read = TRUE WHERE id = $1;
```

Unread count:
```sql
SELECT COUNT(*) FROM notifications
WHERE student_id = $1 AND is_read = FALSE;
```

---

## Stage 3 – Query Optimization

### Problematic Query
```sql
SELECT * FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

### Why It Becomes Slow at 5M Rows
Without an index, PostgreSQL does a full sequential scan — `O(N)` — across all 5M rows, then filters and sorts. This causes severe performance degradation under load.

### Fix – Composite Index
Applied in `notification_app_be/src/models/Notification.js`:
```sql
CREATE INDEX idx_notifications_student_read_created
  ON notifications(student_id, is_read, created_at DESC);
```
Reduces lookup from `O(N)` full scan to `O(log N)` index seek.

### Why Not Index Every Column?
- Each index consumes disk space and RAM
- Every INSERT/UPDATE must update all indexes → slower writes
- Too many indexes confuse the PostgreSQL query planner

### Placement Notifications – Last 7 Days
```sql
SELECT * FROM notifications
WHERE notification_type = 'Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

Supported by index:
```sql
CREATE INDEX idx_type_created
  ON notifications(notification_type, created_at DESC);
```

---

## Stage 4 – Performance Improvements

### Solutions Implemented

| Solution | File | Benefit |
|----------|------|---------|
| Redis Cache | `src/config/redis.js`, `src/services/notificationService.js` | Faster reads, reduced DB load |
| Socket.IO | `src/sockets/notificationSocket.js` | Real-time push, no polling |
| Pagination | `GET /notifications?page=1&limit=20` | Smaller payloads |
| Rate Limiting | `src/app.js` (express-rate-limit) | Prevents abuse |

### Caching Strategy
In `notification_app_be/src/services/notificationService.js`:
- Notifications cached for **60 seconds** per student per page
- Unread count cached for **30 seconds**
- Cache invalidated on create, mark-read, delete

### Recommended Architecture
```
Client
  ↓
Socket.IO Gateway  (src/sockets/notificationSocket.js)
  ↓
Notification Service  (src/services/notificationService.js)
  ↓
Redis Cache  (src/config/redis.js)
  ↓
PostgreSQL via Sequelize  (src/config/db.js)
```

---

## Stage 5 – Mass Notification Reliability

### Scenario
HR clicks "Notify All" → 50,000 students receive email + in-app notification.

### Old (Broken) Approach
```javascript
for (student of students) {
  send_email();    // sequential, no retry
  save_to_db();
  push_to_app();
}
```

### Problems
- Sequential: extremely slow for 50K students
- No retries: any failure loses the notification
- Partial failures: inconsistent state
- Tight coupling: all operations depend on each other

### Redesigned Architecture
Implemented across `src/services/notificationService.js`, `src/queues/sqsProducer.js`, `src/workers/`:

```
Notification Service
  ↓
PostgreSQL (bulk insert in batches of 1000)
  ↓
AWS SQS  (src/queues/sqsProducer.js)
  ↓
Email Worker  (src/workers/emailWorker.js)
Push Worker   (src/workers/pushWorker.js)
  ↓
Socket.IO Gateway
```

### Outbox Pattern
```sql
BEGIN;
  INSERT INTO notifications ...;
COMMIT;
-- then publish to SQS
```

### Dead Letter Queue
- `maxReceiveCount = 5` retries
- Failed messages → `notification-dlq`

### Revised Implementation
`notification_app_be/src/services/notificationService.js`:
```javascript
// Batch insert 1000 at a time
const records = students.map(s => ({ id: uuidv4(), student_id: s.id, ...payload }));
await repo.bulkCreate(records);
await publishToQueue({ studentIds, ...payload });
```

`notification_app_be/src/workers/emailWorker.js`:
```javascript
while (true) {
  const messages = await sqs.receive();
  for (const msg of messages) {
    await sendEmail(msg);
    await sqs.delete(msg);
  }
}
```

---

## Stage 6 – Priority Inbox

### Requirement
Return top N notifications ranked by priority score.
Implemented in `notification_app_be/src/services/priorityInboxService.js`

### Data Source
```
GET http://4.224.186.213/evaluation-service/notifications
Authorization: Bearer <token>
```

### Type Weights

| Type | Weight |
|------|--------|
| Placement | 100 |
| Result | 60 |
| Event | 30 |

### Scoring Formula
```javascript
const ageInDays = (Date.now() - new Date(n.Timestamp).getTime()) / 86400000;
const score = typeWeight + Math.max(0, 30 - ageInDays);
```

### Score Examples

| Type | Age | Score |
|------|-----|-------|
| Placement | 1 day | 129 |
| Placement | 10 days | 120 |
| Result | 1 day | 89 |
| Event | 1 day | 59 |

### Why Min Heap?
Implemented in `notification_app_be/src/utils/MinHeap.js`:

- **Build top N from M notifications:** `O(M log N)`
- **New notification arrives:** compare with heap min, replace if higher → `O(log N)`
- For N=10: build ≈ `O(M)`, each insert ≈ `O(1)`
- Naive sort would be `O(M log M)` — worse for large M

### Algorithm
```javascript
for (const n of notifications) {
  const score = computeScore(n);
  if (heap.size() < topN) {
    heap.push({ ...n, score });
  } else if (score > heap.peek().score) {
    heap.pop();
    heap.push({ ...n, score });
  }
}
// extract descending
const result = [];
while (heap.size() > 0) result.unshift(heap.pop());
```

### API Endpoint
```
GET /api/v1/priority-inbox?n=10
Authorization: Bearer <token>
```

Response:
```json
{
  "notifications": [
    { "ID": "uuid", "Type": "Placement", "Message": "Microsoft hiring", "Timestamp": "...", "score": 129 },
    { "ID": "uuid", "Type": "Result",    "Message": "mid-sem results",  "Timestamp": "...", "score": 89  }
  ]
}
```
