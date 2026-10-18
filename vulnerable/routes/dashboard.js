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

router.get("/check-grade", (req, res) => {
  res.render("check-grade", { result: null, studentId: "" });
});

// VULNERABLE: blind boolean-based injection (student_id concatenated directly)
router.get("/check-grade/result", (req, res) => {
  const { student_id } = req.query;
  const query = `SELECT * FROM grades WHERE student_id = ${student_id}`;
  console.log("[VULNERABLE QUERY]", query);
  db.get(query, (err, row) => {
    if (err)
      return res.render("check-grade", {
        result: "error: " + err.message,
        studentId: student_id,
      });
    const result = row ? "Record found" : "No record found";
    res.render("check-grade", { result, studentId: student_id });
  });
});

router.get("/search", (req, res) => {
  res.render("search", { results: null, query: "", error: null });
});

// VULNERABLE: search term concatenated directly into SQL.
// Returns real rows on screen, which makes UNION-based extraction possible.
// This is the target for the Advanced SQLi chain: column count -> schema
// enumeration (sqlite_master) -> column names -> actual data.
router.get("/search/results", (req, res) => {
  const { q } = req.query;
  const sql = `SELECT title, body FROM posts WHERE title LIKE '%${q}%'`;
  console.log("[VULNERABLE QUERY]", sql);

  db.all(sql, (err, rows) => {
    if (err)
      return res.render("search", {
        results: null,
        query: q,
        error: err.message,
      });
    res.render("search", { results: rows, query: q, error: null });
  });
});

module.exports = router;
