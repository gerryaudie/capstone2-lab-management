const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const express = require('express');
const session = require('express-session');

const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const auth = require('./middleware/auth');

const app = express();

const draftRoutes = require('./routes/draftRoutes');

const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/dashboard', dashboardRoutes);

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

// ================= DEBUG ROUTES =================
app.get('/test', (req, res) => {
    res.send('TEST OK');
});

// ================= PROTECTED ROUTE =================
app.get('/dashboard', auth, (req, res) => {
    const user = req.session.user;

    if (user.role === 'administrator') {
        return res.send('Dashboard ADMIN');
    }

    if (user.role === 'kepala_lab') {
        return res.send('Dashboard KEPALA LAB');
    }

    if (user.role === 'kaprodi') {
        return res.send('Dashboard KAPRODI');
    }

    if (user.role === 'staf_administrasi') {
        return res.send('Dashboard STAF ADMIN');
    }

    if (user.role === 'staf_laboratorium') {
        return res.send('Dashboard STAF LAB');
    }

    res.send('Role tidak dikenali');
});

// ================= Draft ===================
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
        if (err) throw err;

        res.render('draft/list', { drafts: results });
    });
});




app.get('/draft/:id', auth, (req, res) => {

    if (req.session.user.role !== 'kaprodi') {
        return res.send('Akses ditolak');
    }

    const draftId = req.params.id;

    const sql = `
        SELECT * FROM detail_pengadaan
        WHERE draft_id = ?
    `;

    db.query(sql, [draftId], (err, results) => {
        if (err) throw err;

        res.render('draft/detail', { items: results, draftId });
    });
});


app.get('/inventaris', auth, (req, res) => {

    const sql = "SELECT * FROM inventaris";

    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('inventaris/list', { items: results });
    });
});



app.get('/approve/:id', auth, (req, res) => {

    const id = req.params.id;

    const sql = "UPDATE detail_pengadaan SET status='approved' WHERE id=?";

    db.query(sql, [id], (err) => {
        if (err) throw err;

        return res.redirect('/draft/list');
    });
});

app.get('/reject/:id', auth, (req, res) => {

    const id = req.params.id;

    const sql = "UPDATE detail_pengadaan SET status='rejected' WHERE id=?";

    db.query(sql, [id], (err) => {
        if (err) throw err;

        return res.redirect('/draft/list');
    });
});




app.post('/draft', auth, (req, res) => {

    const { tahun, nama_barang, jenis, harga, jumlah } = req.body;

    // 1. simpan draft utama
    const sqlDraft = "INSERT INTO draft_pengadaan (tahun, kepala_lab_id, status, created_at) VALUES (?, ?, 'draft', NOW())";

    db.query(sqlDraft, [tahun, req.session.user.id], (err, result) => {
        if (err) throw err;

        const draftId = result.insertId;

        // 2. simpan detail barang
        const sqlDetail = `
            INSERT INTO detail_pengadaan 
            (draft_id, nama_barang, jenis, harga, jumlah, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `;

        db.query(sqlDetail, [draftId, nama_barang, jenis, harga, jumlah], (err2) => {
            if (err2) throw err2;

            res.send("Draft berhasil disimpan!");
        });
    });
});

// ================= START SERVER =================
app.listen(process.env.PORT, () => {
    console.log(`Server berjalan di port ${process.env.PORT}`);
});