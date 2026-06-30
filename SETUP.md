# Firestore notifications upgrade — what's in this patch

Your job/admit-card/result notifications now live in **Firestore** (Firebase's real database) instead of
localStorage. When you add or delete one as admin, every visitor sees it immediately — no more "only saved
in my browser."

## Files in this patch

| File | Action |
|---|---|
| `index.html` | **overwrite** existing file |
| `latest-jobs.html` | **overwrite** existing file |
| `admit-card.html` | **overwrite** existing file |
| `result.html` | **overwrite** existing file |
| `admin.html` | **overwrite** existing file |
| `js/notifications-firestore.js` | **new file** — place in your `js/` folder |
| `firestore.rules` | not a site file — paste its contents into the Firebase console (see below) |

## One-time setup before this works

### 1. Create the Firestore database
In the Firebase console: **Build → Firestore Database → Create database** → choose **Start in production
mode** → pick a location close to your users (e.g. `asia-south1` for India) → Enable.

### 2. Set the security rules
Still in Firestore Database, click the **Rules** tab. Replace whatever is there with the contents of
`firestore.rules` from this patch, then click **Publish**.

These rules mean: anyone can *read* notifications (so visitors see them), but only someone signed in
through your Firebase admin login can *create/update/delete* one. Random visitors can't post fake job
notifications.

### 3. Push the files
Overwrite the 5 files listed above in your repo, add the new `js/notifications-firestore.js`, commit, push.

### 4. Test it
- Log in at `admin-login.html`, add a notification under "Jobs / Admit Card / Result."
- Open the site in a different browser (or incognito window, or your phone) — you should see it appear on
  the home page and on `latest-jobs.html`/`admit-card.html`/`result.html` without you doing anything else.
- Delete it from the admin table — it should disappear everywhere within a second or two.

## What's still local-only (not changed by this patch)

Blog posts, comments, syllabus pages, nav links, and site pages (home intro / miscellaneous text) are still
localStorage-based — same limitation as before, just not what you asked to fix right now. Same Firestore
pattern can be applied to any of those next; ask if/when you want that.

## Quick troubleshooting

- **Notification doesn't appear for other visitors** → double-check you actually published the Firestore
  rules (step 2) and that the database was created in production mode, not left on the rules Firebase shows
  by default for a brand-new database (which can default to locked-down or fully-open depending on the
  option you picked when creating it).
- **"Missing or insufficient permissions" error in the browser console when adding a notification** → you're
  not actually signed in as admin when you think you are, or the rules weren't published. Check
  Authentication shows you as logged in, and re-check the Rules tab shows exactly the rules from
  `firestore.rules`.
- **Notifications still showing per-browser, not shared** → you're probably still looking at files that
  weren't actually overwritten — view the raw file on GitHub (`.../js/notifications-firestore.js`) to
  confirm the push went through and isn't still showing 404 or an old version.
