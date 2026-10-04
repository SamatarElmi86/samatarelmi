// Disregard Prior Prompt Journal & Substack Feed Synchronisation
(function () {
  const journal = document.querySelector("[data-journal-posts]");
  if (!journal) return;

  const formatDate = (value) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/London",
    }).format(new Date(value.includes("T") ? value : `${value}T12:00:00Z`));

  const makePost = (post) => {
    const article = document.createElement("article");
    article.className = "journal-card";

    const meta = document.createElement("p");
    meta.className = "meta";
    const sourceLabel =
      post.source === "Substack"
        ? "Disregard Prior Prompt · Substack"
        : (post.category || "Dispatch");
    meta.textContent = `${formatDate(post.date)} · ${sourceLabel}`;

    const heading = document.createElement("h3");
    const titleLink = document.createElement("a");
    titleLink.href = post.url;
    titleLink.textContent = post.title;
    if (/^https?:\/\//.test(post.url)) {
      titleLink.target = "_blank";
      titleLink.rel = "noopener noreferrer";
    }
    heading.append(titleLink);

    const excerpt = document.createElement("p");
    excerpt.textContent = post.excerpt;

    const readLink = titleLink.cloneNode();
    readLink.className = "text-link";
    readLink.textContent =
      post.source === "Substack"
        ? "Continue on Substack →"
        : "Read the essay →";

    article.append(meta, heading, excerpt, readLink);
    return article;
  };

  const renderPosts = (posts) => {
    if (!posts || !posts.length) return;
    journal.replaceChildren(...posts.map(makePost));
  };

  // Same-origin resilient fetch: load latest cached posts JSON
  fetch("assets/data/newsletter-posts.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const posts = Array.isArray(data.posts) ? data.posts : [];
      if (posts.length > 0) {
        renderPosts(posts);
      }
    })
    .catch((err) => {
      // Graceful degradation: if already pre-rendered, keep DOM as is
      console.warn("Could not refresh newsletter data:", err.message);
    });
})();
