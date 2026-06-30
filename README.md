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

## Demo admin login

```
Email: admin@iasbabu.org
Password: ChangeMe123!
```

Change these in `js/store.js` (`seedData().users`) before you publish — since this is all client-side
JavaScript, **never treat this login as real security**. Anyone can open DevTools and read `js/store.js` or
inspect `localStorage`. Use this for a low-stakes demo/admin convenience only, not to protect anything
sensitive.

## Notes on the WYSIWYG editors

The blog and syllabus editors here use the browser's built-in `contenteditable` + `document.execCommand`
(bold/italic/lists/headings/links/images/simple tables) so there's no external library or build step
required — fully offline-capable and GitHub-Pages-friendly. It's intentionally simpler than the CKEditor 5
integration in the full Node/Postgres version, but supports everything in your original request: typing
free-form content like a Word doc and pasting book purchase links into the text.
