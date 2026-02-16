# Categorizing TIL Notes with Embeddings

This document explains the approach used in this repository to automatically group `til.md` notes into meaningful categories.

## Goals

- Organize many short TIL entries into navigable themes.
- Keep categorization mostly automatic (minimal manual tagging).
- Preserve note content and markdown formatting in the generated output.
- Make the workflow reproducible and easy to rerun as new notes are added.

## Input Format

The pipeline reads `til.md` and parses entries using the existing date-based bullet structure. Each top-level dated item is treated as one note, and its nested bullets/sub-content are kept as part of that note.

At a high level:

1. Parse markdown into note records.
2. Build an embedding for each note.
3. Cluster similar embeddings.
4. Label clusters into human-readable categories.
5. Merge tiny categories into nearby larger ones.
6. Write categorized output to `CATEGORIES.md` (and JSON metadata when needed).

## Embeddings

Semantic embeddings are generated locally with Ollama using:

- Model: `nomic-embed-text`

Why embeddings:

- They capture semantic similarity better than keyword-only grouping.
- Similar topics with different wording still end up close in vector space.

Operationally, each note is converted to text and embedded into a fixed-size vector (commonly 768 dimensions for this model).

## Clustering Strategy

The grouping step uses k-means over note embeddings with cosine-style similarity behavior.

### Choosing the number of clusters

Instead of hardcoding one cluster count, the script evaluates a candidate range and selects a good `k` using silhouette score.

Benefits:

- Better adapts as the dataset grows.
- Reduces over- or under-grouping compared with fixed `k`.

## Category Labeling

Clusters are converted into readable category names using a hybrid approach:

1. **TF-IDF keywords** to identify salient terms in each cluster.
2. **Rule-based patterns** to normalize/override labels for known themes.

This keeps labels stable and understandable while still adapting to new content.

## Merging Small Categories

After initial clustering, very small categories (especially singletons) are merged into semantically related larger categories.

Merge behavior combines:

- predefined related-category groups,
- embedding similarity,
- and size-aware tie-breaking (smallest merges into largest suitable target).

This improves final readability by avoiding noisy one-off buckets.

## Output

Primary generated artifacts:

- `CATEGORIES.md`: human-readable grouped notes with full note content (including sub-bullets/links).
- `categories.json`: machine-friendly category metadata.

The markdown output is designed for browsing and can be used directly in docs/README workflows.

## Implementations in This Repo

Two implementations exist:

- `categorize.js`
- `categorize.py`

### JavaScript version

- Pros: fast cold start, fewer dependencies, lightweight runtime.
- Cons: more custom math/algorithm code to maintain.

### Python version

- Pros: shorter code and easier maintenance; leverages mature libraries (`numpy`, `scikit-learn`, `httpx`).
- Cons: slightly higher startup/memory overhead in some environments.

Both produce equivalent category outcomes when run with similar settings.

## Typical Workflow

1. Add/update notes in `til.md`.
2. Run categorization script (`categorize.js` or `categorize.py`).
3. Review `CATEGORIES.md`.
4. Optionally refresh README sections to reference/use categorized output.

## Tuning and Extensions

As note volume increases, you can improve quality by:

- tuning candidate `k` ranges,
- adjusting merge groups,
- refining labeling rules,
- adding clustering alternatives (for example, density-based methods like HDBSCAN in Python).

## Summary

This approach combines semantic embeddings, unsupervised clustering, and light rule-based post-processing to keep TIL notes organized automatically while preserving high-quality, readable output.
