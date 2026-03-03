function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Kun admins har adgang til denne funktion' });
  }
  next();
}

module.exports = { adminOnly };
