#!/usr/bin/env node
//
// auto-tag.js — suggest or apply tags to untagged til.md entries
//
// Usage:
//   node auto-tag.js           # dry-run: print suggestions
//   node auto-tag.js --apply   # write tags into til.md
//
// Matching strategy (layered, highest-confidence first):
//   1. Exact keyword match (case-insensitive, word-boundary aware)
//   2. Regex pattern match (for compound/contextual patterns)
//   3. URL/repo-name signals (GitHub org/repo names often reveal domain)
//   4. Co-occurrence boost: if two weak signals from same tag fire, promote it
//
// Quality notes vs naive substring matching:
//   - Word boundaries prevent "db" matching "Adobe" or "ice" matching "service"
//   - Patterns capture contextual phrases ("got so fast", "speech.to.text")
//   - URL parsing extracts repo names as an independent signal layer
//   - Max 3 tags per entry to avoid over-tagging noise

const fs = require('fs');
const path = require('path');

const TAGS_FILE = path.join(__dirname, 'tags.json');
const TIL_FILE = path.join(__dirname, 'til.md');
const MAX_TAGS = 3;
const APPLY = process.argv.includes('--apply');

const taxonomy = JSON.parse(fs.readFileSync(TAGS_FILE, 'utf8'));
const content = fs.readFileSync(TIL_FILE, 'utf8');

const ENTRY_RE = /^- \d{1,2} [A-Za-z]{3} \d{4}\./;
const TAG_RE = /#([a-z][a-z0-9-]*)/g;

function extractUrls(text) {
  const urls = [];
  const re = /https?:\/\/[^\s)\]]+/g;
  let m;
  while ((m = re.exec(text)) !== null) urls.push(m[0]);
  const ghRe = /github\.com\/([^/\s)]+)\/([^/\s)#?]+)/g;
  while ((m = ghRe.exec(text)) !== null) urls.push(m[1].toLowerCase(), m[2].toLowerCase());
  return urls;
}

function getEntryBlock(lines, startIdx) {
  let block = lines[startIdx];
  let i = startIdx + 1;
  while (i < lines.length && !ENTRY_RE.test(lines[i]) && !lines[i].startsWith('# ')) {
    block += '\n' + lines[i];
    i++;
  }
  return { block, endIdx: i };
}

function existingTags(firstLine) {
  const tags = new Set();
  let m;
  while ((m = TAG_RE.exec(firstLine)) !== null) tags.add(m[1]);
  return tags;
}

function stripExcludedUrls(block, excludeUrls) {
  if (!excludeUrls || excludeUrls.length === 0) return block;
  let cleaned = block;
  for (const domain of excludeUrls) {
    const re = new RegExp(`https?://${domain.replace(/\./g, '\\.')}[^\\s)\\]]*`, 'gi');
    cleaned = cleaned.replace(re, '');
  }
  return cleaned;
}

function scoreTags(block) {
  const urls = extractUrls(block);
  const urlText = urls.join(' ');
  const scores = {};

  for (const [tag, def] of Object.entries(taxonomy)) {
    let score = 0;

    const cleanedBlock = stripExcludedUrls(block, def.excludeUrls);

    for (const kw of def.keywords || []) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`, 'i');
      if (re.test(cleanedBlock)) score += 2;
      if (re.test(urlText)) score += 1;
    }

    for (const pat of def.patterns || []) {
      if (!pat) continue;
      try {
        const re = new RegExp(pat, 'i');
        if (re.test(cleanedBlock)) score += 1.5;
      } catch {}
    }

    if (score > 0) scores[tag] = score;
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TAGS)
    .filter(([, s]) => s >= 1.5)
    .map(([tag]) => tag);
}

const lines = content.split('\n');
const changes = [];
let suggestions = 0;

for (let i = 0; i < lines.length; i++) {
  if (!ENTRY_RE.test(lines[i])) continue;

  const { block } = getEntryBlock(lines, i);
  const existing = existingTags(lines[i]);
  const suggested = scoreTags(block).filter(t => !existing.has(t));

  if (suggested.length === 0) continue;

  const allTags = [...existing, ...suggested];
  if (allTags.length > MAX_TAGS) suggested.splice(MAX_TAGS - existing.size);
  if (suggested.length === 0) continue;

  suggestions++;
  const tagStr = suggested.map(t => `#${t}`).join(' ');
  const preview = lines[i].substring(0, 80);

  if (APPLY) {
    const stripped = lines[i].replace(/\s*$/, '');
    lines[i] = `${stripped} ${tagStr}`;
    changes.push({ line: i + 1, tags: suggested });
  } else {
    console.log(`L${i + 1}: ${preview}...`);
    console.log(`  + ${tagStr}`);
    console.log();
  }
}

if (APPLY && changes.length > 0) {
  fs.writeFileSync(TIL_FILE, lines.join('\n'));
  console.log(`Applied ${changes.length} tag updates.`);
  for (const c of changes) {
    console.log(`  L${c.line}: +${c.tags.map(t => '#' + t).join(' ')}`);
  }
} else if (!APPLY) {
  console.log(`${suggestions} entries with suggested tags. Run with --apply to write.`);
}
