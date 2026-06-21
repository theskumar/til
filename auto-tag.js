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
//   4. Semantic similarity via local embeddings (when llama.cpp embed server is up)
//   5. Co-occurrence boost: if two weak signals from same tag fire, promote it

const fs = require('fs');
const path = require('path');

const TAGS_FILE = path.join(__dirname, 'tags.json');
const TIL_FILE = path.join(__dirname, 'til.md');
const EMBED_CACHE_FILE = path.join(__dirname, 'tag-embeddings.json');
const MAX_TAGS = 3;
const APPLY = process.argv.includes('--apply');
const EMBED_URL = 'http://127.0.0.1:8083/v1/embeddings';
const EMBED_SIMILARITY_THRESHOLD = 0.35;
const EMBED_SCORE_WEIGHT = 2.0;

const taxonomy = JSON.parse(fs.readFileSync(TAGS_FILE, 'utf8'));
const content = fs.readFileSync(TIL_FILE, 'utf8');

const ENTRY_RE = /^- \d{1,2} [A-Za-z]{3} \d{4}\./;
const TAG_RE = /#([a-z][a-z0-9-]*)/g;

// --- Embedding helpers ---

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbeddings(texts) {
  const resp = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: texts }),
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) throw new Error(`embed ${resp.status}`);
  const data = await resp.json();
  return data.data.map(d => d.embedding);
}

async function isEmbedServerUp() {
  try {
    const resp = await fetch('http://127.0.0.1:8083/v1/models', {
      signal: AbortSignal.timeout(2000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

function buildTagTexts() {
  const texts = {};
  for (const [tag, def] of Object.entries(taxonomy)) {
    const keywords = (def.keywords || []).join(', ');
    texts[tag] = `${tag}: ${def.description}. Keywords: ${keywords}`;
  }
  return texts;
}

async function loadOrComputeTagEmbeddings() {
  const tagTexts = buildTagTexts();
  const tags = Object.keys(tagTexts);
  const currentHash = JSON.stringify(tagTexts);

  if (fs.existsSync(EMBED_CACHE_FILE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(EMBED_CACHE_FILE, 'utf8'));
      if (cache.hash === currentHash && cache.embeddings) {
        return cache.embeddings;
      }
    } catch {}
  }

  const texts = tags.map(t => tagTexts[t]);
  const vectors = await getEmbeddings(texts);
  const embeddings = {};
  tags.forEach((t, i) => { embeddings[t] = vectors[i]; });

  fs.writeFileSync(EMBED_CACHE_FILE, JSON.stringify({ hash: currentHash, embeddings }, null, 2));
  return embeddings;
}

async function scoreEmbedding(block, tagEmbeddings) {
  const blockText = block.replace(/https?:\/\/[^\s)\]]+/g, '').substring(0, 512);
  if (blockText.trim().length < 40) return {};
  const [blockVec] = await getEmbeddings([blockText]);
  const scores = {};
  for (const [tag, tagVec] of Object.entries(tagEmbeddings)) {
    const sim = cosineSimilarity(blockVec, tagVec);
    if (sim >= EMBED_SIMILARITY_THRESHOLD) {
      scores[tag] = sim * EMBED_SCORE_WEIGHT;
    }
  }
  return scores;
}

// --- Keyword/regex helpers ---

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

function scoreKeywords(block) {
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

  return scores;
}

function mergeScores(keywordScores, embedScores) {
  const merged = { ...keywordScores };
  for (const [tag, score] of Object.entries(embedScores)) {
    merged[tag] = (merged[tag] || 0) + score;
  }
  return merged;
}

function topTags(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TAGS)
    .filter(([, s]) => s >= 1.5)
    .map(([tag]) => tag);
}

// --- Main ---

async function main() {
  const useEmbeddings = await isEmbedServerUp();
  let tagEmbeddings = null;

  if (useEmbeddings) {
    console.log('Embedding server detected — using semantic matching.\n');
    tagEmbeddings = await loadOrComputeTagEmbeddings();
  } else {
    console.log('Embedding server not available — keyword-only mode.\n');
  }

  const lines = content.split('\n');
  const changes = [];
  let suggestions = 0;

  for (let i = 0; i < lines.length; i++) {
    if (!ENTRY_RE.test(lines[i])) continue;

    const { block } = getEntryBlock(lines, i);
    const existing = existingTags(lines[i]);
    const kwScores = scoreKeywords(block);

    let embedScores = {};
    if (useEmbeddings && tagEmbeddings) {
      try {
        embedScores = await scoreEmbedding(block, tagEmbeddings);
      } catch {}
    }

    const finalScores = mergeScores(kwScores, embedScores);
    const suggested = topTags(finalScores).filter(t => !existing.has(t));

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
      if (useEmbeddings) {
        const embTags = Object.keys(embedScores);
        if (embTags.length > 0) {
          const embHits = suggested.filter(t => embTags.includes(t));
          if (embHits.length > 0) console.log(`  (embed boost: ${embHits.map(t => '#' + t).join(' ')})`);
        }
      }
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
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
