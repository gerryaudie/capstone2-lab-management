const db = require('../config/db');

exports.showLogin = (req, res) => {
    res.render('login');
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM pengguna WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            req.session.user = results[0];
            return res.send("LOGIN BERHASIL");
        } else {
            return res.send("LOGIN GAGAL");
        }
    });
};