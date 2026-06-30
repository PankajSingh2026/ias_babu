const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, slug, updated_at FROM syllabus_pages WHERE is_published = true ORDER BY title ASC'
    );
    res.render('syllabus/list', { title: 'Syllabus', pages: rows });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM syllabus_pages WHERE slug = $1 AND is_published = true',
      [req.params.slug]
    );
    const page = rows[0];
    if (!page) return res.status(404).render('error', { title: 'Not Found', message: 'Syllabus page not found.' });
    res.render('syllabus/page', { title: page.title, page });
  } catch (err) { next(err); }
});

module.exports = router;
