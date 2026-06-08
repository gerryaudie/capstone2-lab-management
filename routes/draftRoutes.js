const express = require('express');
const router = express.Router();

const role = require('../middleware/role');
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


router.get('/approve/:id', auth, (req, res) => {

    const id = req.params.id;

    // 1. update status detail jadi approved
    const sql1 = "UPDATE detail_pengadaan SET status='approved' WHERE id=?";

    db.query(sql1, [id], (err) => {
        if (err) throw err;

        // 2. ambil data item yang di-approve
        const sql2 = "SELECT * FROM detail_pengadaan WHERE id=?";

        db.query(sql2, [id], (err2, results) => {
            if (err2) throw err2;

            const item = results[0];

            // 3. INSERT ke inventaris
            const sql3 = `
                INSERT INTO inventaris
                (nama, status)
                VALUES (?, 'aktif')
            `;

            db.query(sql3, [item.nama_barang], (err3) => {
                if (err3) throw err3;

                res.redirect('/draft/list');
            });
        });
    });
});

router.get('/reject/:id', auth, (req, res) => {

    const sql = "UPDATE detail_pengadaan SET status='rejected' WHERE id=?";

    db.query(sql, [req.params.id], (err) => {
        if (err) throw err;
        res.redirect('/draft/list');
    });
});

router.get('/:id', auth, (req, res) => {

    const sql = "SELECT * FROM detail_pengadaan WHERE draft_id=?";

    db.query(sql, [req.params.id], (err, results) => {
        if (err) throw err;
        res.render('draft/detail', { items: results });
    });
});

module.exports = router;