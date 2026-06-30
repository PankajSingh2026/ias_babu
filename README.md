# IASBABU — Static Site (GitHub Pages ready)

A pure HTML/CSS/JS version of the site that needs **no server, no database, no build step** — you can
upload it straight to GitHub Pages, Netlify, Vercel, or any static host.

## Important: how data storage works here

There is no backend, so this version uses the browser's `localStorage` as a stand-in "database":
- Whatever an admin adds/edits (nav links, job/admit-card/result notifications, blog posts, syllabus pages)
  is saved **only in that browser, on that device**. It is not visible to other visitors and is not shared
  across devices or browsers.
- A different visitor loading your GitHub Pages URL sees the **seed/demo data** that ships in
  `js/store.js`, not your live edits, until you bake your real content into that seed data (see below).
- Clearing browser data/cache wipes the admin's local edits.

This is genuinely fine for: showing the design/UX to stakeholders, a personal demo, or a starting point you
flesh out with real content before publishing. It is **not** fine for: a live multi-user blog where readers'
comments persist for everyone, or any scenario where you need shared, durable data. For that, use the
full Node.js + PostgreSQL version (in the sibling `iasbabu` project) deployed to a real host — see its
README for one-click-ish deploy steps.

### Two ways to actually publish content with this static version

1. **"Bake it in" workflow (recommended for GitHub Pages):** Use the admin dashboard locally to build out
   your nav links, notifications, blog posts and syllabus pages. When you're happy with it, open your
   browser's DevTools console and run:
   ```js
   copy(localStorage.getItem('iasbabu_db_v1'))
   ```
   This copies your current data to the clipboard. Paste it into `js/store.js`, replacing the object
   returned by `seedData()`. Commit and push — now every visitor sees that content as the starting point
   (they can still use the admin panel afterwards, but only changes their own browser).
2. **Swap in a real backend later:** Replace the functions in `js/store.js` (`loadDB`, `saveDB`, etc.) with
   `fetch()` calls to a real API once you're ready to upgrade — the rest of the pages only ever call those
   functions, so the UI code doesn't need to change.

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g. `iasbabu-website`).
2. Push the contents of this folder to the repo root (or to a `/docs` folder — your choice):
   ```bash
   git init
   git add .
   git commit -m "Initial static site"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/iasbabu-website.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch** → pick `main` and
   `/ (root)` (or `/docs` if you used that folder) → Save.
4. After a minute, your site is live at `https://YOUR_USERNAME.github.io/iasbabu-website/`.
5. To use a custom domain, add a `CNAME` file with your domain name at the repo root and configure your
   domain's DNS per GitHub's custom domain docs.

## File map

```
index.html              Home page (intro, 3 scrolling notification widgets, latest blog posts)
latest-jobs.html         Full Latest Jobs list
admit-card.html           Full Admit Card list
result.html                 Full Result list
syllabus.html                 Syllabus index
syllabus-page.html             Single syllabus page (renders the WYSIWYG content + book links)
blog.html                        Blog list + "write a post" form (logged-in users)
blog-post.html                    Single post + comments/star reviews
miscellaneous.html                  Static miscellaneous page
login.html / signup.html              Auth (client-side only — demo-grade, not secure)
admin.html                              Full admin dashboard: nav, notifications, blog moderation,
                                          syllabus editor, site pages, users
css/style.css                            All styling, incl. the bottom-to-top scroll animation
js/store.js                               localStorage data layer + seed data — edit seedData() to
                                            ship real starting content
js/layout.js                               Renders the navbar/footer on every page from stored data
```

## Admin login (Firebase Authentication)

The admin dashboard (`admin.html`) is now gated by **Firebase Authentication** instead of localStorage.
This means the actual password check happens on Google's servers, not in your browser's JavaScript — a
real security improvement over the earlier localStorage-only login, and safe to use even if someone
inspects your page source.

### One-time setup

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com) and create a free project.
2. In the project: **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. Still in Authentication, go to the **Users** tab → **Add user** → enter the email/password for your admin
   account. This is intentionally the *only* way to create an admin login — there's no public admin signup
   form, so random visitors can't create themselves an admin account.
4. Go to **Project settings** (gear icon) → **General** → scroll to "Your apps" → click the **Web** icon
   (`</>`) → register an app (no hosting setup needed) → Firebase shows you a `firebaseConfig` object.
5. Open `js/firebase-config.js` in this project and paste those values in, replacing the
   `REPLACE_WITH_...` placeholders.
6. (Recommended) In **Authentication → Settings → Authorized domains**, add your GitHub Pages domain
   (e.g. `yourusername.github.io`) and/or your custom domain, so logins are restricted to your real site.
7. Commit and push — visit `admin-login.html` and log in with the email/password you added in step 3.

### Changing your admin email/password later

Log in, then in the dashboard go to the **Users** tab → **My Account (Firebase)**. You'll need to enter
your current password to confirm any change (Firebase requires a recent login for security-sensitive
changes like this) — that's expected, not a bug.

### What's still localStorage-based

Only the *admin* login moved to Firebase. Regular visitor signup/login for writing blog posts and leaving
comments (`login.html` / `signup.html`, used by everyday readers) still uses the simpler localStorage
system described above — upgrading that too would mean either adding Firestore (a real shared database,
which would also fix the "edits aren't visible to other visitors" limitation everywhere, not just login) or
moving to the Node/Postgres version. Ask if you want that next.

## Demo admin login (legacy, localStorage-only — superseded by Firebase above)

The old `login.html` page still works for regular blog readers/writers:

```
Email: admin@iasbabu.org
Password: ChangeMe123!
```

Log in, then go to the **Users tab → My Account** to change your email/name/password right away — don't
edit `js/store.js`'s seed data by hand to change credentials, since that can leave your browser's already-
seeded localStorage out of sync with the file (the classic "I changed it but can't log in" bug).

### A note on password storage here

Passwords in `js/store.js` are stored as a SHA-256 hash, not plain text, so opening DevTools and inspecting
`localStorage` won't show a readable password. **This is still not real security** — there is no server
holding a secret, so the hashing algorithm and comparison logic are sitting right there in `js/store.js` for
anyone to read, and a SHA-256 hash without a server-side secret/salt can be cracked offline by a determined
attacker (rainbow tables, brute force). Treat this login as a convenience gate for a low-stakes demo, never
as protection for anything sensitive. For real password security (salted, slow hashing like bcrypt, kept
entirely server-side and never sent to the browser), use the Node/Postgres version instead.

## Notes on the WYSIWYG editors

The blog and syllabus editors here use the browser's built-in `contenteditable` + `document.execCommand`
(bold/italic/lists/headings/links/images/simple tables) so there's no external library or build step
required — fully offline-capable and GitHub-Pages-friendly. It's intentionally simpler than the CKEditor 5
integration in the full Node/Postgres version, but supports everything in your original request: typing
free-form content like a Word doc and pasting book purchase links into the text.
