export const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  return next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  return next();
};
