# ProjectFlow — MERN Project Management Tool

A full-stack project management application built with MongoDB, Express, React, and Node.js.

## Features

- **Authentication** — JWT-based register/login/logout
- **Projects** — Create, edit, delete projects with status, priority, color, tags & due dates
- **Tasks** — Full CRUD with status, priority, assignee, due date, estimated hours & tags
- **Kanban Board** — Drag-and-drop tasks across columns (To Do → In Progress → Review → Done)
- **List View** — Table view of all tasks with quick actions
- **Comments** — Per-task comment threads
- **Dashboard** — Stats overview, active projects with progress bars, my tasks
- **Team** — Assign tasks to any registered user



## API Endpoints

### Auth
| Method | Endpoint           | Description       |
|--------|--------------------|-------------------|
| POST   | /api/auth/register | Register new user |
| POST   | /api/auth/login    | Login             |
| GET    | /api/auth/me       | Get current user  |

### Projects
| Method | Endpoint                | Description           |
|--------|-------------------------|-----------------------|
| GET    | /api/projects           | List user's projects  |
| POST   | /api/projects           | Create project        |
| GET    | /api/projects/:id       | Get project           |
| PUT    | /api/projects/:id       | Update project        |
| DELETE | /api/projects/:id       | Delete project        |
| GET    | /api/projects/:id/stats | Task stats by status  |

### Tasks
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| GET    | /api/tasks?project=id     | List tasks (filtered)|
| POST   | /api/tasks                | Create task          |
| GET    | /api/tasks/:id            | Get task             |
| PUT    | /api/tasks/:id            | Update task          |
| DELETE | /api/tasks/:id            | Delete task          |
| POST   | /api/tasks/:id/comments   | Add comment          |
| PATCH  | /api/tasks/:id/status     | Quick status update  |

### Users
| Method | Endpoint         | Description      |
|--------|------------------|------------------|
| GET    | /api/users       | List all users   |
| PUT    | /api/users/profile | Update profile |

---

## Project Structure

```
backend/
├── server.js              # Express app entry point
├── .env.example           # Environment variables template
├── models/
│   ├── User.js            # User schema (auth, profile)
│   ├── Project.js         # Project schema
│   └── Task.js            # Task schema (with comments subdoc)
├── routes/
│   ├── auth.js            # Register / login / me
│   ├── projects.js        # Project CRUD + stats
│   ├── tasks.js           # Task CRUD + comments + status patch
│   └── users.js           # User list + profile update
└── middleware/
    └── auth.js            # JWT protect middleware

frontend/src/
├── App.js                 # Routes & providers
├── index.css              # Global styles (Catppuccin Mocha theme)
├── context/
│   └── AuthContext.js     # Auth state & helpers
├── utils/
│   └── api.js             # Axios instance with JWT interceptor
├── pages/
│   ├── Login.js           # Sign-in page
│   ├── Register.js        # Sign-up page
│   ├── Dashboard.js       # Overview with stats & widgets
│   ├── Projects.js        # Project grid with filters
│   └── ProjectDetail.js   # Kanban board + list view
└── components/
    ├── Layout.js           # Sidebar + topbar shell
    ├── ProjectModal.js     # Create/edit project form
    └── TaskModal.js        # Create/edit task + comments
```
