const express = require("express");
const path = require("path");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const csrf = require("csurf");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = 3001;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "session",
    keys: ["campusconnect-safe-dev-key"],
    maxAge: 24 * 60 * 60 * 1000,
  }),
);

app.use(csrf());

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.csrfToken = req.csrfToken();
  next();
});

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

app.use("/", authRoutes);
app.use("/dashboard", requireLogin, dashboardRoutes);

app.get("/", (req, res) => {
  res.redirect(req.session.user ? "/dashboard" : "/login");
});

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res
      .status(403)
      .send("Request blocked: invalid or missing CSRF token.");
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`CampusConnect (SAFE) running at http://localhost:${PORT}`);
});
