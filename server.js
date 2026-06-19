const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const studentData = { name: "Fadel Muhammad", nim: "2411522029" };

// Tambahkan ini agar root path '/' tidak 404
app.get('/', (req, res) => {
    res.json({ message: "Backend API is ready!", status: "online" });
});

// 1. GET /health
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: "success", database: "connected", student: studentData });
    } catch (error) {
        res.status(500).json({ status: "error", database: "disconnected", error: error.message });
    }
});

// 2. GET /schema
app.get('/schema', (req, res) => {
    res.json({
        student: { name: "Fadel Muhammad", nim: "2411522029" }, // Tambahkan ini
        resource: { name: "vinyls", label: "Katalog Piringan Hitam" },
        fields: [
            { name: "album_title", label: "Judul Album", type: "text", required: true },
            { name: "artist", label: "Artis/Band", type: "text", required: true },
            { name: "genre", label: "Genre", type: "text", required: true },
            { name: "release_year", label: "Tahun Rilis", type: "number", required: false },
            { name: "price", label: "Harga (Rp)", type: "number", required: true }
        ],
        endpoints: { // Tambahkan ini
            list: "/vinyls",
            detail: "/vinyls/{id}",
            create: "/vinyls",
            update: "/vinyls/{id}",
            delete: "/vinyls/{id}"
        }
    });
});
// 3. GET /vinyls (Langsung kirim array data, ini yang paling disukai frontend)
app.get('/vinyls', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vinyls');
        
        // UBAH RESPONSNYA MENJADI BERBUNGKUS SEPERTI INI:
        res.json({
            status: "success",
            data: rows 
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// 4. POST /vinyls
app.post('/vinyls', async (req, res) => {
    const { album_title, artist, genre, release_year, price } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO vinyls (album_title, artist, genre, release_year, price) VALUES (?, ?, ?, ?, ?)',
            [album_title, artist, genre, release_year || null, Number(price)]
        );
        res.status(201).json({ id: result.insertId, album_title, artist, genre, release_year, price });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. PUT /vinyls/:id
app.put('/vinyls/:id', async (req, res) => {
    const { album_title, artist, genre, release_year, price } = req.body;
    try {
        await pool.query(
            'UPDATE vinyls SET album_title = ?, artist = ?, genre = ?, release_year = ?, price = ? WHERE id = ?',
            [album_title, artist, genre, release_year || null, Number(price), req.params.id]
        );
        res.json({ id: req.params.id, album_title, artist, genre, release_year, price });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. DELETE /vinyls/:id
app.delete('/vinyls/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM vinyls WHERE id = ?', [req.params.id]);
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Backend API berjalan di http://localhost:${PORT}`);
});