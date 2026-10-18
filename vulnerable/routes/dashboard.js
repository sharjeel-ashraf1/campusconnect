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

// Post detail page with comments — this is the Stored XSS surface.
router.get("/post/:id", (req, res) => {
  const postId = req.params.id;
  db.get(
    "SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = ?",
    [postId],
    (err, post) => {
      if (!post) return res.redirect("/dashboard");
      db.all(
        "SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE post_id = ? ORDER BY comments.id ASC",
        [postId],
        (err2, comments) => {
          res.render("post", { post, comments: comments || [] });
        },
      );
    },
  );
});

// VULNERABLE: comment body is stored as-is and rendered WITHOUT escaping
// in the view (using EJS's <%- %> instead of <%= %>). This is Stored XSS —
// the payload is saved in the database and executes for every visitor
// who views this post.
router.post("/post/:id/comment", (req, res) => {
  const postId = req.params.id;
  const userId = req.session.user.id;
  const { body } = req.body;
  db.run(
    "INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)",
    [postId, userId, body],
    () => {
      res.redirect("/dashboard/post/" + postId);
    },
  );
});

module.exports = router;
