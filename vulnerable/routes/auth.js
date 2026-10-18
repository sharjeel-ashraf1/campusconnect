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

// NOTE: this is the SAFE baseline query for now.
// We will intentionally rewrite this to be vulnerable in the next step.
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.render("login", { error: "Server error" });
    if (!user)
      return res.render("login", { error: "Invalid username or password" });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok)
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
