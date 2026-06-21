# Review & Update Tag Taxonomy

Run this prompt every ~6 months to keep `tags.json` aligned with what you actually write about.

## When to run

- After accumulating 30+ new entries since last review
- When you notice entries getting tagged with wrong/irrelevant tags
- When a new topic area emerges that doesn't fit existing tags

## Prompt

Copy everything below the line into Claude (or any LLM). Attach `til.md` and `tags.json` as context.

---

You are a taxonomy curator for a personal TIL (Things I Learned) knowledge base.

**Input:**
- `til.md` — all dated entries, each ending with `#tag1 #tag2` etc.
- `tags.json` — current tag definitions with keywords and regex patterns

**Your job:** Analyze usage patterns and produce an updated `tags.json`. Follow these rules strictly.

### Analysis steps

1. **Tag frequency.** Count how many entries use each tag. Flag:
   - **Dead tags** (0-1 uses) — candidate for removal or merge
   - **Overloaded tags** (>25% of entries) — candidate for splitting

2. **Untagged or single-tagged entries.** List entries with 0 or 1 tags. Suggest tags or flag if no existing tag fits (signals a missing tag).

3. **Cluster analysis.** Look for recurring topics that don't have a tag yet. Evidence: 3+ entries sharing a keyword/theme that isn't captured by any current tag.

4. **Keyword audit.** For each tag, check:
   - Are there keywords that cause false positives? (keyword appears in entries that shouldn't have this tag)
   - Are there entries correctly tagged that don't match any keyword? (missing keyword)
   - Do any regex patterns over-match or under-match?

5. **Tag overlap.** Identify tag pairs that always co-occur (>80%). Consider merging them.

### Output format

Produce a structured report with these sections:

```
## Tag Health Report

### Remove or merge
- `#tag` → reason, suggested merge target

### Split
- `#tag` → suggested children, reason

### New tags to add
- `#tag` — description, evidence (list 3+ entries that need it)

### Keyword changes
- `#tag`: add keywords [...], remove keywords [...], add patterns [...], reason

### Updated tags.json
(full updated JSON)
```

### Constraints

- Keep total tags between 15-25. Fewer is better.
- Every tag must have ≥3 entries using it. No aspirational tags.
- Prefer merging over splitting. Split only when a tag covers genuinely unrelated topics.
- Don't create tags for technologies you used once — those belong as keywords under a broader tag.
- Preserve the `excludeUrls` mechanism for citation links that cause false positives.
- Keywords must be word-boundary safe (no partial matches like "db" matching "Adobe").
- Test each keyword mentally: "Would this word appear in an entry that should NOT have this tag?" If yes, make it a pattern with context instead.

### Reference: tag format in tags.json

```json
{
  "tag-name": {
    "description": "One line explaining the scope",
    "keywords": ["exact", "word", "matches"],
    "excludeUrls": ["domain.com"],
    "patterns": ["regex patterns for contextual matches"]
  }
}
```
