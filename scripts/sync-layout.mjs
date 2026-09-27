#!/usr/bin/env node
/**
 * Layout Synchronizer: Maintains canonical header and footer across all site pages
 * Usage: node scripts/sync-layout.mjs [--check]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const pages = [
  { id: "index.html", path: "index.html", prefix: "" },
  { id: "about.html", path: "about.html", prefix: "" },
  { id: "writing.html", path: "writing.html", prefix: "" },
  { id: "music.html", path: "music.html", prefix: "" },
  { id: "gallery.html", path: "gallery.html", prefix: "" },
  { id: "work-with-me.html", path: "work-with-me.html", prefix: "" },
  { id: "education-editorial.html", path: "education-editorial.html", prefix: "" },
  { id: "course.html", path: "course.html", prefix: "" },
  { id: "services.html", path: "services.html", prefix: "" },
  { id: "research-tools.html", path: "research-tools.html", prefix: "" },
  { id: "newsletter.html", path: "newsletter.html", prefix: "" },
  { id: "events.html", path: "events.html", prefix: "" },
  { id: "press.html", path: "press.html", prefix: "" },
  { id: "contact.html", path: "contact.html", prefix: "" },
  { id: "journal/why-im-not-on-social-media.html", path: "journal/why-im-not-on-social-media.html", prefix: "../" }
];

function getCanonicalHeader(pageId, prefix = "") {
  const practicePages = ["writing.html", "music.html", "gallery.html"];
  const educationPages = ["work-with-me.html", "education-editorial.html", "course.html", "services.html", "research-tools.html"];
  const connectPages = ["press.html", "contact.html"];

  const isPracticeActive = practicePages.includes(pageId);
  const isEducationActive = educationPages.includes(pageId);
  const isConnectActive = connectPages.includes(pageId);

  const cur = (target) => (pageId === target ? ' aria-current="page"' : "");

  return `  <header class="site-header">
    <nav class="nav-shell" aria-label="Primary navigation">
      <a class="wordmark" href="${prefix}index.html">Samatar Elmi</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-menu" aria-label="Toggle navigation menu" data-nav-toggle>
        <span class="nav-toggle__label">Menu</span>
        <span class="nav-toggle__icon" aria-hidden="true">
          <span class="nav-toggle__bar"></span>
          <span class="nav-toggle__bar"></span>
        </span>
      </button>

      <ul class="nav-links" id="primary-menu" data-nav-links>
        <li class="nav-item">
          <a class="nav-link" href="${prefix}about.html"${cur("about.html")}>About</a>
        </li>

        <li class="nav-item nav-item--has-dropdown${isPracticeActive ? " is-active-parent" : ""}" data-nav-dropdown>
          <button class="nav-link nav-disclosure-btn" type="button" aria-expanded="false" aria-controls="dropdown-practice" data-nav-toggle-dropdown>
            <span>Practice</span>
            <svg class="dropdown-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 1 5 5 9 1"></polyline></svg>
          </button>
          <ul class="nav-dropdown" id="dropdown-practice" data-dropdown-menu>
            <li><a class="nav-dropdown-link" href="${prefix}writing.html"${cur("writing.html")}>Writing</a></li>
            <li><a class="nav-dropdown-link" href="${prefix}music.html"${cur("music.html")}>Music</a></li>
            <li><a class="nav-dropdown-link" href="${prefix}gallery.html"${cur("gallery.html")}>Gallery</a></li>
          </ul>
        </li>

        <li class="nav-item nav-item--has-dropdown${isEducationActive ? " is-active-parent" : ""}" data-nav-dropdown>
          <button class="nav-link nav-disclosure-btn" type="button" aria-expanded="false" aria-controls="dropdown-education" data-nav-toggle-dropdown>
            <span>Education &amp; Services</span>
            <svg class="dropdown-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 1 5 5 9 1"></polyline></svg>
          </button>
          <ul class="nav-dropdown" id="dropdown-education" data-dropdown-menu>
            <li><a class="nav-dropdown-link" href="${prefix}work-with-me.html"${cur("work-with-me.html")}>Work with Me</a></li>
            <li><a class="nav-dropdown-link" href="${prefix}education-editorial.html"${cur("education-editorial.html")}>Education &amp; Editorial</a></li>
            <li><a class="nav-dropdown-link" href="${prefix}course.html"${cur("course.html")}>Course</a></li>
            <li><a class="nav-dropdown-link" href="${prefix}services.html"${cur("services.html")}>Mentoring &amp; Services</a></li>
            <li><a class="nav-dropdown-link" href="${prefix}research-tools.html"${cur("research-tools.html")}>Research &amp; Tools</a></li>
          </ul>
        </li>

        <li class="nav-item">
          <a class="nav-link" href="${prefix}newsletter.html"${pageId === "newsletter.html" ? ' aria-current="page"' : ""}>Journal</a>
        </li>

        <li class="nav-item">
          <a class="nav-link" href="${prefix}events.html"${cur("events.html")}>Events</a>
        </li>

        <li class="nav-item nav-item--has-dropdown${isConnectActive ? " is-active-parent" : ""}" data-nav-dropdown>
          <button class="nav-link nav-disclosure-btn" type="button" aria-expanded="false" aria-controls="dropdown-connect" data-nav-toggle-dropdown>
            <span>Connect</span>
            <svg class="dropdown-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 1 5 5 9 1"></polyline></svg>
          </button>
          <ul class="nav-dropdown" id="dropdown-connect" data-dropdown-menu>
            <li><a class="nav-dropdown-link" href="${prefix}press.html"${cur("press.html")}>Press</a></li>
            <li><a class="nav-dropdown-link" href="${prefix}contact.html"${cur("contact.html")}>Contact</a></li>
          </ul>
        </li>
      </ul>
    </nav>
  </header>`;
}

function getCanonicalFooter(prefix = "") {
  return `  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <p class="footer-title">Ancestral speculation. Speculative futures.</p>
        <div class="footer-col">
          <p class="footer-label">Enquiries</p>
          <ul class="footer-links">
            <li><a href="mailto:management@samatarelmi.co.uk">management@samatarelmi.co.uk</a></li>
            <li><a href="${prefix}contact.html">Contact and representation</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Music, journal &amp; values</p>
          <ul class="footer-links">
            <li><a href="https://knomadspock.bandcamp.com/" target="_blank" rel="noopener noreferrer">Bandcamp</a></li>
            <li><a href="${prefix}newsletter.html">Dunya journal</a></li>
            <li><a href="https://samatarelmi.substack.com/" target="_blank" rel="noopener noreferrer">Substack</a></li>
            <li><a href="${prefix}contact.html#social-media">Why I’m not on social media</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-meta">
        <span>© <span data-year>2026</span> Samatar Elmi</span>
        <span>samatarelmi.co.uk</span>
      </div>
    </div>
  </footer>`;
}

console.log(`Checking/updating ${pages.length} site pages...`);
let updated = 0;

for (const page of pages) {
  const fullPath = path.join(repoRoot, page.path);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${page.path}`);
    continue;
  }

  let html = fs.readFileSync(fullPath, "utf-8");
  const header = getCanonicalHeader(page.id, page.prefix);
  const footer = getCanonicalFooter(page.prefix);

  const headerRegex = /<header class="site-header"[\s\S]*?<\/header>/;
  const footerRegex = /<footer class="site-footer"[\s\S]*?<\/footer>/;

  if (headerRegex.test(html)) {
    html = html.replace(headerRegex, header);
  }
  if (footerRegex.test(html)) {
    html = html.replace(footerRegex, footer);
  }

  fs.writeFileSync(fullPath, html, "utf-8");
  updated++;
  console.log(`✓ Synchronized layout: ${page.path}`);
}

console.log(`Done! ${updated} pages synchronized with canonical design system layout.`);
