const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');

router.get('/signup', (req, res) => {
  res.render('auth/signup', { title: 'Sign Up', errors: [], old: {} });
});

router.post('/signup',
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/signup', { title: 'Sign Up', errors: errors.array(), old: req.body });
    }
    try {
      const { name, email, password } = req.body;
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.render('auth/signup', {
          title: 'Sign Up',
          errors: [{ msg: 'An account with this email already exists.' }],
          old: req.body
        });
      }
      const hash = await bcrypt.hash(password, 12);
      const { rows } = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [name, email, hash, 'user']
      );
      req.session.user = rows[0];
      res.redirect('/blog');
    } catch (err) { next(err); }
  }
);

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Log In', error: null });
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || user.is_blocked) {
      return res.render('auth/login', { title: 'Log In', error: 'Invalid credentials.' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.render('auth/login', { title: 'Log In', error: 'Invalid credentials.' });
    }
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    const dest = req.session.returnTo || (user.role === 'admin' ? '/admin' : '/blog');
    delete req.session.returnTo;
    res.redirect(dest);
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
