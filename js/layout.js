/* Renders the navbar + footer into #site-header / #site-footer placeholders.
   Call renderLayout() at the top of every page after store.js is loaded. */

function renderLayout() {
  const db = loadDB();
  const user = getSession();
  const links = [...db.navLinks].sort((a, b) => a.order - b.order);

  const headerEl = document.getElementById('site-header');
  if (headerEl) {
    headerEl.innerHTML = `
      <a class="brand" href="index.html">IASBABU</a>
      <nav class="nav-links">
        ${links.map(l => `<a href="${l.url}">${l.label}</a>`).join('')}
      </nav>
      <div class="nav-auth">
        ${user
          ? `<span class="hi">Hi, ${escapeHtml(user.name)}</span>
             ${user.role === 'admin' ? '<a href="admin.html" class="btn-ghost">Admin</a>' : ''}
             <button class="btn-ghost" id="logout-btn" type="button">Log out</button>`
          : `<a href="login.html" class="btn-ghost">Log in</a><a href="signup.html" class="btn-solid">Sign up</a>`
        }
      </div>`;
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => { clearSession(); location.href = 'index.html'; });
  }

  const footerEl = document.getElementById('site-footer');
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="footer-grid">
        <div>
          <h3>IASBABU</h3>
          <p>${db.sitePages.miscellaneous ? '' : ''}Serving Next Generation of Government Jobs aspirant with accessibility of guidance and resources for UPSC, SSC, Banking, and other Competitive Exams.</p>
        </div>
        <div>
          <h4>EXPLORE</h4>
          <a href="latest-jobs.html">Latest Jobs Notifications</a>
          <a href="result.html">Result</a>
          <a href="syllabus.html">Syllabus</a>
          <a href="blog.html">Blogs</a>
        </div>
        <div>
          <h4>GET INVOLVED</h4>
          <a href="blog.html#write">Write a Blog</a>
          <a href="signup.html">Sign Up</a>
        </div>
        <div>
          <h4>CONTACT</h4>
          <a href="mailto:contact@iasbabu.org">contact@iasbabu.org</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${new Date().getFullYear()} IASBABU. All rights reserved.</span>
        <span class="footer-links"><a href="admin.html">Admin</a></span>
      </div>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function requireLoginRedirect(targetIfLoggedOut) {
  const user = getSession();
  if (!user) { location.href = targetIfLoggedOut || 'login.html'; return null; }
  return user;
}

function requireAdminRedirect() {
  const user = getSession();
  if (!user || user.role !== 'admin') { location.href = 'login.html'; return null; }
  return user;
}

document.addEventListener('DOMContentLoaded', renderLayout);
