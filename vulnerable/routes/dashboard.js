const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const router = express.Router();
const db = new sqlite3.Database(
  path.join(__dirname, "..", "db", "campusconnect.sqlite"),
);

router.get("/", (req, res) => {
  db.all(
    "SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.id DESC",
    (err, posts) => {
      res.render("dashboard", { posts: posts || [] });
    },
  );
});

module.exports = router;
