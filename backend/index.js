import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// === ŚCIEŻKI I SETUP
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 4000;
const JWT_SECRET = 'tajny_klucz'; // Możesz zmienić na bardziej losowy

// === MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());

// === BAZA DANYCH
const db = new sqlite3.Database('./bp_data.db');

// Tworzenie tabeli, jeśli nie istnieje
db.run(`
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  systolic INTEGER,
  diastolic INTEGER,
  pulse INTEGER,
  notes TEXT,
  date TEXT,
  user TEXT
)
`);

// === AUTORYZACJA (JWT)
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// === ROUTES

// Logowanie (na sztywno użytkownik, np. z pliku konfiguracyjnego)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Przykładowe dane — można dodać plik `users.json`
  if (username === 'admin' && password === '1234') {
    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Błędny login lub hasło' });
  }
});

// Dodawanie pomiaru
app.post('/api/readings', authenticateToken, (req, res) => {
  const { systolic, diastolic, pulse, notes, date } = req.body;
  const user = req.user.username;
  db.run(
    `INSERT INTO readings (systolic, diastolic, pulse, notes, date, user)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [systolic, diastolic, pulse, notes || '', date, user],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Pobieranie pomiarów użytkownika
app.get('/api/readings', authenticateToken, (req, res) => {
  const user = req.user.username;
  db.all(
    `SELECT * FROM readings WHERE user = ? ORDER BY date DESC`,
    [user],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Edycja pomiaru
app.put('/api/readings/:id', authenticateToken, (req, res) => {
  const { systolic, diastolic, pulse, notes } = req.body;
  const id = req.params.id;
  const user = req.user.username;

  db.run(
    `UPDATE readings SET systolic = ?, diastolic = ?, pulse = ?, notes = ?
     WHERE id = ? AND user = ?`,
    [systolic, diastolic, pulse, notes, id, user],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Usuwanie pomiaru
app.delete('/api/readings/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const user = req.user.username;

  db.run(
    `DELETE FROM readings WHERE id = ? AND user = ?`,
    [id, user],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});


// === SERWOWANIE FRONTENDU (build z Vite)
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// SPA fallback – przekierowanie wszystkich nie-API ścieżek do index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// === START
app.listen(port, () => {
  console.log(`✅ Serwer działa na http://localhost:${port}`);
});
