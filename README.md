# IASBABU — Govt Jobs Portal + Admin Dashboard

Full Node.js/Express + PostgreSQL website matching the supplied HTML mock: dynamic navbar, bottom-to-top
scrolling notification widgets (Latest Jobs / Admit Card / Result), a blog with user submissions, comments
and star reviews, a WYSIWYG syllabus editor (images + tables, book purchase links), and an admin dashboard
that controls all of it.

## Features

- **Dynamic navbar** — admin adds/edits/reorders/hides nav links from the dashboard; the public site reads them live.
- **Scrolling notifications** — three independent widgets (Job / Admit Card / Result), pure CSS marquee that
  scrolls bottom-to-top and pauses on hover. Admin adds title + link + optional highlight per entry.
- **Blog** — admin publishes instantly; any signed-up user can submit a post which goes into a moderation
  queue until an admin approves it. Readers can comment and leave a 1–5 star rating per post.
- **Syllabus** — full WYSIWYG editor (CKEditor 5: headings, bold/italic, images, tables, links) so admin can
  type like a Word doc and paste book purchase links directly into the text.
- **Auth** — bcrypt-hashed passwords, server-side sessions stored in Postgres, roles: `admin` / `user`.
- **Admin dashboard** — nav management, notification CRUD, blog moderation, syllabus CRUD, static page editor
  (home intro, footer about, miscellaneous), user role/block management.

## 1. Prerequisites

- Node.js 18+
- PostgreSQL 13+ (local install, Docker, or a managed instance like Render/Supabase/RDS)

## 2. Install

```bash
cd iasbabu
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — your Postgres connection string
- `SESSION_SECRET` — generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the first admin account, auto-created on migration

## 3. Create the database

```bash
createdb iasbabu          # or create it via your hosting provider's dashboard
npm run migrate           # applies schema.sql, seeds nav links + pages + the admin account
```

Re-running `npm run migrate` is safe — it only seeds data that doesn't already exist.

## 4. Run

```bash
npm run dev      # nodemon, auto-restarts on file changes
# or
npm start         # plain node
```

Visit `http://localhost:3000`. Log in at `/login` with the admin credentials from `.env`, then go to
`/admin`.

## 5. Folder structure

```
iasbabu/
  server.js              # app entry point
  config/db.js            # Postgres pool
  middleware/auth.js       # session/role guards
  migrations/
    schema.sql            # full DB schema
    migrate.js             # applies schema + seeds admin/nav/pages
  routes/
    public.js              # home, latest-jobs, admit-card, result, miscellaneous
    auth.js                 # signup/login/logout
    blog.js                  # public blog + comments + user submissions
    syllabus.js               # public syllabus pages
    admin.js                   # everything under /admin (requires admin role)
  views/                  # EJS templates (public/ + admin/ + auth/ + blog/ + syllabus/)
  public/
    css/style.css           # all styling incl. the scroll animation
    uploads/                # images uploaded via the rich text editors
```

## 6. How each requirement maps to the code

| Requirement | Where |
|---|---|
| Admin can edit any nav bar page/link | `admin/nav.ejs` + `routes/admin.js` nav routes |
| Bottom-to-top scrolling Job/Admit Card/Result notifications | `public/css/style.css` `.notif-track` + `@keyframes scroll-up`, data from `notifications` table |
| Admin posts links for job/result/admit card | `admin/notifications.ejs` |
| Blog section on home page | `views/index.ejs` "From the Blog" section |
| Admin can post blog | `admin/blog-editor.ejs` (publishes immediately) |
| Signed-up users can write blog too | `blog/editor.ejs` at `/blog/new` (goes to moderation queue, admin approves in `admin/blog.ejs`) |
| Readers post comments/review on a blog | `blog/post.ejs` comment form, ratings stored in `blog_comments.rating` |
| Syllabus page: type like Word doc, paste book purchase link | `admin/syllabus-editor.ejs` (CKEditor 5 classic build with table + image + link tools) |

## 7. Deployment (production)

Any Node host works (Render, Railway, Fly.io, a VPS with PM2 + nginx, etc.). General steps:

1. Provision a managed Postgres database; copy its connection string into `DATABASE_URL` on the host.
2. Set `NODE_ENV=production`, a strong `SESSION_SECRET`, and your real `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
3. Run `npm install --production` then `npm run migrate` once (via the host's shell/console or a one-off job).
4. Start with `npm start`, or under PM2: `pm2 start server.js --name iasbabu`.
5. Put nginx (or the host's built-in proxy) in front for TLS; behind a proxy, also add
   `app.set('trust proxy', 1)` in `server.js` so secure cookies work correctly.
6. Point your domain's DNS at the host; the uploads folder (`public/uploads`) should be on persistent disk
   or swapped for S3/Cloudinary if your host uses ephemeral storage.

### Example: Render.com
- New Postgres instance → copy the External Database URL into `DATABASE_URL`.
- New Web Service → connect this repo → Build Command `npm install` → Start Command `npm start`.
- Add a one-off "Migrate" job or run `npm run migrate` from the Render shell after first deploy.

## 8. Security notes / next steps before going live

- Change `ADMIN_PASSWORD` immediately after first login (there's currently no in-app "change password" UI —
  add one or rotate via direct DB update with a new bcrypt hash if needed).
- `helmet`'s CSP is disabled because CKEditor loads from a CDN; for stricter production security, self-host
  CKEditor and re-enable a tightened CSP.
- Add rate limiting (`express-rate-limit`) on `/login` and `/signup` to slow brute-force attempts.
- Uploaded images are unauthenticated for write only behind login (`requireLogin`/`requireAdmin`); add file
  type/size checks if you expose this further (already capped at 5MB, images only, via `multer` filter).
