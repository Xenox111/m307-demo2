document.addEventListener("DOMContentLoaded", () => {
  const loadMoreButton = document.getElementById("load-more");
  const commentsContainer = document.getElementById("comments-container");

  // Ensure the button and container exist
  if (!loadMoreButton || !commentsContainer) {
    console.error("Load More button or comments container not found.");
    return;
  }

  const loadComments = async () => {
    try {
      const postId = loadMoreButton.getAttribute("data-postid");
      const page = parseInt(loadMoreButton.getAttribute("data-page"));

      // Fetch comments from the server
      const response = await fetch(`/comments/${postId}/${page}`);
      if (!response.ok) {
        console.error("Failed to fetch comments:", response.statusText);
        return;
      }

      const comments = await response.json();

      comments.forEach((comment) => {
        const commentHtml = `
            <div class="comment">
              <p><strong>${comment.username}</strong></p>
              <p>${comment.content}</p>
              <p><small>${new Date(
                comment.comment_date
              ).toLocaleString()}</small></p>
            </div>
          `;
        commentsContainer.innerHTML += commentHtml;
      });

      // Increment the page for the next fetch
      loadMoreButton.setAttribute("data-page", page + 1);

      // Hide the Load More button if there are no more comments
      if (comments.length < 3) {
        loadMoreButton.style.display = "none";
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  // Attach event listener and load initial comments
  loadMoreButton.addEventListener("click", loadComments);
  loadComments(); // Load the first batch of comments on page load
});
