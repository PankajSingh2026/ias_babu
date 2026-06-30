require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Applying schema...');
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);

    console.log('Seeding default nav links (if empty)...');
    const { rows: navCount } = await client.query('SELECT COUNT(*) FROM nav_links');
    if (parseInt(navCount[0].count, 10) === 0) {
      const defaults = [
        ['Home', '/', 1],
        ['Latest Jobs', '/latest-jobs', 2],
        ['Admit Card', '/admit-card', 3],
        ['Result', '/result', 4],
        ['Syllabus', '/syllabus', 5],
        ['Blog', '/blog', 6],
        ['Miscellaneous', '/miscellaneous', 7]
      ];
      for (const [label, url, sort_order] of defaults) {
        await client.query(
          'INSERT INTO nav_links (label, url, sort_order) VALUES ($1, $2, $3)',
          [label, url, sort_order]
        );
      }
    }

    console.log('Seeding default site pages (if empty)...');
    const { rows: pageCount } = await client.query('SELECT COUNT(*) FROM site_pages');
    if (parseInt(pageCount[0].count, 10) === 0) {
      await client.query(
        `INSERT INTO site_pages (page_key, title, content_html) VALUES
         ('home_intro', 'Welcome', '<p>Serving the next generation of government job aspirants with guidance and resources for UPSC, SSC, Banking, and other competitive exams.</p>'),
         ('footer_about', 'IASBABU', '<p>Serving Next Generation of Government Jobs aspirant with accessibility of guidance and resources for UPSC, SSC, Banking, and other Competitive Exams.</p>'),
         ('miscellaneous', 'Miscellaneous', '<p>Additional resources and information.</p>')`
      );
    }

    console.log('Ensuring admin account exists...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@iasbabu.org';
    const { rows: existingAdmin } = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existingAdmin.length === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 12);
      await client.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [process.env.ADMIN_NAME || 'Site Admin', adminEmail, hash, 'admin']
      );
      console.log(`Admin created: ${adminEmail} (change the password after first login!)`);
    } else {
      console.log('Admin already exists, skipping.');
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
