# How Prompt Caching Works

Today I learned how prompt caching actually works under the hood in LLM APIs
(Anthropic, OpenAI, Bedrock, etc.), and why it makes long agent loops 5–10×
cheaper and noticeably faster.

## The problem it solves

In an agent / chat loop, every request to the model looks almost identical to
the previous one:

- The same big **system prompt** (rules, tool descriptions, skills…)
- The same set of **tool definitions**
- The same **history** of past user/assistant/tool messages, with only a few
  new tokens appended at the end

Without caching, the provider has to re-tokenize and run a full attention
pre-fill over all of that prefix on every turn. For a 100k-token context, that
prefill dominates both cost and latency.

## What gets cached: the KV state

When a transformer processes a prompt, it computes a **key/value tensor pair
for every token in every attention layer**. That KV state is what attention
queries against on the next decoded token.

Prompt caching is, mechanically, "save those KV tensors for a prefix on the
server, and reuse them next time the same prefix shows up." Output tokens are
never cached — only the prompt-side KV state.

## The lifecycle

1. **Mark a cache breakpoint.** The client places a `cache_control` marker
   (Anthropic) or relies on automatic prefix detection (OpenAI). Everything
   *before* the marker is the cacheable prefix.
2. **First request → cache write.** The provider hashes the cacheable prefix
   (model id + tools + messages + cache key, byte-exact), runs the prefill,
   and stores the resulting KV tensors keyed by that hash. You're billed
   `cache_write` tokens, usually a bit *more* than normal input
   (~1.25× for Anthropic 5-minute cache, ~2× for the 1-hour "extended"
   cache).
3. **Next request → cache read.** If the new request starts with exactly the
   same prefix, the provider looks up the hash, loads the stored KV state,
   and only runs fresh compute for the suffix after the last hit. You're
   billed `cache_read` tokens — often **~10% of the normal input price**.
4. **TTL.** Entries expire after a TTL (Anthropic: 5 min default, 1 hour
   opt-in; OpenAI: a few minutes, automatic). Each hit typically refreshes
   the TTL, so an active session keeps the cache warm.

## What invalidates the cache

The hash is over the **exact bytes** of the prefix. Anything that changes
those bytes forces a fresh `cache_write`:

- Editing the system prompt (even reordering sentences or adjusting
  whitespace)
- Adding, removing, or reordering a tool definition
- Inserting/editing/reordering an earlier message in the history
- Switching model id or provider
- Changing the cache key (some providers expose one for tenant isolation)

The corollary: to maximize hit rate, agents should **only append at the end**
and keep system prompt and tools byte-stable across turns.

## Reading the usage block

Most providers return a usage object on every response with at least these
fields:

```json
{
  "input": 312,          // fresh, non-cached prompt tokens this turn
  "output": 845,         // generated tokens
  "cacheRead": 47210,    // prompt tokens served from cache
  "cacheWrite": 0        // prompt tokens written to cache this turn
}
```

A useful per-turn metric is the **cache hit ratio**:

```
cacheHitRate = cacheRead / (input + cacheRead + cacheWrite)
```

- `0%` → nothing reused. Normal on the very first turn, or right after the
  prefix changed (tool list updated, history compacted, model swapped).
- `70–95%` → healthy steady state for a long agent loop.
- `cacheWrite > 0, cacheRead = 0` → you just primed the cache; the next turn
  should be cheap if you don't break the prefix.

## Pricing back-of-the-envelope

Rough Anthropic numbers (Claude Sonnet, illustrative):

| Token type     | Price multiplier vs. input |
|----------------|---------------------------|
| `input`        | 1×                        |
| `cache_write`  | ~1.25× (5 min) / ~2× (1h) |
| `cache_read`   | ~0.1×                     |
| `output`       | ~5×                       |

So a 100k-token prefix that's hit 20 times across a session costs roughly:

```
1 × 1.25 × 100k   (one write)
+ 19 × 0.1 × 100k (nineteen reads)
= 1.25 × 100k + 1.9 × 100k
≈ 3.15 × 100k input-equivalent

vs. uncached:
20 × 1 × 100k = 20 × 100k
```

A ~6× saving on the prompt side, plus a big latency win because the server
skips the prefill.

## Gotchas

- **Minimum prefix size.** Most providers require the cacheable prefix to be
  above some threshold (e.g. 1024 tokens for Anthropic) before caching kicks
  in at all.
- **Position of the breakpoint matters.** Putting it after volatile content
  (like the latest user message) means nothing ever gets reused.
- **Tool definitions are part of the prefix.** Dynamically generated tool
  lists with shuffled order will silently destroy your hit rate.
- **Streaming vs. non-streaming** use the same cache; cache fields show up
  in the final usage event.
- **Cost accounting:** `cache_write` is more expensive than `input`, so a
  flaky prefix that constantly re-writes can be *worse* than no caching at
  all.
