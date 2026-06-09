const express = require('express');
const router = express.Router();
const role = require('../middleware/role');

router.get('/', (req, res) => {
  const user = req.user;

  if (!user) return res.redirect('/login');

  switch (user.role) {
    case 'administrator':
      return res.render('dashboards/administrator', { user });

    case 'kepala_laboratorium':
      return res.render('dashboards/kepala_lab', { user });

    case 'ketua_program_studi':
      return res.render('dashboards/kaprodi', { user });

    case 'staf_administrasi':
      return res.render('dashboards/staf_admin', { user });

    case 'staf_laboratorium':
      return res.render('dashboards/staf_lab', { user });

    default:
      return res.status(403).send("Role tidak dikenali");
  }
});

module.exports = router;