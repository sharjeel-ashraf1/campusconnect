const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const router = express.Router();
const db = new sqlite3.Database(
  path.join(__dirname, "..", "db", "campusconnect.sqlite"),
);

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// VULNERABLE: username AND password are concatenated directly into SQL.
// This is intentional — a classic SQL injection login bypass for the assignment.
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = '${username}' AND password_plain = '${password}'`;
  console.log("[VULNERABLE QUERY]", query);

  db.get(query, (err, user) => {
    if (err)
      return res.render("login", { error: "Server error: " + err.message });
    if (!user)
      return res.render("login", { error: "Invalid username or password" });

    req.session.user = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      is_admin: user.is_admin,
    };
    res.redirect("/dashboard");
  });
});

router.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

module.exports = router;
