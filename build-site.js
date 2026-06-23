const fs = require("fs").promises;
const path = require("path");
const { marked } = require("marked");

const SITE_DIR = "_site";
const BASE_URL = "/til";
const SITE_TITLE = "TIL — Saurabh Kumar";
const MAIN_SITE = "https://saurabh-kumar.com";

const SOURCE_FILES = ["til.md"];
const IGNORE_DIRS = ["node_modules", ".git", ".github", "_site", "docs", ".pi"];

// ---------------------------------------------------------------------------
// Note parsing (mirrors extract-weekly.js)
// ---------------------------------------------------------------------------

function extractNotes(markdown) {
  const notes = [];
  let current = null;
  for (const line of markdown.split("\n")) {
    const m = line.match(
      /^- (?<day>\d{1,2}) (?<month>[A-Za-z]{3}) (?<year>\d{4})\.?\s*(?<text>.*)/,
    );
    if (m) {
      if (current) notes.push(current);
      const { day, month, year, text } = m.groups;
      current = {
        date: new Date(`${month} ${day}, ${year}`),
        lines: [text],
        tags: [],
      };
    } else if (current && line.startsWith("  ")) {
      current.lines.push(line.slice(2));
    } else {
      if (current) notes.push(current);
      current = null;
    }
  }
  if (current) notes.push(current);
  for (const note of notes) {
    const text = note.lines.join(" ");
    const tagMatches = text.match(/#([a-zA-Z][a-zA-Z0-9_-]*)/g);
    note.tags = tagMatches
      ? [...new Set(tagMatches.map((t) => t.slice(1).toLowerCase()))]
      : [];
  }
  return notes;
}

function getWeekEnd(date) {
  const d = new Date(date);
  d.setUTCHours(12, 0, 0, 0);
  const days = (7 - d.getUTCDay()) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function groupByWeek(notes) {
  const weeks = new Map();
  for (const note of notes) {
    const key = getWeekEnd(note.date);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key).push(note);
  }
  return new Map([...weeks].sort((a, b) => b[0].localeCompare(a[0])));
}

function formatDate(d) {
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatWeekTitle(weekEnd) {
  const d = new Date(weekEnd + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ---------------------------------------------------------------------------
// Article discovery
// ---------------------------------------------------------------------------

async function discoverArticles() {
  const articles = [];
  const entries = await fs.readdir(".", { withFileTypes: true });
  for (const entry of entries) {
    if (
      !entry.isDirectory() ||
      IGNORE_DIRS.includes(entry.name) ||
      entry.name === "weekly"
    )
      continue;
    const files = await fs.readdir(entry.name);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const filepath = path.join(entry.name, file);
      const content = await fs.readFile(filepath, "utf-8");
      const titleMatch = content.match(/^# (.+)$/m);
      const title = titleMatch ? titleMatch[1] : file.replace(".md", "");
      articles.push({
        category: entry.name,
        slug: file.replace(".md", ""),
        filepath,
        title,
        content,
      });
    }
  }
  return articles.sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.title.localeCompare(b.title),
  );
}

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

function layout(title, body, { activeNav = "", canonical = "" } = {}) {
  const nav = [
    ["Home", `${BASE_URL}/`],
    ["Articles", `${BASE_URL}/articles/`],
    ["Weekly", `${BASE_URL}/weekly/`],
  ];

  const navHTML = nav
    .map(([label, href]) => {
      const cls = activeNav === label ? ' class="active"' : "";
      return `<a href="${href}"${cls}>${label}</a>`;
    })
    .join("\n      ");

  const canonicalTag = canonical
    ? `<link rel="canonical" href="${MAIN_SITE}${canonical}" />`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)} | ${SITE_TITLE}</title>
  ${canonicalTag}
  <link rel="alternate" type="application/rss+xml" href="${BASE_URL}/rss.xml" title="${SITE_TITLE}" />
  <meta name="theme-color" content="#FBFBFA">
  <script>
    (function () {
      var el = document.documentElement;
      el.classList.add('js');
      var stored = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = (stored === 'dark' || stored === 'light') ? stored : (prefersDark ? 'dark' : 'light');
      el.setAttribute('data-theme', theme);
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', theme === 'dark' ? '#1A1917' : '#FBFBFA');
    })();
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
  <header>
    <div class="header-wrap">
      <div class="title">
        <a href="${BASE_URL}/" class="brand">TIL</a>
        <a href="${MAIN_SITE}" class="brand-sub">Saurabh Kumar</a>
      </div>
      <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">
        <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </div>
    <nav class="site-nav">
      ${navHTML}

    </nav>
  </header>
  <main>
    ${body}
  </main>
  <footer class="site-footer">
    <span>&copy; ${new Date().getFullYear()} Saurabh Kumar</span>
    <span>
      <a href="${BASE_URL}/rss.xml">RSS</a>
      &nbsp;&middot;&nbsp;
      <a href="https://github.com/theskumar/til">Source</a>
      &nbsp;&middot;&nbsp;
      <a href="${MAIN_SITE}">Main site</a>
    </span>
  </footer>
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      var el = document.documentElement;
      var btn = document.getElementById('theme-toggle');
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var timer;
      btn.addEventListener('click', function () {
        var next = el.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        if (!reduce) {
          el.classList.add('theme-anim');
          clearTimeout(timer);
          timer = window.setTimeout(function () { el.classList.remove('theme-anim'); }, 500);
        }
        el.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        var m = document.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute('content', next === 'dark' ? '#1A1917' : '#FBFBFA');
      });
    });
  </script>
</body>
</html>`;
}

function escapeHTML(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// CSS — pulled from saurabh-kumar.com, adapted for TIL
// ---------------------------------------------------------------------------

const CSS = `
:root {
  color-scheme: light dark;
  --width: 720px;
  --font-serif: 'Newsreader', 'Lyon Text', Georgia, 'Times New Roman', serif;
  --font-sans: 'Geist', 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-mono: 'Geist Mono', 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;
  --font-scale: 1.0625rem;

  --bg:            light-dark(#FBFBFA, #1A1917);
  --bg-tint:       light-dark(#F7F6F3, #211F1D);
  --surface:       light-dark(#FFFFFF, #221F1C);
  --surface-2:     light-dark(#F9F9F8, #262320);
  --border:        light-dark(#EAEAEA, rgba(255,255,255,0.09));
  --border-strong: light-dark(#E2E1DD, rgba(255,255,255,0.16));
  --heading:       light-dark(#1A1A1A, #F3F1EC);
  --text:          light-dark(#2F3437, #CFCDC7);
  --muted:         light-dark(#787774, #918E87);
  --faint:         light-dark(#9B9A96, #6F6C66);
  --accent:        light-dark(#9A3B2E, #E0876A);
  --code-bg:       light-dark(#F4F3F1, #242220);
  --code-color:    light-dark(#1A1A1A, #E7E4DE);
  --tag-bg:        light-dark(#F2F1EE, #2A2724);
  --tag-text:      light-dark(#5C5A55, #BEBAB2);
}

[data-theme="light"] { color-scheme: light; }
[data-theme="dark"]  { color-scheme: dark; }

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; background-color: var(--bg); }

body {
  font-family: var(--font-sans);
  font-size: var(--font-scale);
  font-weight: 400;
  margin: 0 auto;
  padding: 28px 24px 0;
  max-width: var(--width);
  color: var(--text);
  line-height: 1.65;
  letter-spacing: -0.006em;
  word-wrap: break-word;
  overflow-wrap: break-word;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

body::before {
  content: "";
  position: fixed;
  inset: -20%;
  z-index: -2;
  pointer-events: none;
  background: radial-gradient(50% 42% at 50% 0%, light-dark(rgba(154,59,46,0.05), rgba(224,135,106,0.06)), transparent 70%);
  animation: fx-drift 36s ease-in-out infinite alternate;
  will-change: transform;
}
@keyframes fx-drift {
  0%   { transform: translate3d(-3%, -2%, 0); }
  100% { transform: translate3d(4%, 4%, 0); }
}

body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}
html[data-theme="dark"] body::after { opacity: 0.016; }

h1, h2, h3, h4, h5, h6 {
  color: var(--heading);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
h1 { font-size: 1.9rem; margin: 0 0 0.5em; }
h2 { font-size: 1.4rem; margin: 2.2em 0 0.6em; }
h3 { font-size: 1.15rem; margin: 1.8em 0 0.5em; }

p { margin: 0 0 1.15em; }

a {
  color: var(--heading);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: var(--border-strong);
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  transition: color 0.18s ease, text-decoration-color 0.18s ease;
}
a:hover {
  color: var(--accent);
  text-decoration-color: var(--accent);
}

strong, b { color: var(--heading); font-weight: 600; }

time {
  font-family: var(--font-mono);
  font-style: normal;
  font-size: 0.82rem;
  letter-spacing: 0;
  color: var(--muted);
}

hr { border: 0; border-top: 1px solid var(--border); margin: 2.4em 0; }

img { max-width: 100%; height: auto; border-radius: 6px; }

p code, li code, td code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  padding: 0.12em 0.38em;
  background-color: var(--code-bg);
  color: var(--code-color);
  border-radius: 4px;
  border: 1px solid var(--border);
}

pre {
  border: 1px solid var(--border);
  border-radius: 8px;
  margin: 1.5em 0;
  overflow-x: auto;
  max-width: 100%;
  padding: 16px 18px;
  font-size: 0.86rem;
  line-height: 1.55;
  font-family: var(--font-mono);
  background-color: var(--code-bg);
  color: var(--code-color);
}
pre code {
  padding: 0;
  background: none;
  border: none;
  font-size: inherit;
}

blockquote {
  border-left: 2px solid var(--accent);
  color: var(--muted);
  padding: 0.2em 0 0.2em 1.2em;
  font-family: var(--font-serif);
  font-size: 1.18em;
  font-style: italic;
  line-height: 1.5;
  margin: 1.6em 0;
}
blockquote > :first-child { margin-top: 0; }
blockquote > :last-child  { margin-bottom: 0; }

table { width: 100%; border-collapse: collapse; font-size: 0.95em; margin: 1.4em 0; }
th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); }
th { color: var(--heading); font-weight: 600; }

/* Header */
header { margin-bottom: 2.5rem; }
.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.title { display: flex; align-items: baseline; gap: 8px; }
.title .brand {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 500;
  color: var(--heading);
  letter-spacing: -0.02em;
  line-height: 1;
  text-decoration: none;
}
.title .brand:hover { color: var(--accent); }
.title .brand-sub {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--muted);
  letter-spacing: 0;
  text-decoration: none;
}
.title .brand-sub:hover { color: var(--heading); }

nav.site-nav {
  display: flex;
  gap: 20px;
  margin-top: 0.9rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
  align-items: center;
}
nav.site-nav a {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted);
  text-decoration: none;
  font-weight: 500;
}
nav.site-nav a:hover { color: var(--heading); }
nav.site-nav a.active { color: var(--heading); }


.theme-toggle {
  position: relative;
  width: 32px;
  height: 32px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.18s ease, border-color 0.18s ease;
}
.theme-toggle:hover { color: var(--heading); border-color: var(--border-strong); }
.theme-toggle svg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 17px;
  height: 17px;
  transition: opacity 0.3s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.theme-toggle .sun-icon  { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(1); }
.theme-toggle .moon-icon { opacity: 0; transform: translate(-50%, -50%) rotate(-90deg) scale(0.5); }
[data-theme="dark"] .theme-toggle .sun-icon  { opacity: 0; transform: translate(-50%, -50%) rotate(90deg) scale(0.5); }
[data-theme="dark"] .theme-toggle .moon-icon { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(1); }

html.theme-anim,
html.theme-anim *,
html.theme-anim *::before,
html.theme-anim *::after {
  transition: background-color 0.45s ease, color 0.45s ease,
              border-color 0.45s ease, text-decoration-color 0.45s ease !important;
}

/* Page head */
.page-head { padding: 1rem 0 1.6rem; }
.page-head h1 {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(2rem, 4.5vw, 2.6rem);
  letter-spacing: -0.025em;
  margin: 0 0 0.4rem;
}
.page-head .sub { color: var(--muted); margin: 0; font-size: 1.02rem; }

/* Article page */
.article-header { margin-bottom: 2.2rem; }
.article-header .eyebrow {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--accent);
  margin-bottom: 0.8rem;
}
.article-header h1 {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(2rem, 4.8vw, 2.8rem);
  line-height: 1.12;
  letter-spacing: -0.025em;
  margin: 0 0 0.7rem;
}
.article-content h2 { font-family: var(--font-sans); }
.article-content ul, .article-content ol { padding-left: 1.3em; }
.article-content li { margin: 0.3em 0; }
.article-content li::marker { color: var(--faint); }

/* Week list */
.week-list { list-style: none; margin: 0; padding: 0; }
.week-list li {
  padding: 1rem 0;
  border-top: 1px solid var(--border);
}
.week-list li:first-child { border-top: 0; }
.week-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}
.week-link {
  text-decoration: none;
  color: var(--heading);
  font-size: 1rem;
}
.week-link:hover { color: var(--accent); }
.week-list .week-title { font-weight: 450; }
.week-list .week-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.week-list .week-count {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--muted);
  flex-shrink: 0;
  text-decoration: none;
}
.week-list .week-count:hover { color: var(--heading); }
.week-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  background: var(--tag-bg);
  color: var(--tag-text);
  padding: 1px 7px;
  border-radius: 3px;
  letter-spacing: 0.02em;
  text-decoration: none;
}
a.tag:hover {
  background: var(--border-strong);
  color: var(--heading);
}

/* Tag index */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 1.5rem 0;
}
.tag-cloud .tag {
  font-size: 0.82rem;
  padding: 4px 12px;
}
.tag-count {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--faint);
  margin-left: 4px;
}
.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 0.5rem;
}

/* Article list */
.article-list { list-style: none; margin: 0; padding: 0; }
.article-list li {
  padding: 0.7rem 0;
  border-top: 1px solid var(--border);
}
.article-list li:first-child { border-top: 0; }
.article-list a {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 14px;
  text-decoration: none;
  color: var(--heading);
  font-size: 0.96rem;
}
.article-list a:hover { color: var(--accent); }
.article-list .article-title { font-weight: 450; }
.article-list .article-category {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--faint);
  flex-shrink: 0;
}

/* Notes in weekly pages */
.notes-list { list-style: none; margin: 0; padding: 0; }
.notes-list > li {
  padding: 1rem 0;
  border-top: 1px solid var(--border);
  line-height: 1.7;
}
.notes-list > li:first-child { border-top: 0; }
.note-date {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: block;
  margin-bottom: 0.35rem;
}

/* Week nav */
.week-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 1.4rem;
  border-top: 1px solid var(--border);
  font-size: 0.92rem;
}
.week-nav a { color: var(--muted); }
.week-nav a:hover { color: var(--heading); }

/* Home sections */
.home-section { margin-bottom: 3rem; }
.home-section h2 {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--faint);
  margin: 0 0 1rem;
  font-weight: 500;
}
.view-all {
  font-size: 0.85rem;
  color: var(--muted);
  display: inline-block;
  margin-top: 0.8rem;
}

/* Footer */
footer.site-footer {
  margin: 5rem 0 0;
  padding: 2rem 0 2.5rem;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.88rem;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
footer.site-footer a { color: var(--muted); }
footer.site-footer a:hover { color: var(--accent); }

@media (max-width: 720px) {
  body { padding: 22px 18px 0; }
  footer.site-footer { flex-direction: column; align-items: center; text-align: center; }
  nav.site-nav { flex-wrap: wrap; gap: 14px; }
  .week-row {
    flex-wrap: wrap;
  }
  .week-link {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .week-list .week-meta {
    width: 100%;
    justify-content: flex-start;
    margin-top: 4px;
  }
  .week-list .week-count { margin-left: auto; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  body::before { animation: none; }
  .theme-toggle svg { transition: opacity 0.01ms; }
  html.theme-anim, html.theme-anim *,
  html.theme-anim *::before, html.theme-anim *::after { transition: none !important; }
}
`;

// ---------------------------------------------------------------------------
// Page generators
// ---------------------------------------------------------------------------

function stripTags(text) {
  return text.replace(/\s*#[a-zA-Z][a-zA-Z0-9_-]*/g, "").trim();
}

function renderNoteHTML(note) {
  const md = note.lines.map(stripTags).join("\n");
  return marked.parse(md);
}

function pluralizeNotes(n) {
  return `${n} note${n !== 1 ? "s" : ""}`;
}

function renderNoteTags(note, excludeTag) {
  const tags = excludeTag
    ? note.tags.filter((t) => t !== excludeTag)
    : note.tags;
  if (!tags.length) return "";
  return `<div class="note-tags">${tags.map((t) => `<a href="${BASE_URL}/tags/${t}.html" class="tag">${escapeHTML(t)}</a>`).join("")}</div>`;
}

function renderWeekRow(weekEnd, notes) {
  const title = formatWeekTitle(weekEnd);
  const weekTags = [...new Set(notes.flatMap((n) => n.tags))].sort();
  const tagsHTML = weekTags.length
    ? `<span class="week-tags">${weekTags.map((t) => `<a href="${BASE_URL}/tags/${t}.html" class="tag" onclick="event.stopPropagation()">${escapeHTML(t)}</a>`).join("")}</span>`
    : "";
  return `<li><div class="week-row"><a href="${BASE_URL}/weekly/${weekEnd}.html" class="week-link"><span class="week-title">${title}</span></a><span class="week-meta">${tagsHTML}<a href="${BASE_URL}/weekly/${weekEnd}.html" class="week-count">${pluralizeNotes(notes.length)}</a></span></div></li>`;
}

function renderTagCloudItems(tagMap) {
  return [...tagMap.entries()].map(
    ([tag, notes]) =>
      `<a href="${BASE_URL}/tags/${tag}.html" class="tag">${escapeHTML(tag)}<span class="tag-count">${notes.length}</span></a>`,
  );
}

function renderNotesListItems(notes, excludeTag) {
  return [...notes]
    .sort((a, b) => b.date - a.date)
    .map((note) => {
      const dateStr = formatDate(note.date);
      const html = renderNoteHTML(note);
      const tags = renderNoteTags(note, excludeTag);
      return `<li><span class="note-date">${dateStr}</span>${html}${tags}</li>`;
    })
    .join("\n");
}

function buildHomePage(weeks, articles, tagMap) {
  const weekListHTML = [...weeks.entries()]
    .slice(0, 8)
    .map(([weekEnd, notes]) => renderWeekRow(weekEnd, notes))
    .join("\n");

  const articleListHTML = articles
    .map(
      (a) =>
        `<li><a href="${BASE_URL}/${a.category}/${a.slug}.html"><span class="article-title">${escapeHTML(a.title)}</span><span class="article-category">${a.category}</span></a></li>`,
    )
    .join("\n");

  const body = `
<div class="page-head">
  <h1>Things I Learned</h1>
  <p class="sub">A collection of useful things I've learned. Quick notes and deeper write-ups.</p>
</div>

<section class="home-section">
  <h2>Recent Weeks</h2>
  <ul class="week-list">
    ${weekListHTML}
  </ul>
  <a class="view-all" href="${BASE_URL}/weekly/">All weeks &rarr;</a>
</section>

${
  articles.length
    ? `<section class="home-section">
  <h2>Articles</h2>
  <ul class="article-list">
    ${articleListHTML}
  </ul>
  <a class="view-all" href="${BASE_URL}/articles/">All articles &rarr;</a>
</section>`
    : ""
}

${
  tagMap && tagMap.size
    ? `<section class="home-section">
  <h2>Tags</h2>
  <div class="tag-cloud">
    ${renderTagCloudItems(tagMap).join("\n    ")}
  </div>
</section>`
    : ""
}`;

  return layout("Home", body, { activeNav: "Home", canonical: `${BASE_URL}/` });
}

function buildWeeklyIndexPage(weeks) {
  const listHTML = [...weeks.entries()]
    .map(([weekEnd, notes]) => renderWeekRow(weekEnd, notes))
    .join("\n");

  const body = `
<div class="page-head">
  <h1>Weekly Notes</h1>
  <p class="sub">Notes grouped by the week I learned them.</p>
</div>
<ul class="week-list">
  ${listHTML}
</ul>`;

  return layout("Weekly Notes", body, {
    activeNav: "Weekly",
    canonical: `${BASE_URL}/weekly/`,
  });
}

function buildWeekPage(weekEnd, notes, prevWeek, nextWeek) {
  const title = formatWeekTitle(weekEnd);
  const notesHTML = renderNotesListItems(notes);

  const prevLink = prevWeek
    ? `<a href="${BASE_URL}/weekly/${prevWeek}.html">&larr; Previous week</a>`
    : "<span></span>";
  const nextLink = nextWeek
    ? `<a href="${BASE_URL}/weekly/${nextWeek}.html">Next week &rarr;</a>`
    : "<span></span>";

  const body = `
<div class="page-head">
  <h1>${title}</h1>
  <p class="sub">${pluralizeNotes(notes.length)} this week</p>
</div>
<ul class="notes-list">
  ${notesHTML}
</ul>
<nav class="week-nav">
  ${prevLink}
  ${nextLink}
</nav>`;

  return layout(title, body, {
    activeNav: "Weekly",
    canonical: `${BASE_URL}/weekly/${weekEnd}.html`,
  });
}

function buildArticlesIndexPage(articles) {
  const grouped = new Map();
  for (const a of articles) {
    if (!grouped.has(a.category)) grouped.set(a.category, []);
    grouped.get(a.category).push(a);
  }

  let sectionsHTML = "";
  for (const [category, items] of grouped) {
    const listHTML = items
      .map(
        (a) =>
          `<li><a href="${BASE_URL}/${a.category}/${a.slug}.html"><span class="article-title">${escapeHTML(a.title)}</span></a></li>`,
      )
      .join("\n");
    sectionsHTML += `
<h2 style="font-family: var(--font-sans); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--faint); font-weight: 500; margin: 2rem 0 1rem;">${category}</h2>
<ul class="article-list">
  ${listHTML}
</ul>`;
  }

  const body = `
<div class="page-head">
  <h1>Articles</h1>
  <p class="sub">Longer write-ups on specific topics.</p>
</div>
${sectionsHTML}`;

  return layout("Articles", body, {
    activeNav: "Articles",
    canonical: `${BASE_URL}/articles/`,
  });
}

function buildArticlePage(article) {
  const contentWithoutTitle = article.content.replace(/^# .+\n/, "");
  const html = marked.parse(contentWithoutTitle);

  const body = `
<article>
  <header class="article-header">
    <div class="eyebrow">${article.category}</div>
    <h1>${escapeHTML(article.title)}</h1>
  </header>
  <div class="article-content">
    ${html}
  </div>
</article>`;

  return layout(article.title, body, {
    activeNav: "Articles",
    canonical: `${BASE_URL}/${article.category}/${article.slug}.html`,
  });
}

// ---------------------------------------------------------------------------
// Tag pages
// ---------------------------------------------------------------------------

function groupByTag(notes) {
  const tags = new Map();
  for (const note of notes) {
    for (const tag of note.tags) {
      if (!tags.has(tag)) tags.set(tag, []);
      tags.get(tag).push(note);
    }
  }
  return new Map([...tags].sort((a, b) => a[0].localeCompare(b[0])));
}

function buildTagsIndexPage(tagMap) {
  const tagsHTML = renderTagCloudItems(tagMap).join("\n");

  const body = `
<div class="page-head">
  <h1>Tags</h1>
  <p class="sub">${tagMap.size} tags across all notes.</p>
</div>
<div class="tag-cloud">
  ${tagsHTML}
</div>`;

  return layout("Tags", body, {
    activeNav: "Tags",
    canonical: `${BASE_URL}/tags/`,
  });
}

function buildTagPage(tag, notes) {
  const notesHTML = renderNotesListItems(notes, tag);

  const body = `
<div class="page-head">
  <h1>#${escapeHTML(tag)}</h1>
  <p class="sub">${pluralizeNotes(notes.length)}</p>
</div>
<ul class="notes-list">
  ${notesHTML}
</ul>
<a class="view-all" href="${BASE_URL}/tags/">&larr; All tags</a>`;

  return layout(`#${tag}`, body, {
    activeNav: "Tags",
    canonical: `${BASE_URL}/tags/${tag}.html`,
  });
}

// ---------------------------------------------------------------------------
// RSS
// ---------------------------------------------------------------------------

function buildRSS(weeks, articles) {
  const items = [];

  for (const [weekEnd, notes] of [...weeks.entries()].slice(0, 5)) {
    const title = `Week of ${formatWeekTitle(weekEnd)}`;
    const link = `${MAIN_SITE}${BASE_URL}/weekly/${weekEnd}.html`;
    const sortedNotes = [...notes].sort((a, b) => b.date - a.date);
    const content = sortedNotes
      .map((n) => `<li>${escapeHTML(n.lines.join(" "))}</li>`)
      .join("");
    const date = new Date(weekEnd + "T00:00:00Z");
    items.push({ title, link, content: `<ul>${content}</ul>`, date });
  }

  for (const a of articles) {
    const contentWithoutTitle = a.content.replace(/^# .+\n/, "");
    const html = marked.parse(contentWithoutTitle);
    items.push({
      title: `TIL: ${a.title}`,
      link: `${MAIN_SITE}${BASE_URL}/${a.category}/${a.slug}.html`,
      content: html,
      date: new Date(),
    });
  }

  items.sort((a, b) => b.date - a.date);

  const rssItems = items
    .slice(0, 15)
    .map(
      (item) => `<item>
  <guid>${escapeHTML(item.link)}</guid>
  <link>${escapeHTML(item.link)}</link>
  <title>${escapeHTML(item.title)}</title>
  <pubDate>${item.date.toUTCString()}</pubDate>
  <content:encoded>${escapeHTML(item.content)}</content:encoded>
</item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>TIL — Saurabh Kumar</title>
  <description>A collection of useful things I've learned.</description>
  <link>${MAIN_SITE}${BASE_URL}/</link>
${rssItems}
</channel>
</rss>`;
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

async function build() {
  console.log("Building TIL site...");

  // Parse notes
  let allNotes = [];
  for (const file of SOURCE_FILES) {
    const content = await fs.readFile(file, "utf-8");
    allNotes = allNotes.concat(extractNotes(content));
  }
  console.log(`  ${allNotes.length} notes parsed`);

  const weeks = groupByWeek(allNotes);
  console.log(`  ${weeks.size} weeks`);

  // Discover articles
  const articles = await discoverArticles();
  console.log(`  ${articles.length} articles`);

  // Clean and create output dir
  await fs.rm(SITE_DIR, { recursive: true, force: true });
  await fs.mkdir(SITE_DIR, { recursive: true });
  await fs.mkdir(path.join(SITE_DIR, "weekly"), { recursive: true });
  await fs.mkdir(path.join(SITE_DIR, "articles"), { recursive: true });

  // Tag map
  const tagMap = groupByTag(allNotes);

  // Home page
  await fs.writeFile(
    path.join(SITE_DIR, "index.html"),
    buildHomePage(weeks, articles, tagMap),
  );

  // Weekly index
  await fs.writeFile(
    path.join(SITE_DIR, "weekly", "index.html"),
    buildWeeklyIndexPage(weeks),
  );

  // Weekly pages
  const weekKeys = [...weeks.keys()];
  for (let i = 0; i < weekKeys.length; i++) {
    const weekEnd = weekKeys[i];
    const prev = weekKeys[i + 1] || null;
    const next = weekKeys[i - 1] || null;
    const html = buildWeekPage(weekEnd, weeks.get(weekEnd), prev, next);
    await fs.writeFile(path.join(SITE_DIR, "weekly", `${weekEnd}.html`), html);
  }

  // Article pages
  for (const article of articles) {
    const dir = path.join(SITE_DIR, article.category);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${article.slug}.html`),
      buildArticlePage(article),
    );
  }

  // Articles index
  await fs.writeFile(
    path.join(SITE_DIR, "articles", "index.html"),
    buildArticlesIndexPage(articles),
  );

  // Tag pages
  await fs.mkdir(path.join(SITE_DIR, "tags"), { recursive: true });
  await fs.writeFile(
    path.join(SITE_DIR, "tags", "index.html"),
    buildTagsIndexPage(tagMap),
  );
  for (const [tag, tagNotes] of tagMap) {
    await fs.writeFile(
      path.join(SITE_DIR, "tags", `${tag}.html`),
      buildTagPage(tag, tagNotes),
    );
  }
  console.log(`  ${tagMap.size} tags`);

  // RSS
  await fs.writeFile(path.join(SITE_DIR, "rss.xml"), buildRSS(weeks, articles));

  // .nojekyll (GitHub Pages)
  await fs.writeFile(path.join(SITE_DIR, ".nojekyll"), "");

  console.log(`\nDone! Output in ${SITE_DIR}/`);
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
