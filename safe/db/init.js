// Initializes campusconnect.sqlite from schema.sql and seeds realistic test data.
// Run with: node db/init.js
// Safe to re-run: deletes any existing db file first.

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "campusconnect.sqlite");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log("Removed existing database file.");
}

const db = new sqlite3.Database(DB_PATH);
const schema = fs.readFileSync(SCHEMA_PATH, "utf8");

function hash(pw) {
  return bcrypt.hashSync(pw, 10);
}

db.serialize(() => {
  db.exec(schema, (err) => {
    if (err) throw err;
    console.log("Schema created.");
  });

  const users = [
    [
      "alice",
      "alice123",
      "alice@campusconnect.edu",
      "Alice Khan",
      "Second-year CS student. Loves databases.",
      0,
    ],
    [
      "bilal",
      "bilal123",
      "bilal@campusconnect.edu",
      "Bilal Ahmed",
      "Studying software engineering.",
      0,
    ],
    [
      "admin",
      "admin123",
      "admin@campusconnect.edu",
      "Portal Admin",
      "System administrator account.",
      1,
    ],
  ];

  const insertUser = db.prepare(
    "INSERT INTO users (username, password_hash, email, full_name, bio, is_admin) VALUES (?, ?, ?, ?, ?, ?)",
  );
  for (const [username, pw, email, fullName, bio, isAdmin] of users) {
    insertUser.run(username, hash(pw), email, fullName, bio, isAdmin);
  }
  insertUser.finalize();

  const posts = [
    [
      1,
      "Welcome to CampusConnect",
      "Excited to start this semester! Looking for study partners for Data Structures.",
    ],
    [
      2,
      "Library hours this week",
      "The main library is open until midnight during exam week.",
    ],
  ];
  const insertPost = db.prepare(
    "INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)",
  );
  for (const [userId, title, body] of posts) {
    insertPost.run(userId, title, body);
  }
  insertPost.finalize();

  const comments = [
    [1, 2, "Count me in, I need a study partner too!"],
    [2, 1, "Thanks for the heads up about library hours."],
  ];
  const insertComment = db.prepare(
    "INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)",
  );
  for (const [postId, userId, body] of comments) {
    insertComment.run(postId, userId, body);
  }
  insertComment.finalize();

  const grades = [
    [1, "Data Structures", "A"],
    [1, "Operating Systems", "B+"],
    [2, "Data Structures", "A-"],
    [2, "Database Systems", "B"],
  ];
  const insertGrade = db.prepare(
    "INSERT INTO grades (student_id, course, grade) VALUES (?, ?, ?)",
  );
  for (const [studentId, course, grade] of grades) {
    insertGrade.run(studentId, course, grade);
  }
  insertGrade.finalize();
});

db.close((err) => {
  if (err) throw err;
  console.log("Database seeded successfully at", DB_PATH);
  console.log(
    "Seed accounts: alice/alice123, bilal/bilal123, admin/admin123 (admin flag set)",
  );
});
