# BM25 Ranking in PostgreSQL with pg_textsearch

Today I learned about **pg_textsearch**, a new PostgreSQL extension by Timescale that brings BM25 relevance-ranked full-text search to Postgres.

## What is BM25?

BM25 (Best Matching 25) is the industry-standard ranking algorithm used by search engines like Elasticsearch and Lucene. Unlike simple term frequency counting, BM25 provides smarter relevance scoring through:

- **Term Frequency Saturation**: Mentioning a word 10 times isn't 10x better than once—diminishing returns kick in
- **Inverse Document Frequency (IDF)**: Rare terms get higher weight than common ones
- **Document Length Normalization**: Short and long documents are compared fairly

The formula uses two tunable parameters:
- `k1` (default 1.2): Controls term frequency saturation
- `b` (default 0.75): Controls length normalization (0 = none, 1 = full)

## Basic Usage

```sql
-- Create a BM25 index
CREATE INDEX docs_idx ON documents USING bm25(content) 
  WITH (text_config='english');

-- Search with the <@> operator (returns negative scores—lower is better)
SELECT title, content <@> 'database search' as score
FROM documents
ORDER BY content <@> 'database search'
LIMIT 10;
```

## pg_textsearch vs PostgreSQL Built-in FTS

| Aspect | PostgreSQL FTS | pg_textsearch (BM25) |
|--------|---------------|----------------------|
| **Ranking** | Basic term frequency | Probabilistic with IDF |
| **Operator** | `@@` with `tsquery` | `<@>` |
| **Boolean queries** | Rich (`&`, `\|`, `!`, `<->`) | Simple (implicit AND) |
| **Phrase search** | Yes | No |
| **Highlighting** | `ts_headline()` | No |
| **Relevance quality** | Basic | Industry-standard |
| **Maturity** | Battle-tested | Prerelease (v0.1.x) |

## When to Use Each

**Use PostgreSQL FTS when you need:**
- Complex boolean queries (`(postgresql | mysql) & !oracle`)
- Phrase search (`'full text search'`)
- Highlighting/snippets
- Prefix matching (`data:*`)

**Use pg_textsearch when you need:**
- High-quality relevance ranking (like Google/Elasticsearch)
- Simple search box UX (type words, get ranked results)
- Fair comparison across varying document lengths
- Proper rare-term weighting

## Hybrid Approach

You can combine both—use FTS for filtering and BM25 for ranking:

```sql
SELECT title, body <@> 'database performance' as score
FROM articles
WHERE body_tsv @@ to_tsquery('english', 'database & !mysql')  -- FTS filter
ORDER BY body <@> 'database performance'  -- BM25 ranking
LIMIT 10;
```

## Key Takeaways

1. BM25 is what makes modern search engines feel "smart"—it's not just counting words
2. pg_textsearch brings this to Postgres without needing Elasticsearch
3. The `<@>` operator returns negative scores (more negative = more relevant)
4. For production search, consider the hybrid approach: FTS for filtering, BM25 for ranking
5. The extension is still prerelease—not yet recommended for production

## Resources

- [pg_textsearch on GitHub](https://github.com/timescale/pg_textsearch)
- [PostgreSQL Full Text Search Docs](https://www.postgresql.org/docs/current/textsearch.html)
