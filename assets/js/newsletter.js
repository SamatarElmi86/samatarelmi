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
    const isPaid = Boolean(post.isPaid || post.access === "paid");
    if (isPaid) {
      article.setAttribute("data-access", "paid");
    }

    const meta = document.createElement("p");
    meta.className = "meta";
    let sourceLabel;
    if (post.source === "Substack") {
      sourceLabel = isPaid
        ? "Paid subscribers · Disregard Prior Prompt"
        : "Disregard Prior Prompt · Substack";
    } else {
      sourceLabel = post.category || "Dispatch";
    }
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

    let excerpt = null;
    if (post.excerpt && post.excerpt.trim()) {
      excerpt = document.createElement("p");
      excerpt.textContent = post.excerpt;
    }

    const readLink = titleLink.cloneNode();
    readLink.className = "text-link";
    if (isPaid) {
      readLink.textContent = "Read with a subscription →";
    } else if (post.source === "Substack") {
      readLink.textContent = "Continue on Substack →";
    } else {
      readLink.textContent = "Read the essay →";
    }

    article.append(meta, heading);
    if (excerpt) {
      article.append(excerpt);
    }
    article.append(readLink);
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
