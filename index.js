import { createApp } from "./config.js";

const app = createApp({
  user: "autumn_star_7622",
  host: "168.119.168.41",
  database: "demo",
  password: "uaioysdfjoysfdf",
  port: 18324,
});

/* Startseite */
app.get("/", async function (req, res) {
  res.render("start", {});
});

app.get("/impressum", async function (req, res) {
  res.render("impressum", {});
});

app.get("/createpost", async function (req, res) {
  res.render("createpost", {});
});

app.get("/login", async function (req, res) {
  res.render("login", {});
});

app.get("/post", async function (req, res) {
  res.render("post", {});
});

app.get("/ranking", async function (req, res) {
  res.render("ranking", {});
});

app.get("/profile", async function (req, res) {
  res.render("profile", {});
});

/* Wichtig! Diese Zeilen müssen immer am Schluss der Website stehen! */
app.listen(3010, () => {
  console.log(`Example app listening at http://localhost:3010`);
});
