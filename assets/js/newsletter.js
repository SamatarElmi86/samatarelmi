const journal = document.querySelector("[data-journal-posts]");

const formatDate = (value) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
}).format(new Date(`${value}T12:00:00Z`));

const makePost = (post) => {
  const article = document.createElement("article");
  article.className = "journal-card";

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = `${formatDate(post.date)} · ${post.category || "Dispatch"}`;

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
  readLink.textContent = post.source === "Substack" ? "Continue on Substack →" : "Read the essay →";

  article.append(meta, heading, excerpt, readLink);
  return article;
};

if (journal) {
  fetch("assets/data/newsletter-posts.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Journal data is unavailable");
      return response.json();
    })
    .then((data) => {
      const posts = Array.isArray(data.posts) ? data.posts : [];
      journal.replaceChildren(...posts.map(makePost));
      if (!posts.length) journal.innerHTML = '<p class="journal-empty">New writing will appear here soon.</p>';
    })
    .catch(() => {
      journal.innerHTML = '<p class="journal-empty">The journal archive is temporarily unavailable. <a href="https://samatarelmi.substack.com/">Visit Dunya on Substack</a>.</p>';
    });
}
