# SkillGRID

A working demo build of the SkillGRID capstone proposal: a peer-to-peer skill exchange
platform with direct and multi-node chain matching, a dual-mode (institutional token /
public fiat) economy, and sandbox payment integration.

This is a functional foundation you can build on for the actual capstone deliverable —
it implements the *mechanics* of every in-scope item at a working-demo level, using
simplified/sandboxed versions of anything that would normally need a paid third-party
account (payment gateway, video call API).

## Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`) — a single-file DB, zero setup
- **Frontend:** Plain HTML / CSS / vanilla JS (no framework), served as static files
- **Auth:** Session-based (`express-session` + `bcryptjs`)

## Project structure

```
skillgrid/
├── server.js                  # Express app entry point
├── config/
│   ├── db.js                   # SQLite connection + schema (auto-creates tables)
│   └── seed.js                 # Optional demo data (npm run seed)
├── middleware/
│   └── auth.js                 # requireAuth / requireAdmin guards
├── models/                     # Data-access layer (User, Match, Session, Transaction, Review, Report)
├── controllers/                # Route handler logic
├── routes/                     # Express routers, one per resource
├── utils/
│   ├── chainMatcher.js          # The multi-node chain-matching algorithm
│   └── meetingLink.js           # Fake Zoom/Meet link generator (sandbox)
├── public/                     # Frontend: HTML pages + css/ + js/
├── .env.example
├── .gitignore
└── package.json
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the environment file:
   ```
  # Windows PowerShell
  Copy-Item .env.example .env
  # macOS/Linux
  cp .env.example .env
   ```
3. (Optional but recommended) seed demo accounts, including a ready-made 3-person
   chain match (Alice → Ben → Cara → Alice):
   ```
   npm run seed
   ```
   Demo logins: `alice@demo.edu` / `ben@demo.edu` / `cara@demo.edu` (institutional,
   password `password123`), `dexter@demo.com` (public, `password123`), and
   `admin@skillgrid.com` / `admin123` (admin dashboard access).
4. Run it:
   ```
   npm run dev    # auto-restarts on file changes
   # or
   npm start
   ```
5. Open `http://localhost:3000`

## Testing

Run the focused integrity tests with:

```
npm test
```

The SQLite dependency includes native code. On Windows, use a supported Node.js
LTS release and ensure Python plus the Visual C++ build tools are available if
npm needs to compile `better-sqlite3` locally.

## How the proposal's scope maps to this build

| Proposal item | Where it lives |
|---|---|
| User management, institutional verification, skill tags | `models/User.js`, dashboard page — `verified` flag is a manual toggle here; wire it to real institutional email verification later |
| Dual-mode network (Institutional token / Public fiat) | `mode` field on users; token vs. fiat ledgers in `transactions` table |
| Algorithmic matching — direct 1:1 | `controllers/matchController.js` → `proposeDirect` |
| Algorithmic matching — multi-node chains | `utils/chainMatcher.js` — builds a directed graph from everyone's wanted/offered skills and finds cycles via DFS |
| Dual ledger (token + fiat) | `users.token_balance` / `users.fiat_balance`, `transactions` table |
| Payment gateway integration (sandbox) | `controllers/paymentController.js` — simulates a GCash/PayMaya-style checkout; guarded by `PAYMENT_SANDBOX_MODE`, never touches a real gateway |
| Scheduling + external video links | `sessions` table + `utils/meetingLink.js` (stubs Zoom/Meet — swap in the real Zoom/Google Meet API when ready) |
| Accountability (reviews, no-shows) | `reviews` and `session_no_shows` tables |
| Admin dashboard | `controllers/adminController.js` + `/admin` page — reports, analytics, token valuation config |

### Chain-matching algorithm, briefly

Each user is a node. A directed edge `A -> B` exists if A wants a skill that B offers
(meaning B would teach A). The algorithm does a bounded-depth DFS from every user
looking for cycles back to the start — a cycle of length 3+ is a valid chain match
(2-person cycles are just direct swaps, and are filtered out). Cycles are canonicalized
by rotating to start at the lowest user ID, so the same loop found from different
starting points doesn't get created twice.

This runs on-demand via `POST /api/matches/chain-search` in this build. For production,
move it to a scheduled background job (the proposal calls for "background-process
chain-matching") — e.g. a cron task or a queue worker that reruns it periodically and
only notifies users about *newly found* cycles.

## Remaining deployment considerations

- **Paid session payouts currently split evenly across all participants** in a match.
  For a typical tutor-gets-paid-by-student session you'll want to model who is paying
  vs. who is teaching explicitly, rather than assuming everyone teaches everyone.
- **`express-session` uses the default in-memory store** — fine for local dev/demo,
  but restarts wipe all logged-in sessions and it won't scale past one process. Swap in
  `connect-sqlite3` (pairs naturally with the existing SQLite DB) before deploying.
- **Institutional verification is a manual DB flag**, not tied to a real university
  email domain check — add that validation in `authController.register`.
- **No file/image uploads** (profile photos, portfolio samples) — out of scope here but
  easy to add with `multer` + local disk or S3-compatible storage.
- **The sandbox payment flow is not a live gateway** and is intended only for demos.

## Publishing to GitHub

```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `.env`, and the SQLite database files —
none of that gets pushed. Never commit your real `.env`, only `.env.example`.
