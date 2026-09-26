const journal = document.querySelector("[data-journal-posts]");

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(value.includes("T") ? value : `${value}T12:00:00Z`));

const cleanHtmlExcerpt = (html, maxLength = 180) => {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const text = tmp.textContent || tmp.innerText || "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? clean.slice(0, maxLength).trim() + "…" : clean;
};

const makePost = (post) => {
  const article = document.createElement("article");
  article.className = "journal-card";

  const meta = document.createElement("p");
  meta.className = "meta";
  const sourceLabel = post.source === "Substack" ? "Dunya · Substack" : (post.category || "Dispatch");
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
  readLink.textContent = post.source === "Substack" ? "Continue on Substack →" : "Read the essay →";

  article.append(meta, heading, excerpt, readLink);
  return article;
};

const renderPosts = (posts) => {
  if (!journal) return;
  if (!posts || !posts.length) {
    journal.innerHTML = '<p class="journal-empty">New writing will appear here soon.</p>';
    return;
  }
  journal.replaceChildren(...posts.map(makePost));
};

const fetchSubstackLiveFeed = async () => {
  const feedTarget = "https://samatarelmi.substack.com/feed";
  const encodedFeed = encodeURIComponent(feedTarget);
  const endpoints = [
    `https://api.rss2json.com/v1/api.json?rss_url=${encodedFeed}`,
    `https://api.allorigins.win/get?url=${encodedFeed}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();

      if (data && data.status === "ok" && Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map((item) => ({
          title: item.title,
          date: item.pubDate ? item.pubDate.split(" ")[0] : new Date().toISOString().slice(0, 10),
          category: "Substack",
          excerpt: cleanHtmlExcerpt(item.description || item.content),
          url: item.link,
          source: "Substack",
        }));
      }

      if (data && data.contents && typeof data.contents === "string" && data.contents.includes("<item>")) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(data.contents, "application/xml");
        const items = Array.from(xml.querySelectorAll("item"));
        if (items.length > 0) {
          return items.map((el) => {
            const rawDate = el.querySelector("pubDate")?.textContent;
            return {
              title: el.querySelector("title")?.textContent || "Untitled",
              date: rawDate ? new Date(rawDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
              category: "Substack",
              excerpt: cleanHtmlExcerpt(el.querySelector("description")?.textContent || ""),
              url: el.querySelector("link")?.textContent || "https://samatarelmi.substack.com/",
              source: "Substack",
            };
          });
        }
      }
    } catch {
      // Continue
    }
  }
  return null;
};

if (journal) {
  fetch("assets/data/newsletter-posts.json", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : { posts: [] }))
    .catch(() => ({ posts: [] }))
    .then(async (localData) => {
      const localPosts = Array.isArray(localData.posts) ? localData.posts : [];

      if (localPosts.length > 0) {
        renderPosts(localPosts);
      }

      const livePosts = await fetchSubstackLiveFeed();
      if (livePosts && livePosts.length > 0) {
        const existingUrls = new Set(localPosts.map((p) => p.url));
        const newFromSubstack = livePosts.filter((p) => !existingUrls.has(p.url));
        const combined = [...localPosts, ...newFromSubstack].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        renderPosts(combined);
      } else if (!localPosts.length) {
        journal.innerHTML = '<p class="journal-empty">New writing will appear here soon.</p>';
      }
    })
    .catch(() => {
      journal.innerHTML =
        '<p class="journal-empty">The journal archive is temporarily unavailable. <a href="https://samatarelmi.substack.com/">Visit Dunya on Substack</a>.</p>';
    });
}
