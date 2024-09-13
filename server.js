// server.js
const express = require("express");
const app = express();
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");

const db = new sqlite3.Database("./database.sqlite");

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        score INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// Routes

// User registration
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, hashedPassword],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Username already exists." });
      }
      req.session.userId = this.lastID;
      req.session.username = username;
      res.json({ message: "Registration successful." });
    }
  );
});

// User login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    req.session.userId = user.id;
    req.session.username = username;
    res.json({ message: "Login successful." });
  });
});

// Change password
app.post("/change-password", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  const { password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `UPDATE users SET password = ? WHERE id = ?`,
    [hashedPassword, req.session.userId],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Could not change password." });
      }
      res.json({ message: "Password changed successfully." });
    }
  );
});

// Submit score
app.post("/submit-score", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  const { score } = req.body;
  const userId = req.session.userId;

  db.run(
    `INSERT INTO scores (user_id, score) VALUES (?, ?)`,
    [userId, score],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Could not save score." });
      }
      res.json({ message: "Score submitted successfully." });
    }
  );
});

// Get scores
app.get("/scores", (req, res) => {
  const userId = req.session.userId || 0;

  db.serialize(() => {
    db.get(
      `SELECT MAX(score) as highestScore FROM scores`,
      (err, overallHighScore) => {
        db.get(
          `SELECT MAX(score) as userHighScore FROM scores WHERE user_id = ?`,
          [userId],
          (err, userHighScore) => {
            res.json({
              overallHighScore: overallHighScore.highestScore || 0,
              userHighScore: userHighScore
                ? userHighScore.userHighScore || 0
                : 0,
            });
          }
        );
      }
    );
  });
});

// Get username
app.get("/get-username", (req, res) => {
  if (req.session.username) {
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ message: "Unauthorized." });
  }
});

// Check if user is logged in
app.get("/is-logged-in", (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

// User logout
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully." });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
