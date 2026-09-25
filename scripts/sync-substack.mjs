import { readFile, writeFile } from "node:fs/promises";

const feedUrl = "https://samatarelmi.substack.com/feed";
const dataPath = new URL("../assets/data/newsletter-posts.json", import.meta.url);

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

const excerpt = (text, limit = 320) => {
  if (text.length <= limit) return text;
  const shortened = text.slice(0, limit + 1).replace(/\s+\S*$/, "");
  return `${shortened}…`;
};

const response = await fetch(feedUrl, { headers: { "user-agent": "samatarelmi.co.uk newsletter sync" } });
const xml = await response.text();

if (!response.ok || /invite-only/i.test(xml)) {
  console.log("Dunya’s feed is not public yet; keeping the existing website posts unchanged.");
  process.exit(0);
}

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
if (!items.length) {
  console.log("No public Substack posts were found; keeping the existing website posts unchanged.");
  process.exit(0);
}

const substackPosts = items.slice(0, 12).map((item) => {
  const description = tagValue(item, "content:encoded") || tagValue(item, "description");
  const published = new Date(tagValue(item, "pubDate"));
  return {
    title: plainText(tagValue(item, "title")),
    date: Number.isNaN(published.getTime()) ? new Date().toISOString().slice(0, 10) : published.toISOString().slice(0, 10),
    category: plainText(tagValue(item, "category")) || "Dunya",
    excerpt: excerpt(plainText(description)),
    url: tagValue(item, "link"),
    source: "Substack",
  };
}).filter((post) => post.title && post.url);

const current = JSON.parse(await readFile(dataPath, "utf8"));
const localPosts = current.posts.filter((post) => post.source !== "Substack");
const posts = [...localPosts, ...substackPosts].sort((a, b) => b.date.localeCompare(a.date));
const unchanged = JSON.stringify(current.posts) === JSON.stringify(posts);

if (unchanged) {
  console.log("Dunya post previews are already current.");
  process.exit(0);
}

const next = { ...current, updated: new Date().toISOString(), posts };
await writeFile(dataPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
console.log(`Updated the website with ${substackPosts.length} public Dunya post previews.`);
