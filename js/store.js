/* ============================================================
   IASBABU static site - localStorage data layer
   Acts as a lightweight client-side "database" so this site can
   be hosted as plain static files (e.g. GitHub Pages) with no
   backend server. Data is per-browser only - see README.
   ============================================================ */

const DB_KEY = 'iasbabu_db_v1';

function seedData() {
  return {
    navLinks: [
      { id: 1, label: 'Home', url: 'index.html', order: 1 },
      { id: 2, label: 'Latest Jobs', url: 'latest-jobs.html', order: 2 },
      { id: 3, label: 'Admit Card', url: 'admit-card.html', order: 3 },
      { id: 4, label: 'Result', url: 'result.html', order: 4 },
      { id: 5, label: 'Syllabus', url: 'syllabus.html', order: 5 },
      { id: 6, label: 'Blog', url: 'blog.html', order: 6 },
      { id: 7, label: 'Miscellaneous', url: 'miscellaneous.html', order: 7 }
    ],
    notifications: [
      { id: 1, category: 'job', title: 'Notification 1', url: '#', highlighted: false },
      { id: 2, category: 'job', title: 'Notification 2', url: '#', highlighted: false },
      { id: 3, category: 'job', title: 'Notification 3', url: '#', highlighted: true },
      { id: 4, category: 'job', title: 'Notification 4', url: '#', highlighted: false },
      { id: 5, category: 'admit_card', title: 'Sample Admit Card 1', url: '#', highlighted: false },
      { id: 6, category: 'admit_card', title: 'Sample Admit Card 2', url: '#', highlighted: false },
      { id: 7, category: 'result', title: 'Sample Result 1', url: '#', highlighted: false },
      { id: 8, category: 'result', title: 'Sample Result 2', url: '#', highlighted: false }
    ],
    blogPosts: [
      {
        id: 1, slug: 'welcome-to-iasbabu', title: 'Welcome to IASBABU',
        content: '<p>This is a sample blog post. Edit or delete it from the admin dashboard, or add your own.</p>',
        cover: '', author: 'Admin', authorId: 'admin', status: 'published',
        createdAt: Date.now() - 86400000
      }
    ],
    comments: [], // { id, postId, userName, body, rating, createdAt }
    syllabusPages: [
      {
        id: 1, slug: 'sample-syllabus', title: 'Sample Syllabus',
        content: '<p>Type your syllabus here, just like a Word document. Select text and click the link button to add a book purchase link.</p>',
        published: true, updatedAt: Date.now()
      }
    ],
    sitePages: {
      home_intro: '<p>Serving Next Generation of Government Jobs aspirant with accessibility of guidance and resources for UPSC, SSC, Banking, and other Competitive Exams.</p>',
      miscellaneous: '<p>Additional resources and information.</p>'
    },
    users: [
      { id: 'admin', name: 'Site Admin', email: 'admin@iasbabu.org', password: 'ChangeMe123!', role: 'admin' }
    ],
    nextId: 100
  };
}

function loadDB() {
  let raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = seedData();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    const seeded = seedData();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function nextId(db) {
  db.nextId = (db.nextId || 100) + 1;
  return db.nextId;
}

function resetDB() {
  localStorage.removeItem(DB_KEY);
  return loadDB();
}

// ---- Session (current logged in user), separate from main DB blob ----
const SESSION_KEY = 'iasbabu_session_v1';

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
}
function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'page-' + Date.now();
}
