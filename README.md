# Course Management System — Frontend

React 18 + Vite single-page app for the course backend (Express + MongoDB, in `../backend`).

```
frontend/
├── index.html             # Vite entry page
├── main.jsx               # Mounts React, router, auth provider
├── App.jsx                # Header, navigation, routes
├── auth.jsx               # Auth state (JWT) + login/register page
├── api.js                 # fetch wrapper, upload, authenticated download
├── pages.jsx              # Courses, course page, My learning, instructor dashboard
├── files.jsx              # Course files (upload/download/delete) + JSON course import
├── styles.css             # All styling (light and dark mode)
├── vite.config.js
├── package.json
├── .env.example           # Copy to .env
├── .gitignore
└── README.md
```

## Features
- Sign up / log in as a **student** or **instructor**
- Everyone: browse and search courses, view lessons
- Students: enroll / unenroll, tick lessons complete, see progress per course (*My learning*)
- Instructors: create and delete courses, add and delete lessons, see enrolled students with their progress (*My courses*)
- Course files: instructors upload and delete files (optionally per lesson); enrolled students download them
- Instructors: bulk-import courses from a JSON file

## Requirements
- Node.js 18 or newer
- The backend running (see `../backend/README.md`)

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```
Open the address Vite prints, normally **`http://localhost:5173`**.

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Serve the production build locally |

## Environment variables (`.env`)
| Name | Description |
|---|---|
| `VITE_API_URL` | Backend address, default `http://localhost:5000/api` |

The port must match `PORT` in the backend `.env`, and the value must end in `/api` with no trailing slash. Vite reads `.env` only at startup, so **restart `npm run dev` after changing it**.

## Try it
1. Start MongoDB and the backend (`npm run seed`, then `npm run dev`).
2. Log in as `instructor@example.com` / `password123` to manage courses, files and imports.
3. Log in as `student@example.com` / `password123` to enroll and track progress.

## Where things are
- **Backend address:** `VITE_API_URL` in `.env` (fallback in `api.js`)
- **Upload size limit:** `MAX_MB` in `files.jsx`; keep it equal to `MAX_FILE_MB` in the backend `.env`
- **Colors and layout:** CSS variables at the top of `styles.css`
- **Screens:** `pages.jsx`; **login:** `auth.jsx`; **routes and navigation:** `App.jsx`

## Troubleshooting
| Problem | Fix |
|---|---|
| Page only shows "Loading…" | Start with `npm run dev` and open the localhost address. Opening `index.html` directly or using Live Server does not work. |
| "React is not defined" | Make sure `vite.config.js` is next to `package.json`, then `npm install` and restart |
| "Cannot reach the server" / "Failed to fetch" | Start the backend, check `http://localhost:5000/api/health`, and check `VITE_API_URL` |
| "No courses found." | Run `npm run seed` in the backend, or create or import a course as an instructor |
| CORS error | Set `CLIENT_URL` in the backend `.env` to this app's address and restart the backend |
