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

// Root path '/' agar tidak 404
app.get('/', (req, res) => {
    res.json({ message: "Backend API is ready!", status: "online" });
});

// 1. GET /health [Sesuai Dokumen Aturan]
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ 
            status: "success", 
            message: "Backend is running", 
            database: "connected", 
            student: studentData 
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Backend is running, but database is not connected", 
            database: "disconnected", 
            student: studentData 
        });
    }
});

// 2. GET /schema [Sesuai Dokumen Aturan]
app.get('/schema', (req, res) => {
    res.json({
        student: studentData,
        resource: { name: "vinyls", label: "Katalog Piringan Hitam" },
        fields: [
            { name: "album_title", label: "Judul Album", type: "text", required: true, showInTable: true },
            { name: "artist", label: "Artis/Band", type: "text", required: true, showInTable: true },
            { name: "genre", label: "Genre", type: "text", required: true, showInTable: true },
            { name: "release_year", label: "Tahun Rilis", type: "number", required: false, showInTable: true },
            { name: "price", label: "Harga (Rp)", type: "number", required: true, showInTable: true }
        ],
        endpoints: {
            list: "/vinyls",
            detail: "/vinyls/{id}",
            create: "/vinyls",
            update: "/vinyls/{id}",
            delete: "/vinyls/{id}"
        }
    });
});

// 3. GET /vinyls (Ambil Semua Data)
app.get('/vinyls', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vinyls');
        res.json({
            status: "success",
            message: "Data retrieved successfully",
            data: rows 
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// 4. GET /vinyls/:id (Ambil Detail Data - TAMBAHAN WAJIB)
app.get('/vinyls/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vinyls WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Data not found" });
        }
        res.json({
            status: "success",
            message: "Data retrieved successfully",
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// 5. POST /vinyls (Tambah Data)
app.post('/vinyls', async (req, res) => {
    const { album_title, artist, genre, release_year, price } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO vinyls (album_title, artist, genre, release_year, price) VALUES (?, ?, ?, ?, ?)',
            [album_title, artist, genre, release_year || null, Number(price)]
        );
        res.status(201).json({ 
            status: "success",
            message: "Data created successfully",
            data: { id: result.insertId, album_title, artist, genre, release_year, price }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// 6. PUT /vinyls/:id (Ubah Data)
app.put('/vinyls/:id', async (req, res) => {
    const { album_title, artist, genre, release_year, price } = req.body;
    try {
        await pool.query(
            'UPDATE vinyls SET album_title = ?, artist = ?, genre = ?, release_year = ?, price = ? WHERE id = ?',
            [album_title, artist, genre, release_year || null, Number(price), req.params.id]
        );
        res.json({ 
            status: "success",
            message: "Data updated successfully",
            data: { id: req.params.id, album_title, artist, genre, release_year, price }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// 7. DELETE /vinyls/:id (Hapus Data)
app.delete('/vinyls/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM vinyls WHERE id = ?', [req.params.id]);
        res.json({ 
            status: "success",
            message: "Data deleted successfully" 
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Backend API berjalan di http://localhost:${PORT}`);
});