function attachUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  next();
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Forbidden',
      message: 'Admin access required.'
    });
  }
  next();
}

module.exports = { attachUser, requireLogin, requireAdmin };
