# TaskFlow – Team Task Manager

A full-stack collaborative task management web application. Teams can create projects, assign tasks, and track progress with role-based access control.

## Live Demo
> https://team-task-manager-production-3e6e.up.railway.app/

## Features

- **User Authentication** – Signup/login with JWT tokens
- **Project Management** – Create projects; admin adds/removes members
- **Task Management** – Create tasks with title, description, due date, priority, and assignee
- **Status Tracking** – To Do → In Progress → Done
- **Role-Based Access** – Admins manage everything; Members update only their assigned tasks
- **Dashboard** – Stats for total tasks, tasks by status, tasks per user, and overdue tasks

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | React 18, Vite, React Router |
| Backend    | Node.js, Express             |
| Database   | SQLite (via better-sqlite3)  |
| Auth       | JWT (jsonwebtoken + bcryptjs)|
| Deployment | Railway                      |

---

## Local Setup

### Prerequisites
- Node.js v18+
- npm

### 1. Clone the repo

```bash
git clone https://github.com/raghavendra-54/team-task-manager.git
cd team-task-manager
```

### 2. Setup backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Setup frontend (new terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Open the app
Visit `http://localhost:5173`, create an account, and start managing tasks!

---

## Deployment on Railway

### Step-by-step:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
   git push -u origin main
   ```

2. **Create Railway project**
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
   - Connect your repository

3. **Set Environment Variables** in Railway dashboard:
   ```
   JWT_SECRET=anyrandomlongstring123456789
   NODE_ENV=production
   PORT=5000
   ```

4. **Deploy** – Railway auto-detects the `railway.toml` and runs:
   - Build: `npm run build` (builds React frontend)
   - Start: `npm start` (starts Express server which serves the frontend)

5. **Get your URL** from the Railway dashboard and add it to your submission!

---

## API Endpoints

### Auth
| Method | Endpoint         | Description          |
|--------|-----------------|----------------------|
| POST   | /api/auth/signup | Register new user    |
| POST   | /api/auth/login  | Login, returns JWT   |
| GET    | /api/auth/me     | Get current user     |

### Projects
| Method | Endpoint                        | Role     | Description           |
|--------|---------------------------------|----------|-----------------------|
| GET    | /api/projects                   | Any      | List my projects      |
| POST   | /api/projects                   | Any      | Create project        |
| GET    | /api/projects/:id               | Member+  | Get project details   |
| PUT    | /api/projects/:id               | Admin    | Update project        |
| DELETE | /api/projects/:id               | Admin    | Delete project        |
| POST   | /api/projects/:id/members       | Admin    | Add member by email   |
| DELETE | /api/projects/:id/members/:uid  | Admin    | Remove member         |

### Tasks
| Method | Endpoint                        | Role     | Description           |
|--------|---------------------------------|----------|-----------------------|
| GET    | /api/projects/:id/tasks         | Member+  | List project tasks    |
| POST   | /api/projects/:id/tasks         | Admin    | Create task           |
| GET    | /api/tasks/:id                  | Member+  | Get task details      |
| PUT    | /api/tasks/:id                  | Member+  | Update task           |
| DELETE | /api/tasks/:id                  | Admin    | Delete task           |
| GET    | /api/dashboard                  | Any      | Dashboard statistics  |

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── db.js              # SQLite database setup
│   ├── middleware/
│   │   └── auth.js        # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js        # Auth routes
│   │   ├── projects.js    # Project CRUD routes
│   │   └── tasks.js       # Task CRUD + dashboard routes
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Routes setup
│   │   ├── api.js         # Axios instance with auth
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   └── ProjectDetail.jsx
│   │   └── components/
│   │       └── Layout.jsx
│   └── package.json
├── railway.toml           # Railway deployment config
├── package.json           # Root scripts
└── README.md
```

---

## Database Schema

```sql
users         (id, name, email, password, created_at)
projects      (id, name, description, admin_id, created_at)
project_members (id, project_id, user_id, role, joined_at)
tasks         (id, title, description, due_date, priority, status,
               project_id, assigned_to, created_by, created_at, updated_at)
```

---

## Demo Video Checklist
1. Sign up as Admin user
2. Create a project
3. Add a second user as member
4. Create tasks with priorities and due dates
5. Assign tasks to members
6. Log in as member → update task status
7. Show dashboard stats and overdue tasks
