const express = require('express');
const router = express.Router();

const db = require('../config/db');
const auth = require('../middleware/auth');

// LIST (KAPRODI)
router.get('/list', auth, (req, res) => {

    if (req.session.user.role !== 'kaprodi') {
        return res.send('Akses ditolak');
    }

    const sql = `
        SELECT 
            d.id, d.tahun, u.nama,
            COALESCE(MAX(dp.status), 'pending') AS status
        FROM draft_pengadaan d
        JOIN pengguna u ON d.kepala_lab_id = u.id
        LEFT JOIN detail_pengadaan dp ON dp.draft_id = d.id
        GROUP BY d.id, d.tahun, u.nama
    `;

    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('draft/list', { drafts: results });
    });
});

router.get('/:id', auth, (req, res) => {

    const sql = "SELECT * FROM detail_pengadaan WHERE draft_id=?";

    db.query(sql, [req.params.id], (err, results) => {
        if (err) throw err;
        res.render('draft/detail', { items: results });
    });
});

router.get('/approve/:id', auth, (req, res) => {

    const sql = "UPDATE detail_pengadaan SET status='approved' WHERE id=?";

    db.query(sql, [req.params.id], (err) => {
        if (err) throw err;
        res.redirect('/draft/list');
    });
});

router.get('/reject/:id', auth, (req, res) => {

    const sql = "UPDATE detail_pengadaan SET status='rejected' WHERE id=?";

    db.query(sql, [req.params.id], (err) => {
        if (err) throw err;
        res.redirect('/draft/list');
    });
});

module.exports = router;

