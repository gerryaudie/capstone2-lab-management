const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const express = require('express');
const session = require('express-session');

const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const draftRoutes = require('./routes/draftRoutes');
const auth = require('./middleware/auth');

const app = express();

<<<<<<< HEAD
=======
const draftRoutes = require('./routes/draftRoutes');

const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/dashboard', dashboardRoutes);

>>>>>>> 5814b9789aaddaede03b6d5d97ea87ab2ad5781b
// ================= MIDDLEWARE =================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// ================= VIEW ENGINE =================
app.set('view engine', 'pug');
app.set('views', './views');

// ================= ROUTES =================
app.use('/', authRoutes);
app.use('/draft', draftRoutes);

// ================= TEST ROUTE =================
app.get('/test', (req, res) => {
    res.send('TEST OK');
});

// ================= DASHBOARD ROUTE REDIRECT =================
app.get('/dashboard', auth, (req, res) => {

    const user = req.session.user;

    const roleMap = {
        administrator: '/dashboard/admin',
        kepala_lab: '/dashboard/kalab',
        kaprodi: '/dashboard/kaprodi',
        staf_administrasi: '/dashboard/staf-admin',
        staf_laboratorium: '/dashboard/staf-lab'
    };

    const redirectUrl = roleMap[user.role];

    if (!redirectUrl) {
        return res.send('Role tidak dikenali');
    }

    return res.redirect(redirectUrl);
});


// ================= DASHBOARD ADMIN =================
app.get('/dashboard/admin', auth, (req, res) => {
    res.render('dashboard/admin');
});

// ================= DASHBOARD KEPALA LAB =================
app.get('/dashboard/kalab', auth, (req, res) => {
    res.render('dashboard/kalab');
});

// ================= DASHBOARD KAPRODI (REAL DATABASE) =================
app.get('/dashboard/kaprodi', auth, (req, res) => {

    const sqlTotal = "SELECT COUNT(*) AS total FROM inventaris";
    const sqlReady = "SELECT COUNT(*) AS ready FROM inventaris WHERE status='ready'";
    const sqlRusak = "SELECT COUNT(*) AS rusak FROM inventaris WHERE status='rusak'";

    db.query(sqlTotal, (err1, totalResult) => {
        if (err1) return res.status(500).send("Database error");

        db.query(sqlReady, (err2, readyResult) => {
            if (err2) return res.status(500).send("Database error");

            db.query(sqlRusak, (err3, rusakResult) => {
                if (err3) return res.status(500).send("Database error");

                res.render('dashboard/kaprodi', {
                    total: totalResult[0].total,
                    ready: readyResult[0].ready,
                    rusak: rusakResult[0].rusak
                });
            });

        });

    });

});

// ================= DASHBOARD STAF ADMIN =================
app.get('/dashboard/staf-admin', auth, (req, res) => {
    res.render('dashboard/staf-admin');
});

// ================= DASHBOARD STAF LAB =================
app.get('/dashboard/staf-lab', auth, (req, res) => {
    res.render('dashboard/staf-lab');
});


// ================= INVENTARIS =================
app.get('/inventaris', auth, (req, res) => {

    const sql = "SELECT * FROM inventaris";

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send("Database error");

        res.render('inventaris/list', { items: results });
    });
});


// ================= DRAFT =================
app.get('/draft', auth, (req, res) => {

    if (req.session.user.role !== 'kepala_lab') {
        return res.send('Akses ditolak');
    }

    res.render('draft/form');
});

app.get('/draft/list', auth, (req, res) => {

    if (req.session.user.role !== 'kaprodi') {
        return res.send('Akses ditolak');
    }

    const sql = `
        SELECT d.id, d.tahun, d.status, u.nama
        FROM draft_pengadaan d
        JOIN pengguna u ON d.kepala_lab_id = u.id
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send("Database error");

        res.render('draft/list', { drafts: results });
    });
});

app.get('/draft/:id', auth, (req, res) => {

    if (req.session.user.role !== 'kaprodi') {
        return res.send('Akses ditolak');
    }

    const sql = `
        SELECT * FROM detail_pengadaan
        WHERE draft_id = ?
    `;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).send("Database error");

        res.render('draft/detail', {
            items: results,
            draftId: req.params.id
        });
    });
});


// ================= APPROVE / REJECT =================
app.get('/approve/:id', auth, (req, res) => {

    const sql = "UPDATE detail_pengadaan SET status='approved' WHERE id=?";

    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).send("Database error");

        res.redirect('/draft/list');
    });
});

app.get('/reject/:id', auth, (req, res) => {

    const sql = "UPDATE detail_pengadaan SET status='rejected' WHERE id=?";

    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).send("Database error");

        res.redirect('/draft/list');
    });
});


// ================= LOGOUT =================
app.get('/logout', (req, res) => {

    req.session.destroy((err) => {
        if (err) return res.status(500).send("Gagal logout");

        res.clearCookie('connect.sid');
        res.redirect('/login');
    });

});


// ================= ADMIN - USER MANAGEMENT =================
app.get('/admin/users', auth, (req, res) => {

    if (req.session.user.role !== 'administrator') {
        return res.send('Akses ditolak');
    }

    const sql = "SELECT * FROM pengguna";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        res.render('admin/users', { users: results });
    });
});


app.get('/admin/users/create', auth, (req, res) => {

    if (req.session.user.role !== 'administrator') {
        return res.send('Akses ditolak');
    }

    res.render('admin/user_create');
});

app.get('/admin/users/delete/:id', auth, (req, res) => {

    if (req.session.user.role !== 'administrator') {
        return res.send('Akses ditolak');
    }

    const sql = "DELETE FROM pengguna WHERE id=?";

    db.query(sql, [req.params.id], (err) => {

        if (err) {
            console.error(err);
            return res.status(500).send("Gagal hapus user");
        }

        res.redirect('/admin/users');
    });
});


app.get('/admin/ruangan', auth, (req, res) => {

    if (req.session.user.role !== 'administrator') {
        return res.send('Akses ditolak');
    }

    const sql = "SELECT * FROM ruangan";

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send("Database error");

        res.render('admin/ruangan', { ruangan: results });
    });
});


app.get('/admin/ruangan/create', auth, (req, res) => {

    if (req.session.user.role !== 'administrator') {
        return res.send('Akses ditolak');
    }

    res.render('admin/ruangan_create');
});


app.get('/admin/ruangan/delete/:id', auth, (req, res) => {

    if (req.session.user.role !== 'administrator') {
        return res.send('Akses ditolak');
    }

    const sql = "DELETE FROM ruangan WHERE id=?";

    db.query(sql, [req.params.id], (err) => {

        if (err) return res.status(500).send("Gagal hapus ruangan");

        res.redirect('/admin/ruangan');
    });
});


app.get('/admin/inventaris', auth, (req, res) => {

    if (req.session.user.role !== 'administrator') {
        return res.send('Akses ditolak');
    }

    const sql = `
        SELECT i.*, r.nama_ruangan 
        FROM inventaris i
        LEFT JOIN ruangan r ON i.room_id = r.id
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        res.render('admin/inventaris', { items: results });
    });
});


app.get('/admin/inventaris/create', auth, (req, res) => {

    const sqlRoom = "SELECT * FROM ruangan";

    db.query(sqlRoom, (err, rooms) => {

        if (err) return res.status(500).send("Database error");

        res.render('admin/inventaris_create', { rooms });
    });
});


app.get('/admin/inventaris/delete/:id', auth, (req, res) => {

    const sql = "DELETE FROM inventaris WHERE id=?";

    db.query(sql, [req.params.id], (err) => {

        if (err) return res.status(500).send("Gagal hapus");

        res.redirect('/admin/inventaris');
    });
});


app.post('/admin/inventaris/create', auth, (req, res) => {

    const { nama, label, room_id, tanggal_terima, kondisi } = req.body;

    const status = req.body.status || 'aktif'; // 🔥 default aman

    console.log("BODY:", req.body); // DEBUG

    const sql = `
        INSERT INTO inventaris 
        (nama, label, room_id, tanggal_terima, kondisi, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [nama, label, room_id, tanggal_terima, kondisi, status], (err) => {

        if (err) {
            console.error("ERROR INVENTARIS:", err);
            return res.send(err.sqlMessage);
        }

        res.redirect('/admin/inventaris');
    });
});



app.post('/admin/ruangan/create', auth, (req, res) => {

    if (req.session.user.role !== 'administrator') {
        return res.send('Akses ditolak');
    }

    console.log(req.body); // 🔥 DEBUG PENTING

    const nama_ruangan = req.body.nama_ruangan;
    const kode_ruangan = req.body.kode_ruangan;
    const lokasi = req.body.lokasi;

    if (!nama_ruangan || !kode_ruangan || !lokasi) {
        return res.send("Data tidak lengkap");
    }

    const sql = `
        INSERT INTO ruangan (nama_ruangan, kode_ruangan, lokasi)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [nama_ruangan, kode_ruangan, lokasi], (err) => {

        if (err) {
            console.error(err);
            return res.send("Gagal tambah ruangan (DB error)");
        }

        res.redirect('/admin/ruangan');
    });
});


// ================= CREATE DRAFT =================
app.post('/draft', auth, (req, res) => {

    const { tahun, nama_barang, jenis, harga, jumlah } = req.body;

    const sqlDraft = `
        INSERT INTO draft_pengadaan (tahun, kepala_lab_id, status, created_at)
        VALUES (?, ?, 'draft', NOW())
    `;

    db.query(sqlDraft, [tahun, req.session.user.id], (err, result) => {

        if (err) return res.status(500).send("Database error");

        const draftId = result.insertId;

        const sqlDetail = `
            INSERT INTO detail_pengadaan
            (draft_id, nama_barang, jenis, harga, jumlah, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `;

        db.query(sqlDetail, [draftId, nama_barang, jenis, harga, jumlah], (err2) => {

            if (err2) return res.status(500).send("Database error");

            res.send("Draft berhasil disimpan!");
        });
    });
});


app.post('/admin/users/create', auth, (req, res) => {

    if (req.session.user.role !== 'administrator') {
        return res.send('Akses ditolak');
    }

    const { nama, email, password, role } = req.body;

    const sql = `
        INSERT INTO pengguna (nama, email, password, role)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [nama, email, password, role], (err) => {

        if (err) {
            console.error(err);
            return res.status(500).send("Gagal menambah user");
        }

        res.redirect('/admin/users');
    });
});

// ================= START SERVER =================
app.listen(process.env.PORT, () => {
    console.log(`Server berjalan di port ${process.env.PORT}`);
});