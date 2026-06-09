const db = require('../config/db');

exports.showLogin = (req, res) => {
    res.render('login');
};

// ================= ROLE REDIRECT MAP =================
const roleMap = {
    administrator: '/dashboard/admin',
    kepala_lab: '/dashboard/kalab',
    kaprodi: '/dashboard/kaprodi',
    staf_administrasi: '/dashboard/staf-admin',
    staf_laboratorium: '/dashboard/staf-lab'
};

// ================= LOGIN =================
exports.login = (req, res) => {

    const { email, password } = req.body;

    const sql = "SELECT * FROM pengguna WHERE email=? AND password=?";

    db.query(sql, [email, password], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).send("Error database");
        }

        if (results.length === 0) {
            return res.status(401).send("Email atau password salah");
        }

        const user = results[0];

        // simpan session user
        req.session.user = user;

        // ambil redirect berdasarkan role
        const redirectUrl = roleMap[user.role];

        if (!redirectUrl) {
            return res.status(403).send("Role tidak dikenali");
        }

        return res.redirect(redirectUrl);
    });
};