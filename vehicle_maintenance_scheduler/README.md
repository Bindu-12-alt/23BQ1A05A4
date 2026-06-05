# Vehicle Maintenance Scheduler

Node.js/Express backend for scheduling and managing vehicle maintenance.

## Features
- CRUD for vehicles and maintenance schedules
- Daily cron reminder for upcoming maintenance
- Joi validation
- PostgreSQL storage

## Setup
```bash
npm install
cp .env.example .env
# fill in DB credentials
npm run dev
```

## API Endpoints

### Vehicles
- `POST /api/vehicles` — create vehicle
- `GET /api/vehicles` — list all vehicles
- `GET /api/vehicles/:id` — get vehicle
- `PUT /api/vehicles/:id` — update vehicle
- `DELETE /api/vehicles/:id` — delete vehicle

### Schedules
- `POST /api/schedules` — create schedule
- `GET /api/schedules` — list all schedules
- `GET /api/schedules/vehicle/:vehicleId` — schedules by vehicle
- `PUT /api/schedules/:id` — update schedule
- `DELETE /api/schedules/:id` — delete schedule
