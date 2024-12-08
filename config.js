import express from "express";
import { engine } from "express-handlebars";
import pg from "pg";
const { Pool } = pg;
import cookieParser from "cookie-parser";
import multer from "multer";
const upload = multer({ dest: "public/uploads/" });
import sessions from "express-session";
import bcrypt from "bcrypt";

// Funktion, die die Express-Anwendung erstellt und konfiguriert
export function createApp(dbconfig) {
  const app = express();

  // Verbindung zur PostgreSQL-Datenbank mit den angegebenen Konfigurationsdaten
  const pool = new Pool(dbconfig);

  // Konfiguration von Handlebars als Template-Engine
  app.engine("handlebars", engine());
  app.set("view engine", "handlebars");
  app.set("views", "./views");

  // Middleware für statische Dateien, URL-encoding und Cookie-Parsing
  app.use(express.static("public"));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Middleware für Sitzungsmanagement
  app.use(
    sessions({
      secret: "thisismysecrctekeyfhrgfgrfrty84fwir767", // Geheimschlüssel für Sitzungen
      saveUninitialized: true, // Sitzungen werden gespeichert, auch wenn sie nicht initialisiert sind
      cookie: { maxAge: 86400000, secure: false }, // Sitzungscookie mit einer Laufzeit von einem Tag
      resave: false, // Sitzungen werden nicht bei jeder Anfrage erneut gespeichert
    })
  );

  // Route: Zeigt das Registrierungsformular an
  app.get("/register", function (req, res) {
    res.render("register"); // Rendert die "register"-View
  });

  // Route: Verarbeitet die Registrierung eines neuen Benutzers
  app.post("/register", function (req, res) {
    // Passwort mit Bcrypt hashen
    var password = bcrypt.hashSync(req.body.password, 10);
    pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)", // SQL-Query zum Einfügen des Benutzers
      [req.body.username, password], // Parameter: Benutzername und gehashtes Passwort
      (error, result) => {
        if (error) {
          console.log(error); // Fehlerbehandlung bei Datenbankproblemen
        }
        res.redirect("/login"); // Weiterleitung zur Login-Seite
      }
    );
  });

  // Route: Zeigt das Login-Formular an
  app.get("/login", function (req, res) {
    res.render("login"); // Rendert die "login"-View
  });

  // Route: Verarbeitet das Login eines Benutzers
  app.post("/login", function (req, res) {
    pool.query(
      "SELECT * FROM users WHERE username = $1", // SQL-Query zum Abrufen des Benutzers
      [req.body.username], // Parameter: Benutzername
      (error, result) => {
        if (error) {
          console.log(error); // Fehlerbehandlung bei Datenbankproblemen
        }
        // Überprüft, ob das eingegebene Passwort mit dem gehashten Passwort übereinstimmt
        if (bcrypt.compareSync(req.body.password, result.rows[0].password)) {
          req.session.userid = result.rows[0].id; // Benutzer-ID in der Sitzung speichern
          res.redirect("/"); // Weiterleitung zur Startseite
        } else {
          res.redirect("/login"); // Zurück zur Login-Seite bei fehlerhaften Anmeldedaten
        }
      }
    );
  });

  // Pool-Objekt als globale Variable für die Anwendung bereitstellen
  app.locals.pool = pool;

  return app; // Gibt die konfigurierte App zurück
}

// Exportiert das Upload-Middleware-Objekt für die Handhabung von Datei-Uploads
export { upload };
