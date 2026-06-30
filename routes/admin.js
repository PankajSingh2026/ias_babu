const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const slugify = require('slugify');
const sanitizeHtml = require('sanitize-html');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const sanitizeOpts = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'figure', 'figcaption', 'u', 's', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ]),
  allowedAttributes: {
    '*': ['style', 'class'],
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height']
  },
  allowedSchemes: ['http', 'https', 'mailto']
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image uploads are allowed'));
  }
});

router.use(requireAdmin);

// ---------- Dashboard home ----------
router.get('/', async (req, res, next) => {
  try {
    const [{ rows: counts }] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM notifications) AS notifications,
          (SELECT COUNT(*) FROM blog_posts WHERE status = 'pending') AS pending_blogs,
          (SELECT COUNT(*) FROM blog_posts WHERE status = 'published') AS published_blogs,
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM syllabus_pages) AS syllabus_pages
      `)
    ]);
    res.render('admin/dashboard', { title: 'Admin Dashboard', stats: counts[0] });
  } catch (err) { next(err); }
});

// ---------- Image upload (used by CKEditor in blog/syllabus editors) ----------
router.post('/upload-image', upload.single('upload'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: { message: 'No file uploaded' } });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ---------- Nav links management ----------
router.get('/nav', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM nav_links ORDER BY sort_order ASC');
    res.render('admin/nav', { title: 'Manage Navigation', links: rows });
  } catch (err) { next(err); }
});

router.post('/nav', async (req, res, next) => {
  try {
    const { label, url, sort_order } = req.body;
    await pool.query(
      'INSERT INTO nav_links (label, url, sort_order) VALUES ($1, $2, $3)',
      [label, url, parseInt(sort_order, 10) || 0]
    );
    res.redirect('/admin/nav');
  } catch (err) { next(err); }
});

router.post('/nav/:id/update', async (req, res, next) => {
  try {
    const { label, url, sort_order, is_visible } = req.body;
    await pool.query(
      'UPDATE nav_links SET label = $1, url = $2, sort_order = $3, is_visible = $4 WHERE id = $5',
      [label, url, parseInt(sort_order, 10) || 0, is_visible === 'on', req.params.id]
    );
    res.redirect('/admin/nav');
  } catch (err) { next(err); }
});

router.post('/nav/:id/delete', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM nav_links WHERE id = $1', [req.params.id]);
    res.redirect('/admin/nav');
  } catch (err) { next(err); }
});

// ---------- Notifications: Latest Jobs / Admit Card / Result ----------
router.get('/notifications', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notifications ORDER BY category, sort_order, created_at DESC');
    res.render('admin/notifications', { title: 'Manage Notifications', items: rows });
  } catch (err) { next(err); }
});

router.post('/notifications', async (req, res, next) => {
  try {
    const { category, title, link_url, sort_order, is_highlighted } = req.body;
    await pool.query(
      `INSERT INTO notifications (category, title, link_url, sort_order, is_highlighted, posted_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [category, title, link_url, parseInt(sort_order, 10) || 0, is_highlighted === 'on', req.session.user.id]
    );
    res.redirect('/admin/notifications');
  } catch (err) { next(err); }
});

router.post('/notifications/:id/update', async (req, res, next) => {
  try {
    const { category, title, link_url, sort_order, is_highlighted, is_published } = req.body;
    await pool.query(
      `UPDATE notifications SET category=$1, title=$2, link_url=$3, sort_order=$4, is_highlighted=$5, is_published=$6
       WHERE id = $7`,
      [category, title, link_url, parseInt(sort_order, 10) || 0, is_highlighted === 'on', is_published === 'on', req.params.id]
    );
    res.redirect('/admin/notifications');
  } catch (err) { next(err); }
});

router.post('/notifications/:id/delete', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
    res.redirect('/admin/notifications');
  } catch (err) { next(err); }
});

// ---------- Blog moderation ----------
router.get('/blog', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT bp.*, u.name AS author_name FROM blog_posts bp
       JOIN users u ON u.id = bp.author_id ORDER BY bp.created_at DESC`
    );
    res.render('admin/blog', { title: 'Manage Blog', posts: rows });
  } catch (err) { next(err); }
});

router.get('/blog/new', (req, res) => {
  res.render('admin/blog-editor', { title: 'New Blog Post (Admin)', post: null });
});

router.post('/blog/new', async (req, res, next) => {
  try {
    const { title, content_html, cover_image } = req.body;
    const clean = sanitizeHtml(content_html, sanitizeOpts);
    let slug = slugify(title, { lower: true, strict: true });
    const dupe = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
    if (dupe.rows.length > 0) slug = `${slug}-${Date.now()}`;
    await pool.query(
      `INSERT INTO blog_posts (title, slug, content_html, cover_image, author_id, status)
       VALUES ($1, $2, $3, $4, $5, 'published')`,
      [title, slug, clean, cover_image || null, req.session.user.id]
    );
    res.redirect('/admin/blog');
  } catch (err) { next(err); }
});

router.post('/blog/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body; // 'published' | 'pending' | 'rejected'
    await pool.query('UPDATE blog_posts SET status = $1, updated_at = now() WHERE id = $2', [status, req.params.id]);
    res.redirect('/admin/blog');
  } catch (err) { next(err); }
});

router.post('/blog/:id/delete', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM blog_posts WHERE id = $1', [req.params.id]);
    res.redirect('/admin/blog');
  } catch (err) { next(err); }
});

router.post('/comments/:id/hide', async (req, res, next) => {
  try {
    await pool.query('UPDATE blog_comments SET is_hidden = NOT is_hidden WHERE id = $1', [req.params.id]);
    res.redirect('back');
  } catch (err) { next(err); }
});

// ---------- Syllabus editor (WYSIWYG, admin only) ----------
router.get('/syllabus', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM syllabus_pages ORDER BY title ASC');
    res.render('admin/syllabus-list', { title: 'Manage Syllabus', pages: rows });
  } catch (err) { next(err); }
});

router.get('/syllabus/new', (req, res) => {
  res.render('admin/syllabus-editor', { title: 'New Syllabus Page', page: null });
});

router.post('/syllabus/new', async (req, res, next) => {
  try {
    const { title, content_html, is_published } = req.body;
    const clean = sanitizeHtml(content_html, sanitizeOpts);
    let slug = slugify(title, { lower: true, strict: true });
    const dupe = await pool.query('SELECT id FROM syllabus_pages WHERE slug = $1', [slug]);
    if (dupe.rows.length > 0) slug = `${slug}-${Date.now()}`;
    await pool.query(
      `INSERT INTO syllabus_pages (title, slug, content_html, is_published, author_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [title, slug, clean, is_published === 'on', req.session.user.id]
    );
    res.redirect('/admin/syllabus');
  } catch (err) { next(err); }
});

router.get('/syllabus/:id/edit', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM syllabus_pages WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).render('error', { title: 'Not Found', message: 'Page not found.' });
    res.render('admin/syllabus-editor', { title: 'Edit Syllabus Page', page: rows[0] });
  } catch (err) { next(err); }
});

router.post('/syllabus/:id/edit', async (req, res, next) => {
  try {
    const { title, content_html, is_published } = req.body;
    const clean = sanitizeHtml(content_html, sanitizeOpts);
    await pool.query(
      `UPDATE syllabus_pages SET title=$1, content_html=$2, is_published=$3, updated_at=now() WHERE id=$4`,
      [title, clean, is_published === 'on', req.params.id]
    );
    res.redirect('/admin/syllabus');
  } catch (err) { next(err); }
});

router.post('/syllabus/:id/delete', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM syllabus_pages WHERE id = $1', [req.params.id]);
    res.redirect('/admin/syllabus');
  } catch (err) { next(err); }
});

// ---------- Site pages (home intro, footer about, miscellaneous) ----------
router.get('/pages', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM site_pages ORDER BY page_key');
    res.render('admin/pages', { title: 'Manage Site Pages', pages: rows });
  } catch (err) { next(err); }
});

router.post('/pages/:key', async (req, res, next) => {
  try {
    const { title, content_html } = req.body;
    const clean = sanitizeHtml(content_html, sanitizeOpts);
    await pool.query(
      `INSERT INTO site_pages (page_key, title, content_html, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (page_key) DO UPDATE SET title = $2, content_html = $3, updated_at = now()`,
      [req.params.key, title, clean]
    );
    res.redirect('/admin/pages');
  } catch (err) { next(err); }
});

// ---------- User management (promote/block users who write blogs) ----------
router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role, is_blocked, created_at FROM users ORDER BY created_at DESC');
    res.render('admin/users', { title: 'Manage Users', users: rows });
  } catch (err) { next(err); }
});

router.post('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    res.redirect('/admin/users');
  } catch (err) { next(err); }
});

router.post('/users/:id/toggle-block', async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET is_blocked = NOT is_blocked WHERE id = $1', [req.params.id]);
    res.redirect('/admin/users');
  } catch (err) { next(err); }
});

module.exports = router;
