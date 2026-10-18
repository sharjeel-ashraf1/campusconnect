const express = require("express");
const path = require("path");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "session",
    keys: ["campusconnect-vulnerable-dev-key"],
    maxAge: 24 * 60 * 60 * 1000,
  }),
);

// Make current user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
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

app.listen(PORT, () => {
  console.log(`CampusConnect (VULNERABLE) running at http://localhost:${PORT}`);
});
