const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const slugify = require('slugify');
const sanitizeHtml = require('sanitize-html');
const pool = require('../config/db');
const { requireLogin } = require('../middleware/auth');

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

// Image upload for any logged-in user writing a blog post (CKEditor simpleUpload adapter)
router.post('/upload-image', requireLogin, upload.single('upload'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: { message: 'No file uploaded' } });
  res.json({ url: `/uploads/${req.file.filename}` });
});

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

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT bp.*, u.name AS author_name FROM blog_posts bp
       JOIN users u ON u.id = bp.author_id
       WHERE bp.status = 'published'
       ORDER BY bp.created_at DESC`
    );
    res.render('blog/list', { title: 'Blog', posts: rows });
  } catch (err) { next(err); }
});

router.get('/new', requireLogin, (req, res) => {
  res.render('blog/editor', { title: 'Write a Blog Post', errors: [] });
});

router.post('/new', requireLogin, async (req, res, next) => {
  try {
    const { title, content_html, cover_image } = req.body;
    if (!title || !content_html) {
      return res.render('blog/editor', { title: 'Write a Blog Post', errors: ['Title and content are required.'] });
    }
    const clean = sanitizeHtml(content_html, sanitizeOpts);
    let slug = slugify(title, { lower: true, strict: true });
    const dupe = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
    if (dupe.rows.length > 0) slug = `${slug}-${Date.now()}`;

    // Admin posts publish immediately; regular users go into moderation queue
    const status = req.session.user.role === 'admin' ? 'published' : 'pending';

    const { rows } = await pool.query(
      `INSERT INTO blog_posts (title, slug, content_html, cover_image, author_id, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING slug`,
      [title, slug, clean, cover_image || null, req.session.user.id, status]
    );
    if (status === 'pending') {
      return res.render('blog/submitted', { title: 'Submitted for Review' });
    }
    res.redirect(`/blog/${rows[0].slug}`);
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT bp.*, u.name AS author_name FROM blog_posts bp
       JOIN users u ON u.id = bp.author_id
       WHERE bp.slug = $1`,
      [req.params.slug]
    );
    const post = rows[0];
    if (!post) return res.status(404).render('error', { title: 'Not Found', message: 'Post not found.' });

    const isOwnerOrAdmin = req.session.user && (req.session.user.role === 'admin' || req.session.user.id === post.author_id);
    if (post.status !== 'published' && !isOwnerOrAdmin) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Post not found.' });
    }

    await pool.query('UPDATE blog_posts SET views = views + 1 WHERE id = $1', [post.id]);

    const { rows: comments } = await pool.query(
      `SELECT c.*, u.name AS user_name FROM blog_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1 AND c.is_hidden = false
       ORDER BY c.created_at DESC`,
      [post.id]
    );

    res.render('blog/post', { title: post.title, post, comments });
  } catch (err) { next(err); }
});

router.post('/:slug/comment', requireLogin, async (req, res, next) => {
  try {
    const { body, rating } = req.body;
    const { rows } = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [req.params.slug]);
    if (!rows[0]) return res.status(404).render('error', { title: 'Not Found', message: 'Post not found.' });
    if (!body || !body.trim()) return res.redirect(`/blog/${req.params.slug}`);

    await pool.query(
      'INSERT INTO blog_comments (post_id, user_id, body, rating) VALUES ($1, $2, $3, $4)',
      [rows[0].id, req.session.user.id, body.trim(), rating ? parseInt(rating, 10) : null]
    );
    res.redirect(`/blog/${req.params.slug}#comments`);
  } catch (err) { next(err); }
});

module.exports = router;
