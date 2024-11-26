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
  try {
    // Fetch 4 random posts from the database
    const randomPostsResult = await app.locals.pool.query(
      `
      SELECT * 
      FROM post
      ORDER BY RANDOM()
      LIMIT 4
      `
    );

    res.render("start", { posts: randomPostsResult.rows });
  } catch (error) {
    console.error("Error fetching random posts for the start page:", error);
    res.status(500).send("An error occurred while loading the start page.");
  }
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

  try {
    // Fetch the top 6 posts with the most likes
    const topPostsResult = await app.locals.pool.query(
      `
      SELECT 
        post.*, 
        COUNT(votes.id) AS like_count 
      FROM post
      LEFT JOIN votes ON post.id = votes.post_id
      GROUP BY post.id
      ORDER BY like_count DESC, upload_date DESC
      LIMIT 6
      `
    );

    res.render("ranking", { posts: topPostsResult.rows });
  } catch (error) {
    console.error("Error fetching top posts for ranking:", error);
    res.status(500).send("An error occurred while loading the ranking.");
  }
});

app.get("/profile", async function (req, res) {
  res.render("profile", {});
});

app.get("/foryou", async function (req, res) {
  if (!req.session.userid) {
    res.redirect("/login");
    return;
  }

  try {
    const postsResult = await app.locals.pool.query(`
      SELECT 
        post.*, 
        COUNT(votes.id) AS like_count 
      FROM post
      LEFT JOIN votes ON post.id = votes.post_id
      GROUP BY post.id
      ORDER BY upload_date DESC
    `);

    res.render("foryou", { posts: postsResult.rows });
  } catch (error) {
    console.error("Error fetching posts with likes:", error);
    res.status(500).send("An error occurred while loading posts.");
  }
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

app.post("/like/:id", async function (req, res) {
  if (!req.session.userid) {
    res.redirect("/login");
    return;
  }

  try {
    const postId = req.params.id; // Get the post ID from the URL
    const userId = req.session.userid; // Get the logged-in user's ID

    // Check if the user has already liked this post
    const likeExists = await app.locals.pool.query(
      "SELECT * FROM votes WHERE user_id = $1 AND post_id = $2",
      [userId, postId]
    );

    if (likeExists.rows.length === 0) {
      // If the user has not liked this post, insert a like
      await app.locals.pool.query(
        "INSERT INTO votes (user_id, post_id) VALUES ($1, $2)",
        [userId, postId]
      );
      console.log(`User ${userId} liked post ${postId}`);
    } else {
      console.log(`User ${userId} has already liked post ${postId}`);
    }

    res.redirect("/foryou"); // Redirect back to the For You page
  } catch (error) {
    console.error("Error processing like:", error);
    res.status(500).send("An error occurred while processing your like.");
  }
});

app.get("/logout", function (req, res) {
  if (req.session) {
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error during session destruction:", err);
        res.status(500).send("An error occurred during logout.");
      } else {
        // Redirect to login or start page after logging out
        res.redirect("/login");
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/post/:id", async function (req, res) {
  const postId = req.params.id;

  try {
    // Fetch the post details and username by joining the post and users tables
    const postResult = await app.locals.pool.query(
      `
      SELECT 
        post.*, 
        users.username, 
        COUNT(votes.id) AS like_count 
      FROM post
      LEFT JOIN users ON post.user_id = users.id
      LEFT JOIN votes ON post.id = votes.post_id
      WHERE post.id = $1
      GROUP BY post.id, users.username
      `,
      [postId]
    );

    // If no post is found, return a 404 error
    if (postResult.rows.length === 0) {
      return res.status(404).send("Post not found");
    }

    const post = postResult.rows[0];

    // Render the post details page
    res.render("post", { post });
  } catch (error) {
    console.error("Error fetching post details:", error);
    res.status(500).send("An error occurred while fetching the post details.");
  }
});

app.post("/comment/:postId", async function (req, res) {
  if (!req.session.userid) {
    res.redirect("/login");
    return;
  }

  try {
    const { content } = req.body; // Get comment content from the form
    const userId = req.session.userid;
    const postId = req.params.postId;

    // Insert the new comment into the database
    await app.locals.pool.query(
      "INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3)",
      [userId, postId, content]
    );

    res.redirect(`/post/${postId}`); // Redirect back to the post details page
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).send("An error occurred while adding your comment.");
  }
});

app.get("/comments/:postId/:page", async function (req, res) {
  const postId = req.params.postId;
  const page = parseInt(req.params.page) || 1; // Page number (default is 1)
  const limit = 3; // Number of comments per page
  const offset = (page - 1) * limit;

  try {
    // Fetch paginated comments for the post
    const commentsResult = await app.locals.pool.query(
      `
      SELECT 
        comments.content, 
        comments.comment_date, 
        users.username 
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = $1
      ORDER BY comments.comment_date DESC
      LIMIT $2 OFFSET $3
      `,
      [postId, limit, offset]
    );

    res.json(commentsResult.rows); // Return comments as JSON
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).send("An error occurred while fetching comments.");
  }
});
