module.exports = function allowedRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/login');
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).send("Akses ditolak");
    }

    next();
  };
};