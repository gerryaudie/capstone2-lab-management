const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const express = require('express');
const db = require('./config/db');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Capstone Lab Management');
});

app.listen(process.env.PORT, () => {
    console.log(`Server berjalan di port ${process.env.PORT}`);
});