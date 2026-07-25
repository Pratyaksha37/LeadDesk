# LeadDesk Mini

A full-stack lead management system with a public inquiry form, admin dashboard with search and status management, real authentication via Supabase Auth, and PostgreSQL data storage.

---

## Overview

LeadDesk Mini is a lead capture and management tool. Visitors submit project inquiries through a polished landing page. Admin users authenticate via Supabase Auth to view, search, filter, update statuses, and delete leads through a protected dashboard.

---

## Features

- **Landing Page** — Hero section, value propositions, inline lead capture form
- **Lead Form** — Name, email, budget range (select), and message fields
- **Client-side Validation** — Instant feedback via Zod + react-hook-form
- **Server-side Validation** — All inputs re-validated on the backend; client cannot be trusted
- **Database Storage** — Leads persisted in Supabase PostgreSQL
- **Supabase Auth** — Real email/password authentication (not a fake admin check)
- **Protected Admin Route** — Unauthenticated users are redirected to `/login`
- **Admin Dashboard** — View all leads with name, email, budget, message preview, date, status
- **Search** — Filter leads by name, email, or message content with debounced input
- **Status Filter** — Filter by New / Contacted / Closed
- **Status Management** — Change any lead's status via dropdown menu; persists to database
- **Lead Deletion** — Delete leads with confirmation dialog
- **Stats Cards** — Total leads + counts per status

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4 |
| Backend | Express.js (Node.js) |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Form Validation | Zod + react-hook-form |
| Server-state | TanStack Query (React Query) |
| Routing | wouter |
| UI Components | Radix UI primitives (shadcn-style) |
| Deployment-ready | Vite build output + Express server |

---

## Architecture

```
User Browser
     │
     ├── Landing Page (/) ────── POST /api/leads ──┐
     │                                              │
     ├── Login (/login) ───── Supabase Auth ──────┐│
     │                                            ││
     └── Admin (/admin) ───── GET/PATCH/DELETE    ││
                              /api/leads/*        ││
                                                  ▼▼
                                          Express Server
                                         (server/index.js)
                                                  │
                                          ┌───────┴────────┐
                                          │  Supabase DB   │
                                          │  (PostgreSQL)  │
                                          └────────────────┘
```

- The Vite dev server proxies `/api/*` requests to the Express backend (port 3001)
- The Express server handles all business logic, validation, and database interaction
- Supabase Service Role Key is used server-side only (never exposed to the client)
- The browser client uses the Supabase Anon Key with RLS policies for auth

---

## Database Schema

```sql
leads
├── id            BIGINT (primary key, auto-increment)
├── name          TEXT NOT NULL
├── email         TEXT NOT NULL
├── budget_range  TEXT NOT NULL
├── message       TEXT NOT NULL
├── status        TEXT NOT NULL DEFAULT 'new'
│                 CHECK (status IN ('new', 'contacted', 'closed'))
└── created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Status values: `new` → `contacted` → `closed`

---

## Authentication Approach

Supabase Auth with email/password. The flow:

1. Admin visits `/admin`, gets redirected to `/login`
2. Admin enters email + password → Supabase validates credentials → session cookie set
3. Protected route checks Supabase session; grants access if authenticated
4. The Express backend validates the session token on every admin API call via `Authorization: Bearer <token>`
5. Sign-out clears the Supabase session

Security boundaries:
- **Frontend**: hides admin features when signed out, redirects to login
- **Backend**: rejects unauthenticated API requests with 401
- **Database RLS**: authenticates users can only SELECT/UPDATE/DELETE; anyone can INSERT

---

## Local Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### 1. Clone and install

```bash
git clone <repo-url> leaddesk-mini
cd leaddesk-mini
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root (use `.env.example` as template):

```env
# Supabase (public - used by frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase (secret - used by backend only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server port
PORT=3001
```

### 3. Database Setup

Open your Supabase dashboard → **SQL Editor** → paste and run the schema in `supabase-schema.sql`.

Alternatively, run via the Supabase CLI:

```bash
supabase db push
```

### 4. Create an admin user

You have two options:

**Option A: Supabase Dashboard**
- Go to Authentication → Users → Invite user or Add user
- Set email + password

**Option B: API endpoint** (after starting the server)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```

---

## Running the Project

### Development (frontend + backend)

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

Then open http://localhost:5173

### Production build

```bash
npm run build
node server/index.js
```

The Express server serves the built frontend from `dist/` and the API routes from `/api/*`.

---

## Deployment (Vercel)

### 1. Prerequisites

- A [Vercel](https://vercel.com) account (free)
- The project pushed to GitHub (`https://github.com/Pratyaksha37/LeadDesk`)

### 2. Deploy

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repo (`Pratyaksha37/LeadDesk`)
3. In the **Environment Variables** section, add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |

4. Click **Deploy**
5. Vercel detects `vercel.json` automatically — the build runs and deploys in ~1–2 minutes

### 3. Verify

1. Open the live Vercel URL (e.g., `https://leaddesk.vercel.app`)
2. Submit a lead from the landing page
3. Visit `/login` → sign in
4. Confirm the lead appears in the admin dashboard
5. Change its status and refresh — the change persists

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public anon key for auth client |
| `SUPABASE_URL` | Backend | Supabase project URL (admin client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Service role key (bypasses RLS) |
| `PORT` | Backend | Server port (default 3001) |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/leads` | No | Submit a new lead |
| GET | `/api/leads` | Yes | List leads (supports `?search=&status=`) |
| GET | `/api/leads/stats` | Yes | Get counts per status |
| PATCH | `/api/leads/:id` | Yes | Update lead status |
| DELETE | `/api/leads/:id` | Yes | Delete a lead |
| POST | `/api/auth/register` | No | Register an admin user (dev only) |
| GET | `/api/me` | Yes | Get current user info |

---

## Security Considerations

1. **Service role key is never exposed to the client** — only used in the Express server
2. **Server-side validation** runs on every mutation even though the frontend also validates
3. **Row Level Security (RLS)** on the `leads` table prevents unauthorized reads/writes
4. **Auth token verification** on every admin API call using Supabase `getUser`
5. **Environment variables** keep secrets out of the codebase
6. **No sensitive data exposed** — the public user can only INSERT, not SELECT

---

## Design Decisions

### 1. Managed PostgreSQL database

I chose Supabase because it provides a production-ready PostgreSQL database and authentication system while allowing me to focus on the product flow rather than building infrastructure from scratch.

### 2. Server-side validation

Client-side validation improves user experience, but server-side validation is necessary because the client cannot be trusted. A malicious user can bypass browser validation and call the API directly.

### 3. Status values as a controlled set

I limited lead status to New, Contacted, and Closed so the system has predictable states and avoids inconsistent values such as "contacted", "In Progress", and "Done" being used interchangeably.

---

## Test Credentials

After running the migration and creating an admin user:

- **Local URL**: http://localhost:5173
- **Admin login**: http://localhost:5173/login
- **Live URL**: `https://leaddesk-mini.onrender.com` (after deploying)
- **Email**: (the one you registered)
- **Password**: (the one you set)

---

## Data Flow

```
1. Visitor opens landing page
2. Fills out lead form (name, email, budget, message)
3. Client-side Zod validation provides instant feedback
4. On submit, POST /api/leads sent to Express server
5. Server re-validates all fields independently
6. Server inserts into Supabase `leads` table
7. Success response returned; form shows confirmation
8. Admin logs in at /login via Supabase Auth
9. Session created; admin redirected to /admin
10. Admin dashboard fetches leads via GET /api/leads
11. Admin can search, filter by status, change status, or delete
12. All mutations go through the backend with auth verification
```

---

## Known Limitations

- No pagination on the leads table (simple offset-limit could be added)
- No email notifications when a lead is submitted
- No lead editing (only status changes)
- No dark mode toggle (CSS variables defined but not exposed)
- Single admin user model (no role-based access)

---

## Future Improvements

- Email notifications on new lead submission
- Lead detail view / modal
- CSV export of leads
- Pagination and infinite scroll
- Audit log of status changes
- OAuth social login (Google/GitHub) via Supabase Auth
- Rate limiting on the public form endpoint
- Automated tests (unit + integration)
