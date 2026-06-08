const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send('Capstone Lab Management');
});

app.listen(3000, () => {
    console.log('Server berjalan di port 3000');
});