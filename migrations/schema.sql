-- ============================================================
-- IASBABU full schema
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' | 'user'
  bio TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Navigation bar, fully editable by admin (label, url, order, parent for dropdowns)
CREATE TABLE IF NOT EXISTS nav_links (
  id SERIAL PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  url VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  parent_id INT REFERENCES nav_links(id) ON DELETE CASCADE,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Scrolling notification widgets: Latest Jobs / Admit Card / Result
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  category VARCHAR(20) NOT NULL, -- 'job' | 'admit_card' | 'result'
  title VARCHAR(255) NOT NULL,
  link_url VARCHAR(500) NOT NULL,
  is_highlighted BOOLEAN NOT NULL DEFAULT false, -- highlight bar like "Notification 3" in mock
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  posted_by INT REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Blog posts, can be written by admin OR any signed-up user
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(280) UNIQUE NOT NULL,
  content_html TEXT NOT NULL,
  cover_image VARCHAR(500),
  author_id INT NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'published' | 'rejected'
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Comments + star reviews on blog posts
CREATE TABLE IF NOT EXISTS blog_comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5), -- nullable, used for "review"
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Syllabus pages: rich-text (WYSIWYG) documents written by admin, can embed book purchase links
CREATE TABLE IF NOT EXISTS syllabus_pages (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(280) UNIQUE NOT NULL,
  content_html TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  author_id INT REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Generic pages admin can edit (Home intro, Miscellaneous, etc.)
CREATE TABLE IF NOT EXISTS site_pages (
  id SERIAL PRIMARY KEY,
  page_key VARCHAR(80) UNIQUE NOT NULL, -- 'home_intro', 'miscellaneous', 'footer_about'
  title VARCHAR(255),
  content_html TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category, is_published);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_comments_post ON blog_comments(post_id);

-- Session store table (created automatically by connect-pg-simple, kept here for reference)
-- CREATE TABLE "session" ( ... ) -- auto-generated, see connect-pg-simple docs
