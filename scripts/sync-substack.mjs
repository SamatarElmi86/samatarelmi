import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const feedUrl = "https://samatarelmi.substack.com/feed";
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

async function fetchFeed() {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "application/rss+xml, application/xml, text/xml, */*"
      }
    });
    if (!response.ok) {
      console.warn(`Feed fetch returned status: ${response.status}`);
      return [];
    }
    const xml = await response.text();
    if (!xml || /invite-only/i.test(xml)) {
      console.warn("Disregard Prior Prompt feed is not public or empty");
      return [];
    }
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
    return items.map((item) => {
      const description = tagValue(item, "description") || tagValue(item, "content:encoded");
      const rawDate = tagValue(item, "pubDate");
      const published = new Date(rawDate);
      return {
        title: plainText(tagValue(item, "title")),
        date: Number.isNaN(published.getTime()) ? new Date().toISOString().slice(0, 10) : published.toISOString().slice(0, 10),
        category: plainText(tagValue(item, "category")) || "Disregard Prior Prompt",
        excerpt: excerpt(plainText(description)),
        url: tagValue(item, "link"),
        source: "Substack",
      };
    }).filter((post) => post.title && post.url);
  } catch (err) {
    console.warn("Failed to fetch Substack feed:", err.message);
    return [];
  }
}

async function sync() {
  const currentRaw = await readFile(dataPath, "utf8");
  const current = JSON.parse(currentRaw);
  const existingPosts = Array.isArray(current.posts) ? current.posts : [];

  const fetchedSubstackPosts = await fetchFeed();
  console.log(`Fetched ${fetchedSubstackPosts.length} items from Substack RSS feed.`);

  // Deduplicate and merge:
  // Key by URL, or normalized title to avoid duplicates between local and substack
  const postMap = new Map();

  // 1. Add all existing posts (preserves historical Substack articles and local essays)
  for (const post of existingPosts) {
    const key = post.url.toLowerCase().trim();
    postMap.set(key, post);
  }

  // 2. Add or update with newly fetched Substack posts
  for (const post of fetchedSubstackPosts) {
    const key = post.url.toLowerCase().trim();
    postMap.set(key, post);
  }

  // 3. Prevent duplicate if essay exists as both local and Substack
  const allPosts = Array.from(postMap.values());
  const finalPosts = [];
  const seenTitles = new Set();

  // Sort descending by date
  allPosts.sort((a, b) => b.date.localeCompare(a.date));

  for (const post of allPosts) {
    const normalizedTitle = post.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seenTitles.has(normalizedTitle)) {
      // If we have both, prefer local essay if it has local URL, else keep first
      continue;
    }
    seenTitles.add(normalizedTitle);
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
          const isSubstack = post.source === "Substack";
          const sourceLabel = isSubstack ? "Disregard Prior Prompt · Substack" : (post.category || "Dispatch");
          const targetAttr = isSubstack ? ' target="_blank" rel="noopener noreferrer"' : '';
          const ctaText = isSubstack ? "Continue on Substack →" : "Read the essay →";
          return `          <article class="journal-card">
            <p class="meta">${formatDate(post.date)} · ${sourceLabel}</p>
            <h3><a href="${post.url}"${targetAttr}>${post.title}</a></h3>
            <p>${post.excerpt}</p>
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
