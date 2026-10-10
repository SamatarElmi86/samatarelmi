import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const feedUrl = "https://samatarelmi.substack.com/feed";
const apiUrl = "https://samatarelmi.substack.com/api/v1/posts?limit=50";
const dataPath = path.resolve(__dirname, "../assets/data/newsletter-posts.json");
const htmlPath = path.resolve(__dirname, "../newsletter.html");

const decodeXml = (value = "") => value
  .replace(/^<!\[CDATA\[|\]\]>$/g, "")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "’")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .trim();

const tagValue = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] || "");
};

const plainText = (html = "") => decodeXml(html)
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const excerpt = (text, limit = 280) => {
  if (!text) return "";
  if (text.length <= limit) return text;
  const shortened = text.slice(0, limit + 1).replace(/\s+\S*$/, "");
  return `${shortened}…`;
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(value.includes("T") ? value : `${value}T12:00:00Z`));

async function fetchSubstackPosts() {
  const postsByUrl = new Map();

  // 1. Fetch from Substack public API (provides explicit audience: only_paid vs everyone)
  try {
    const apiRes = await fetch(apiUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "application/json"
      }
    });
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (Array.isArray(apiData)) {
        for (const p of apiData) {
          const isPaid = p.audience === "only_paid";
          const rawDate = p.post_date;
          const published = new Date(rawDate);
          const url = p.canonical_url || `https://samatarelmi.substack.com/p/${p.slug}`;
          const title = plainText(p.title);
          const excerptText = excerpt(plainText(p.subtitle || p.description || ""));
          if (title && url) {
            postsByUrl.set(url.toLowerCase().trim(), {
              title,
              date: Number.isNaN(published.getTime()) ? new Date().toISOString().slice(0, 10) : published.toISOString().slice(0, 10),
              category: "Disregard Prior Prompt",
              excerpt: excerptText,
              url,
              source: "Substack",
              isPaid,
              access: isPaid ? "paid" : "public",
            });
          }
        }
        console.log(`Fetched ${postsByUrl.size} posts from Substack public API.`);
      }
    }
  } catch (err) {
    console.warn("Substack API fetch failed, falling back to RSS:", err.message);
  }

  // 2. Fetch from Substack RSS feed (for resilience and any feed-only items)
  try {
    const feedRes = await fetch(feedUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "application/rss+xml, application/xml, text/xml, */*"
      }
    });
    if (feedRes.ok) {
      const xml = await feedRes.text();
      if (xml && !/invite-only/i.test(xml)) {
        const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
        console.log(`Found ${items.length} items in Substack RSS feed.`);
        for (const item of items) {
          const url = tagValue(item, "link");
          const title = plainText(tagValue(item, "title"));
          if (!url || !title) continue;

          const key = url.toLowerCase().trim();
          const encoded = tagValue(item, "content:encoded");
          const desc = tagValue(item, "description");
          const rawDate = tagValue(item, "pubDate");
          const published = new Date(rawDate);
          const date = Number.isNaN(published.getTime()) ? new Date().toISOString().slice(0, 10) : published.toISOString().slice(0, 10);

          // Detect paid posts from RSS:
          // Substack RSS paywalled posts have a minimal encoded body with only a "Read more" link
          const isPaidInRss = /^\s*<p>\s*<a[^>]*>\s*Read more\s*<\/a>\s*<\/p>\s*$/i.test(encoded) ||
                             (encoded.includes("Read more") && encoded.length < 250);

          if (postsByUrl.has(key)) {
            // Already fetched from API; if excerpt is missing, fill from RSS description
            const existing = postsByUrl.get(key);
            if (!existing.excerpt && desc) {
              existing.excerpt = excerpt(plainText(desc));
            }
          } else {
            // New item found in RSS
            const excerptText = isPaidInRss ? excerpt(plainText(desc)) : excerpt(plainText(desc || encoded));
            postsByUrl.set(key, {
              title,
              date,
              category: plainText(tagValue(item, "category")) || "Disregard Prior Prompt",
              excerpt: excerptText,
              url,
              source: "Substack",
              isPaid: isPaidInRss,
              access: isPaidInRss ? "paid" : "public",
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("Substack RSS feed fetch failed:", err.message);
  }

  return Array.from(postsByUrl.values());
}

async function sync() {
  const currentRaw = await readFile(dataPath, "utf8");
  const current = JSON.parse(currentRaw);
  const existingPosts = Array.isArray(current.posts) ? current.posts : [];
  const fetchedSubstackPosts = await fetchSubstackPosts();
  console.log(`Total Substack posts fetched: ${fetchedSubstackPosts.length}`);

  // Deduplicate and merge:
  // Key by canonical URL
  const postMap = new Map();

  // 1. Add all existing posts (preserves historical Substack articles, local essays, and manual entries)
  for (const post of existingPosts) {
    const key = post.url.toLowerCase().trim();
    postMap.set(key, post);
  }

  // 2. Add or update with newly fetched Substack posts
  for (const post of fetchedSubstackPosts) {
    const key = post.url.toLowerCase().trim();
    const existing = postMap.get(key);
    postMap.set(key, {
      ...existing,
      ...post,
    });
  }

  const allPosts = Array.from(postMap.values());

  // 3. Prevent duplicate ONLY if an essay exists both as a local website essay and a Substack post
  const localTitles = new Set(
    allPosts
      .filter((p) => p.source !== "Substack")
      .map((p) => p.title.toLowerCase().replace(/[^a-z0-9]/g, ""))
  );

  const finalPosts = [];
  // Sort descending by date
  allPosts.sort((a, b) => b.date.localeCompare(a.date));

  for (const post of allPosts) {
    const normalizedTitle = post.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (post.source === "Substack" && localTitles.has(normalizedTitle)) {
      // Prefer the local essay over the duplicate Substack entry
      continue;
    }
    finalPosts.push(post);
  }

  // Write updated newsletter-posts.json
  const next = {
    ...current,
    updated: new Date().toISOString(),
    posts: finalPosts
  };
  await writeFile(dataPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(`Updated newsletter-posts.json with ${finalPosts.length} total posts.`);

  // Also update pre-rendered HTML in newsletter.html
  try {
    let html = await readFile(htmlPath, "utf8");
    const gridStart = html.indexOf('<div class="journal-grid" data-journal-posts aria-live="polite">');
    if (gridStart !== -1) {
      const gridEnd = html.indexOf('</div>', gridStart);
      if (gridEnd !== -1) {
        const renderedCards = finalPosts.map((post) => {
          const isPaid = Boolean(post.isPaid || post.access === "paid");
          const accessAttr = isPaid ? ' data-access="paid"' : '';
          const isSubstack = post.source === "Substack";
          let sourceLabel;
          if (isSubstack) {
            sourceLabel = isPaid
              ? "Paid subscribers · Disregard Prior Prompt"
              : "Disregard Prior Prompt · Substack";
          } else {
            sourceLabel = post.category || "Dispatch";
          }
          const targetAttr = isSubstack ? ' target="_blank" rel="noopener noreferrer"' : '';
          const ctaText = isPaid
            ? "Read with a subscription →"
            : (isSubstack ? "Continue on Substack →" : "Read the essay →");
          const excerptHtml = post.excerpt ? `\n            <p>${post.excerpt}</p>` : '';
          return `          <article class="journal-card"${accessAttr}>
            <p class="meta">${formatDate(post.date)} · ${sourceLabel}</p>
            <h3><a href="${post.url}"${targetAttr}>${post.title}</a></h3>${excerptHtml}
            <a class="text-link" href="${post.url}"${targetAttr}>${ctaText}</a>
          </article>`;
        }).join("\n");
        const newGrid = `<div class="journal-grid" data-journal-posts aria-live="polite">\n${renderedCards}\n        </div>`;
        html = html.slice(0, gridStart) + newGrid + html.slice(gridEnd + 6);
        await writeFile(htmlPath, html, "utf8");
        console.log("Updated pre-rendered journal cards in newsletter.html.");
      }
    }
  } catch (err) {
    console.warn("Failed to update newsletter.html pre-rendered content:", err.message);
  }
}

sync().catch(console.error);
