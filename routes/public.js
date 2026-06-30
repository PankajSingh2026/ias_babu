const express = require('express');
const router = express.Router();
const pool = require('../config/db');

async function getNotifications(category, limit = 20) {
  const { rows } = await pool.query(
    `SELECT * FROM notifications
     WHERE category = $1 AND is_published = true
     ORDER BY sort_order ASC, created_at DESC
     LIMIT $2`,
    [category, limit]
  );
  return rows;
}

async function getPage(key) {
  const { rows } = await pool.query('SELECT * FROM site_pages WHERE page_key = $1', [key]);
  return rows[0] || null;
}

router.get('/', async (req, res, next) => {
  try {
    const [jobs, admitCards, results, homeIntro, latestBlogs] = await Promise.all([
      getNotifications('job', 8),
      getNotifications('admit_card', 8),
      getNotifications('result', 8),
      getPage('home_intro'),
      pool.query(
        `SELECT bp.*, u.name AS author_name FROM blog_posts bp
         JOIN users u ON u.id = bp.author_id
         WHERE bp.status = 'published'
         ORDER BY bp.created_at DESC LIMIT 3`
      ).then(r => r.rows)
    ]);
    res.render('index', { title: 'Home', jobs, admitCards, results, homeIntro, latestBlogs });
  } catch (err) { next(err); }
});

router.get('/latest-jobs', async (req, res, next) => {
  try {
    const jobs = await getNotifications('job', 100);
    res.render('notification-list', { title: 'Latest Jobs', heading: 'Latest Jobs', items: jobs });
  } catch (err) { next(err); }
});

router.get('/admit-card', async (req, res, next) => {
  try {
    const items = await getNotifications('admit_card', 100);
    res.render('notification-list', { title: 'Admit Card', heading: 'Admit Card', items });
  } catch (err) { next(err); }
});

router.get('/result', async (req, res, next) => {
  try {
    const items = await getNotifications('result', 100);
    res.render('notification-list', { title: 'Result', heading: 'Result', items });
  } catch (err) { next(err); }
});

router.get('/miscellaneous', async (req, res, next) => {
  try {
    const page = await getPage('miscellaneous');
    res.render('static-page', { title: page?.title || 'Miscellaneous', page });
  } catch (err) { next(err); }
});

module.exports = router;
