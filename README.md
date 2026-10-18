# CampusConnect

A small student-portal web app built for Information Security Assignment 2 (Part 2: Web Security Project).

## Use case

CampusConnect is a mini student portal: students log in, view a dashboard, search for
classmates'/posts, comment on posts, maintain account settings, and look up grade records
by student ID. It's built in two parallel versions:

- **`/vulnerable`** — deliberately insecure implementation. Every vulnerability below works end to end.
- **`/safe`** — the same app, hardened with the matching fix for each vulnerability.

Both versions share the same features, routes, and UI, so the only difference between them
is security posture — making the comparison clear for an examiner.

## Tech stack

- Node.js + Express (backend, server-rendered)
- EJS templates (frontend views)
- SQLite (`sqlite3` package) as the database
- `bcryptjs` for password hashing
- `cookie-session` for session management
- `csurf` for CSRF protection (Safe version only)

## How to run

### Vulnerable version (runs on port 3000)

cd vulnerable
npm install
node db/init.js # creates and seeds the database (safe to re-run)
npm start
Visit http://localhost:3000

### Safe version (runs on port 3001)

cd safe
npm install
node db/init.js # creates and seeds the database (safe to re-run)
npm start
Visit http://localhost:3001

### Seed accounts (same in both versions)

| Username | Password | Role    |
| -------- | -------- | ------- |
| alice    | alice123 | student |
| bilal    | bilal123 | student |
| admin    | admin123 | admin   |

## Vulnerabilities implemented

| #   | Vulnerability                                     | Location                                         | Fix applied in Safe version                                                                                                                       |
| --- | ------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | SQL Injection — Easy                              | Login form                                       | Parameterized query (`?` placeholder) + bcrypt password comparison instead of raw string concatenation                                            |
| 2   | SQL Injection — Intermediate (blind boolean)      | "Check Grade Record" (`/dashboard/check-grade`)  | Parameterized query — injected conditions are treated as literal text, not SQL                                                                    |
| 3   | SQL Injection — Advanced (full enumeration chain) | Search Posts (`/dashboard/search`)               | Parameterized query — UNION-based injection and schema enumeration no longer possible                                                             |
| 4   | Stored XSS                                        | Post comments (`/dashboard/post/:id`)            | Comment body rendered with EJS's escaped output (`<%= %>`) instead of raw output (`<%- %>`)                                                       |
| 5   | Reflected XSS                                     | Search results page ("Showing results for: ...") | Same fix — escaped output instead of raw output                                                                                                   |
| 6   | DOM-based XSS                                     | Dashboard tab banner (reads `location.hash`)     | `textContent` used instead of `innerHTML`, so hash content is never parsed as HTML                                                                |
| 7   | CSRF                                              | Update Email (`/dashboard/settings`)             | `csurf` middleware validates a per-session token on every POST; requests without it (e.g. from an external attacker page) are rejected with a 403 |

### A note on SQL Injection (Advanced) and `information_schema`

The assignment's example for schema enumeration references `information_schema`, which is a
MySQL/PostgreSQL feature. SQLite doesn't have it — its built-in equivalent for listing tables,
columns, and schema is `sqlite_master`. We used `sqlite_master` to perform the exact same
technique (enumerate tables → enumerate columns → extract data) that `information_schema`
would be used for in a MySQL-based project. This is the correct, standard substitution for
this stack, not a deviation from the requirement.

## Vulnerability/fix demonstration summary

For every vulnerability above, a working payload was captured against the Vulnerable version,
and the same payload was re-tested against the Safe version to confirm it is blocked. Full
payloads and screenshots for each are included in the submitted Word file, including:

- CSRF: a standalone external attacker page (`csrf-attack.html` / `csrf-attack-safe.html`,
  not part of this repository) that auto-submits a hidden form to the update-email endpoint,
  demonstrating the attack from outside the application.

## Disclaimer

This project is for a university Information Security course. All vulnerabilities are
intentional and for educational use in a local, controlled environment only. Test accounts
and data are fictional. Do not deploy this application, or any part of it, to a public server.
