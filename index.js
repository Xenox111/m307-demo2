import { createApp, upload } from "./config.js";

const app = createApp({
  user: "twilight_sunset_1970",
  host: "bbz.cloud",
  database: "twilight_sunset_1970",
  password: "fe481b3d0355958b883c084760bebbbe",
  port: 30211,
});

/* Startseite */
app.get("/", async function (req, res) {
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
  res.render("profile", {});
});

app.get("/foryou", async function (reg, res) {
  const posts = await app.locals.pool.query("select * from post");
  res.render("foryou", { posts: posts.rows });
});

app.get("/new_post", async function (req, res) {
  if (!req.session.userid) {
    res.redirect("/login");
    return;
  }

  try {
    // Log the session user ID for debugging
    console.log("Session User ID:", req.session.userid);

    // Fetch the current user's username from the database
    const userResult = await app.locals.pool.query(
      "SELECT username FROM users WHERE id = $1",
      [req.session.userid]
    );

    // If no user is found, redirect to login
    if (userResult.rows.length === 0) {
      console.error("No user found for ID:", req.session.userid);
      res.redirect("/login");
      return;
    }

    const username = userResult.rows[0].username;
    console.log("Fetched Username:", username);

    // Fetch posts created by the current user
    const postsResult = await app.locals.pool.query(
      "SELECT * FROM post WHERE user_id = $1 ORDER BY upload_date DESC",
      [req.session.userid]
    );

    // Render the "new_post" template with username and posts
    res.render("new_post", {
      username: username,
      userPosts: postsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching user data or posts:", error);
    res.status(500).send("An error occurred. Please try again later.");
  }
});

app.post("/create_post", upload.single("photo_url"), async function (req, res) {
  if (!req.session.userid) {
    res.redirect("/login");
    return;
  }
  const result = await app.locals.pool.query(
    "INSERT INTO post (title, description, category, photo_url, user_id, upload_date) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)",
    [
      req.body.title,
      req.body.description,
      req.body.category,
      req.file.filename,
      req.session.userid,
    ]
  );
  console.log(result);
  res.redirect("/");
});

/* Wichtig! Diese Zeilen müssen immer am Schluss der Website stehen! */
app.listen(3010, () => {
  console.log(`Example app listening at http://localhost:3010`);
});
