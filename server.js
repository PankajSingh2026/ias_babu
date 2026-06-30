require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const pool = require('./config/db');
const { attachUser } = require('./middleware/auth');

const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const syllabusRoutes = require('./routes/syllabus');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
  contentSecurityPolicy: false // relaxed because we load CKEditor from a CDN; tighten for production
}));
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new pgSession({ pool, tableName: 'session', createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(attachUser);

// Make site-wide nav links available to every view
app.use(async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM nav_links WHERE is_visible = true ORDER BY sort_order ASC'
    );
    res.locals.navLinks = rows;
    res.locals.siteName = process.env.SITE_NAME || 'IASBABU';
  } catch (err) {
    res.locals.navLinks = [];
    res.locals.siteName = process.env.SITE_NAME || 'IASBABU';
  }
  next();
});

app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/blog', blogRoutes);
app.use('/syllabus', syllabusRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: 'Not Found', message: 'Page not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Server Error', message: 'Something went wrong.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`IASBABU running on http://localhost:${PORT}`));
