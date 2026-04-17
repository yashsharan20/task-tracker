# Task Tracker

A task management app with a Node.js/Express backend and Next.js frontend. Users can sign up, log in, and manage their tasks. Built with MongoDB for storage and Redis for caching frequently accessed task lists.

---

## Stack

- **Backend** — Node.js, Express, TypeScript, Mongoose, Redis (ioredis)
- **Frontend** — Next.js 16, React, Tailwind CSS
- **Auth** — JWT + bcrypt
- **Testing** — Jest, Supertest, mongodb-memory-server

---

## Project Structure

```
task-tracker/
├── backend/
│   └── src/
│       ├── config/         # MongoDB and Redis connections
│       ├── controllers/    # Request handlers
│       ├── middleware/     # JWT auth, error handling
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Route definitions
│       ├── tests/
│       │   ├── unit/       # Middleware tests
│       │   └── integration/# API tests against in-memory DB
│       └── app.ts
└── frontend/
        ├── app/
        │   ├── auth/       # Login / signup
        │   └── dashboard/  # Task management UI
        ├── components/
        └── lib/            # API client, auth context
```

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud)

No MongoDB or Redis installed? Run them with Docker:

```bash
docker run -d -p 27017:27017 mongo
docker run -d -p 6379:6379 redis
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yashsharan20/task-tracker.git
cd task-tracker
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Set up environment variables


### 4. Start the servers

You'll need two terminal windows:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health check: http://localhost:5000/health

---

## API

### Auth

```
POST /api/auth/signup
POST /api/auth/login
```

Both endpoints accept JSON and return a JWT token plus the user object. All other endpoints require an `Authorization: Bearer <token>` header.

**Signup**
```json
{
  "name": "Yash",
  "email": "yash@example.com",
  "password": "yourpassword"
}
```

**Login**
```json
{
  "email": "yash@example.com",
  "password": "yourpassword"
}
```

**Response (both)**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { "id": "...", "name": "Yash", "email": "yash@example.com" }
  }
}
```

### Tasks

All routes require the `Authorization` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks for the logged-in user |
| GET | `/api/tasks?status=pending` | Filter by status (`pending` or `completed`) |
| GET | `/api/tasks?dueDate=2025-12-31` | Tasks due on or before this date |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

**Task body (create or update)**
```json
{
  "title": "Review pull request",
  "description": "Optional longer description",
  "status": "pending",
  "dueDate": "2025-12-31"
}
```

Only `title` is required on create. All fields are optional on update.

---

## Caching

`GET /api/tasks` (without filters) is cached in Redis per user with a 5-minute TTL. The cache is cleared whenever a task is created, updated, or deleted. Filtered requests (`?status=` or `?dueDate=`) always go straight to the database.

If Redis is unavailable the app falls back to the database without errors.

---

## Tests

Tests run entirely in memory — no local MongoDB or Redis needed.

```bash
cd backend

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

Coverage report opens at `backend/coverage/lcov-report/index.html`.

The test suite uses `mongodb-memory-server` for a real MongoDB instance spun up per test run, `ioredis-mock` for Redis, and `supertest` to make HTTP requests against the Express app.

---

## Notes

- Passwords are hashed with bcrypt at 12 salt rounds before being stored
- Auth endpoints are rate limited to 10 requests per 15 minutes per IP
- Tasks are scoped to the owner — users can only read and modify their own tasks
- The `owner` and `status` fields on the Task model are indexed for query performance