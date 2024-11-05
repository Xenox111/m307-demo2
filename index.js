import { createApp, upload } from "./config.js";

const app = createApp({
  user: "twilight_sunset_1970",
  host: "bbz.cloud",
  database: "twilight_sunset_1970",
  password: "fe481b3d0355958b883c084760bebbbe",
  port: 30211,
});

/* Startseite */
app.get("/start", async function (req, res) {
  res.render("start", {});
});

app.get("/impressum", async function (req, res) {
  res.render("impressum", {});
});

app.get("/login", async function (req, res) {
  res.render("login", {});
});

app.get("/register", async function (req, res) {
  res.render("register", {});
});

app.get("/post", async function (req, res) {
  res.render("post", {});
});

app.get("/ranking", async function (req, res) {
  if (!req.session.userid) {
    res.redirect("/login");
    return;
  }
  res.render("ranking", {});
});

app.get("/profile", async function (req, res) {
  if (!req.session.userid) {
    res.redirect("/login");
    return;
  }
  res.render("profile", {});
});

app.get("/foryou", async function (req, res) {
  if (!req.session.userid) {
    res.redirect("/login");
    return;
  }
  res.render("foryou", {});
});

app.get("/foryou", async function (reg, res) {
  const events = await app.locals.pool.query("select * from post");
  res.render("/foryou", { post: post.rows });
});

app.get("/new_post", async function (req, res) {
  if (!req.session.userid) {
    res.redirect("/login");
    return;
  }
  res.render("new_post", {});
});

app.post("/create_post", upload.single("photo_url"), async function (req, res) {
  if (!req.session.userid) {
    res.redirect("/login");
    return;
  }
  const result = await app.locals.pool.query(
    "INSERT INTO post (title, description, category, photo_url, upload_date, user_id) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 1)",
    [
      req.body.title,
      req.body.description,
      req.body.category,
      req.body.photo_url,
    ]
  );
  console.log(result);
  res.redirect("/start");
});

/* Wichtig! Diese Zeilen müssen immer am Schluss der Website stehen! */
app.listen(3010, () => {
  console.log(`Example app listening at http://localhost:3010`);
});
