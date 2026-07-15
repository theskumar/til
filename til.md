# Jul 2026

- 15 Jul 2026. [SecretSpec](https://secretspec.dev/) declares secrets once in `secretspec.toml` (names + descriptions, never values) and resolves them from any of 11 backends: keyring, 1Password, Vault, AWS, GCP, .env. Same command everywhere: `secretspec run --profile production -- npm start`. Per-secret fallback chains (`providers = ["vault", "keyring", "env"]`) and a `ref = { item, field }` form points at a secret you already have elsewhere, no renaming. Sharpest bit: agents get held to a stricter bar by default. `require_reason = "agents"` forces `secretspec run --reason "..."` before an AI agent can read a secret, appended to a local audit log; humans running interactively are unaffected. Rust core, SDKs for Python/Go/Node/Ruby/PHP/Haskell. Worth piloting on a project drowning in `.env` sprawl. #tools #devops #security

- 13 Jul 2026. [Recordly](https://github.com/webadderallorg/Recordly) does video recording, screenshots, and demo editing in one open-source Electron app. Not in Homebrew core, but easy to ship via a [personal tap](https://github.com/theskumar/homebrew-tap): `brew install --cask theskumar/tap/recordly`. Replacing my previous screenshot/recording workflow with this as the single default (see [Default Apps 2025](https://saurabh-kumar.com/articles/2025/11/default-apps-2025/)). #tools #macos

- 11 Jul 2026. Python 3.15 datetime docs now officially recommend [`import datetime as dt`](https://docs.python.org/3.15/library/datetime.html#module-datetime:~:text=Tip%20import%20datetime%20as%20dt) in a Tip block, to disambiguate the module from the `datetime.datetime` class. The tip cites [Adam Johnson's 2019 post](https://adamj.eu/tech/2019/09/12/how-i-import-pythons-datetime-module/) — 6 years from community convention to CPython docs. Fixes both traps: `from datetime import datetime` shadows the module, and `import datetime` reads ambiguously as `datetime.datetime.now()`. [via](https://fosstodon.org/@adamchainz/116897748723239892) #python

# Jun 2026

- 28 Jun 2026. PostgreSQL `UNLOGGED` tables skip the write-ahead log, making writes considerably faster than ordinary tables. Trade-off: they are truncated after a crash or unclean shutdown and are not replicated to standbys. [hynek/psycache](https://github.com/hynek/psycache) exploits this as a PostgreSQL-native cache replacing Redis — crash truncation is acceptable since it's a cache anyway, and you reuse existing Postgres connections. #postgres #databases
  Interesting idea: port this to Django as a custom `BaseCache` backend — swap `DatabaseCache`'s regular table for `CREATE UNLOGGED TABLE`, reuse Django's existing DB connections, and skip Redis entirely. ~200 lines.

- 26 Jun 2026. [baidu/Unlimited-OCR](https://github.com/baidu/Unlimited-OCR) ([paper](https://arxiv.org/abs/2606.23050)) parses dozens of pages in one forward pass by fixing the real bottleneck in end-to-end OCR. #ai #ml #ocr
  - The problem: an OCR decoder types out the page token-by-token, and its KV cache grows unbounded with output length — so memory climbs and speed decays the longer the doc, forcing page-by-page loops that wipe memory each step.
  - The trick (Reference Sliding Window Attention): split context into two zones with different retention. Vision/prompt tokens stay fully visible and pinned forever (the "source book"); each token attends to only the last 128 of its own outputs (the "last few words you wrote"). KV cache becomes a fixed-size queue, so memory and TPS stay flat regardless of output length.
  - The non-obvious part: discarding history *improves* accuracy (+6% on OmniDocBench, beating Qwen2.5-VL-72B at 3B/0.5B-active) — full attention can diverge on long dense output, and pinned vision tokens never blur.
  - Cheap to build: freeze DeepSeek-OCR's encoder, fine-tune only the decoder with the swapped attention.
  - Generalizes past OCR: separate *what you reference* from *what you remember*.
  - Ran it on an M1 Mac (32GB) with R-SWA intact, no NVIDIA. The official HF model (`trust_remote_code`) already ships R-SWA as a **pure-PyTorch eager ring buffer** (`SlidingWindowLlamaAttention`, picked via `attn_implementation="eager"`) — not buried in a CUDA/FlashAttention kernel. So the "port" was just stripping `.cuda()`/`torch.autocast("cuda")` and running bf16 on MPS; zero MPS op-gaps hit. bf16 works on MPS in torch 2.12.
  - Proof R-SWA is live: instrument the KV cache during decode — on a 540-token page it plateaus at `prefill(277) + window(128) = 405` and never grows (full MHA would hit 817). That constant-cache assertion + Distinct-35≈1.0 are the decisive signals, not edit distance (too noisy vs a single reference).
  - Gotcha: feeding all pages to one `generate()` (`infer_multi`) **loops at the document level** — the 128-token decode window forgets the doc was already transcribed while the vision prefix still shows every page, so it restarts from page 1. Fix = one `generate()` per page (matches official `infer.py` `PAGE_SIZE=1`). Accuracy then lands at/below gemini-vs-docai inter-annotator noise (~0.31 mean edit). ~35–55 s/page on M1.
- 23 Jun 2026. Many asymmetric embedding models need task prefixes on inputs, and skipping them quietly degrades relevance. Each model has its own scheme: nomic (`search_query:`/`search_document:`), E5 (`query:`/`passage:`), BGE (a query instruction sentence, bare docs) — not interchangeable. OpenAI `text-embedding-3-*` and `all-MiniLM-L6-v2` need none. Whether you add the prefix depends on the serving layer, not the model: raw endpoints (llama.cpp `/v1/embeddings`, HF TEI, Ollama) send bare text so it's on you, while sentence-transformers (`prompt_name="query"`) and vendor SDKs inject it for you. Adding `search_query:`/`search_document:` to a nomic-v1.5 call lifted cosine similarity on a real query/doc pair from 0.54 to 0.60 at zero cost. #rag #ai
- 15 Jun 2026. [Moshi](https://getmoshi.app/) is the best SSH client I've found for iPhone — connects to your laptop's tmux sessions over [Mosh](https://mosh.org/), making it rock-solid on mobile networks with roaming support. Perfect for an agent view on the go; I use it to monitor and interact with running pi/Claude sessions from my iPhone without losing the session on network switches. #macos #tools #ai
- 08 Jun 2026. [faberic](https://github.com/danielmiessler/fabric) is a crowd-sourced collection of prompts bundeled with a cli to use them via piped interfaces. #ai #tools #open-source
- 08 Jun 2026. [karpathy/autoresearch] is a concept/framework that allows one to leverage LLM to run an optimization loops based on a criteria. [davebcn87/pi-autoresearch](https://github.com/davebcn87/pi-autoresearch) takes this further has built a generic optimization long run loop method on top of pi agent. [gemini](https://gemini.google.com/app/7dcee9714f7955ce) #ai #performance

# May 2026

- 29 May 2026. [Dynamic workflows](https://claude.com/blog/introducing-dynamic-workflows-in-claude-code) in Claude Code. Claude dynamically writes orchestration scripts that spawn tens to hundreds of parallel subagents. It plans, decomposes into subtasks, fans out agents, and checks results before returning a coordinated answer. Adversarial agents try to refute findings, iterating until convergence. Enable via `ultracode` setting or ask Claude to "create a workflow". Notable: Jarred Sumner used it to port Bun from Zig to Rust (~750K lines, 11 days). Available on Max, Team, Enterprise plans. Consumes significantly more tokens than typical sessions. #ai #devops
- 09 May 2026. Use HTML instead of markdown to effectively plan and review. [Claude Code: The Unreasonable Effectiveness of HTML" / X](https://x.com/trq212/status/2052809885763747935) #ai #markdown
- 09 May 2026. [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph): Pre-indexed code knowledge graph for Claude Code — fewer tokens, fewer tool calls, 100% local #ai #tools

# Apr 2026

- 22 Apr 2026. A good collection of practices on automated AI code reviews by [Ankit Jain](https://www.latent.space/p/reviews-dead) #ai #architecture
  - The Scalability Crisis: Manual post-PR review is no longer viable. AI agents have nearly doubled code output, causing human review time to spike by 91%, creating a bottleneck that traditional workflows cannot solve.
  - The Upstream Pivot: Human value must shift from reviewing implementation to defining intent. Instead of checking syntax, humans spend their energy writing rigorous specs and acceptance criteria before the code is written, which the machine then uses to self-verify.
  - The Swiss-Cheese Defense: Rather than one "perfect" human gate, the model uses a stack of imperfect automated layers. By layering signals like agent competition, deterministic guardrails, and adversarial "red-team" agents, the system catches errors where their individual failure modes don't overlap.
- 12 Apr 2026. [codespelunker](https://github.com/boyter/cs?tab=readme-ov-file) is a CLI code search tool that understands code structure and ranks results by relevance. No indexing required with CLI, TUI, MCP and HTTP support. #tools #search
- 12 Apr 2026. [FluidVoice](https://github.com/altic-dev/FluidVoice) with paraquet v2 is soemthing i've been using now as my default speech-to-text on Mac, after evaluating WisperFlow, Handy and VoiceInk. #macos
- 12 Apr 2026. [thaw](https://github.com/stonerl/Thaw) a fork of Ice. I'm switching to it, as Ice seems to the inactive now. #macos #open-source
- 04 Apr 2026. [mise](https://github.com/jdx/mise) let's you manage dependencies at OS level and project level. Thinking to manage my dev machine. The hard part is documenting what I have installed. #tools #devops
- 02 Apr 2026. [Django Modern REST](https://django-modern-rest.readthedocs.io) seems to be an emerging REST API library with focus on performance, scalability and pluggable serializers. Supporting msgpack, CBV and less of sync_to_async. Might evaluate it against the my current preferred `django-ninja`. [gemini](https://gemini.google.com/app/1aa113e0b21dd18f) #django #python #architecture

# Mar 2026

- 24 Mar 2026. [pageindex](https://github.com/VectifyAI/PageIndex/) generates a semantic tree-like json index of a lengthy document to allow for reasoning based RAG without the need for vectordb. #rag #ai #databases
- 21 Mar 2026. [`moor`](https://github.com/walles/moor) is a better replacement for less and bat as PAGER. #tools #shell
- 17 Mar 2026. Every layer of review makes you 10x slower via [apenwarr](https://apenwarr.ca/log/20260316) #architecture

# Feb 2026

- 20 Feb 2026. `brew install git-trim` [git-trim](https://github.com/foriequal0/git-trim) - A dedicated binary for #tools #shell
  safely deleting merged branches. Handles edge cases better than bash one-liners, including squash-merged branches. [#](https://news.ycombinator.com/item?id=47089533) #tools
- 19 Feb 2026. [slingdata-io/sling-cli](https://github.com/slingdata-io/sling-cli) is a promising tool move/sync data between databases and files, esp. helpful for local testing, ci/cd while able to do stage/sql based transformations. #data #tools #databases
- 16 Feb 2026. https://modern-css.com/ has a really nice collection of CSS replacements for older hacks. #css

- 16 Feb 2026. [panphora/overtype](https://github.com/panphora/overtype): The markdown editor that's just a textarea with a small size footprint and a minimum looking UI https://overtype.dev (⭐3431) #markdown #editor

- 15 Feb 2026. For generating embedding locally, #rag #ai
  [nomic-embed-text](https://ollama.com/library/nomic-embed-text) is a large
  context length text encoder that
  [surpasses](https://www.nomic.ai/news/nomic-embed-text-v1) OpenAI
  text-embedding-ada-002 and text-embedding-3-small performance on short and
  long context tasks. It has a balance of speed, 8k context, and accuracy for
  English-centric apps. BGE-M3, Qwen3-Embedding and E5-Small are other
  alternatives. #rag

- 15 Feb 2026. [alibaba/zvec](https://github.com/alibaba/zvec) by alibaba is an #rag #databases
  embedded vector database supports both spare and dense vectors, along with
  structured data. It can be considered the sqlite of vector databases. #databases #rag

- 15 Feb 2026. [yichuan-w/LEANN](https://github.com/yichuan-w/LEANN) is a RAG focused framework focused on efficient storage with built-in chunking strategies embedding model management and MCP server. [gemini](https://gemini.google.com/app/c627885d0bf34a2d) #rag #ai
- 15 Feb 2026. [K-dense](https://www.k-dense.ai/) known for using skills to enable deep research has published [140+ skills](ttps://github.com/K-Dense-AI/claude-scientific-skills) related to scientic research including literature review, data analysis, etc. #ai
- 13 Feb 2026. [zoocache](https://github.com/albertobadia/zoocache) is a sematic dependency based cache manager, that support in-memory, LMDB or redis backends. Integration with [Django](https://github.com/albertobadia/zoocache/blob/main/docs/django_user_guide.md) looks interesting. #django #python #databases
- 12 Feb 2026. [Handy](https://handy.computer/) Looks like a promising tool for to replace WisperFlow and VoiceInk for speech to text conversion. [via](https://dannysmith.notion.site/Danny-s-Software-313c769fa9c04819a37d813da0485c78) #macos
- 10 Feb 2026. [Hono](https://hono.dev/) based on web standards is a great option for js runtimes esp. if you plan to deploy your code to cloudflare workers, bun or deno. You get faster startup time and cross-platform compatibility. #javascript #devops #performance
- 06 Feb 2026. Opus 4.6 launch. #ai #open-source #security
  - context compaction (beta) and 1M context window, enables longer agentic tasks without loosing context.
  - they claim it has found 500 Zero-Day Flaws in open-source projects (yet to see the proofs though)
  - agent teams, multiple agent coordinates with a leader agent. https://code.claude.com/docs/en/agent-teams
- 05 Feb 2026. On blockchain, UIPC (Universal IPC) and SIPC (Secure IPC) are frameworks that allows different network to talk to each other using a standard protocol. While UIPC acts as the universal courier, SIPC acts as the security guard. Together, they create "Internet of Blockchains". [Gemini](https://gemini.google.com/app/b8339d20bf7f33cf) #blockchain #architecture #security
  - [Cosmos IBC](https://docs.cosmos.network/ibc/v10.1.x/intro) & [Polkadot - XCM](https://wiki.polkadot.network/docs/learn-xcm) are two industry leading protocols for UIPC
  - For the SIPC, **Zero-Knowledge Proofs** and **Rollup architecture** also "Trustless bridges" or "Cross-rollup communication" are often more frequently used terms in blockchain literatures.
- 05 Feb 2026. [Vortex](https://vortex.dev/) a newer format is supported by [duckdb](https://duckdb.org/2026/01/23/duckdb-vortex-extension) promises to be faster for random access and has zero-copy metadata, with better compression. While the support across the board is limited but worth considering for LLM/RAG based uses over parquet. #data #databases #rag
- 05 Feb 2026. **Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems** by Martin Kleppmann manages to be both rigorous technical manual and something approaching a philosophical treatise on the nature of truth, consistency, and trust in distributed systems. [Claude][https://claude.ai/chat/0f58f2f6-bd56-41a1-a785-8267afa5a3d1] #book #architecture #databases
  - Foundation. He starts by asking the questions _"What do we actually want in our data systems"_, answers them as - reliability, scalability and maintainability.
    - Reliability. The question isn't whether failure will happen, it will, but the whether the systems can survive them.
    - Scalability. It's not a binary question of whether a system is "scalable" or "not scalable". Ask - "What happens when specific load parameter increase?"
    - Maintainability - most underappreciated of the three, he argues the majority of cost isn't in initial development but in ongoing maintainence.
  - The data model wars - the skill isn't in choosing the "best" database but in understanding which tradeoffs matter for your specific problem.
  - Storage engines. Two major approaches to read & write data from disk, neither is universally better.
    - **Log-structured storage** (like LSM-trees) optimizes for writes, every write is appended and the merged/compacted later.
    - **Page-oriented storage** (like B-trees) optimizes for reads, data is stored in fixed-sized block, which then get updated in-place, more like filing cabinet with each document has a designated slot.
  - Instead of asking "how do I build this?" ask "what does it mean for this to work correctly?"

# Jan 2026

- 31 Jan 2026. Notes on "How AI assistance impacts the formation of coding skills" [Article](https://www.anthropic.com/research/AI-assistance-coding-skills) [HN](https://news.ycombinator.com/item?id=46820924) #ai #architecture
  - AI speeds up coding but reduces deep understanding and mastery
  - Juniors (1-3 years experience) showed speed improvements with AI, but 4+ year developers showed no difference
  - Modern software work is more about requirements, specs, documentation, and communication than raw coding skill
  - Small sample size (n<8) and study design limitations make results questionable
  - Takeaways:
    1. **Use AI for high-scoring interaction patterns**: Ask conceptual questions and request explanations rather than just code generation
    2. **Adopt AI for documentation and specs**: Multiple developers report dramatic improvements in tickets, PRs, and documentation quality
    3. **Be deliberate about learning**: If using AI, actively practice explaining concepts and avoid pure copy-paste workflows
    4. **Use AI to reduce grunt work**: Let it handle boilerplate, test writing, and repetitive tasks while focusing on architecture and requirements
  - **The research confirms what many suspected: AI coding assistants create a real trade-off between speed and skill development, but the practical significance is hotly contested.** The critical question isn't whether AI reduces learning (it does), but whether deep coding skill remains as valuable as expressing requirements clearly—and whether we're comfortable with a generation of developers who can't function without AI assistance.
- 12 Jan 2026. Distributed Key-value store -- https://etcd.io/ #databases
- 12 Jan 2026. Learnt about [VoiceLink](https://tryvoiceink.com/), an alternative to [Wispr Flow] that have been using as my STT software, with it's pricing model VoiceLink might be better replacement if it performs as good as WisprFlow #macos
- 12 Jan 2026. The free-threaded version of python can be added to uv and github actions with `t` suffix. e.g. `3.14t` and `3.13t` [source](https://github.com/actions/setup-python?tab=readme-ov-file#basic-usage) #python #devops
- 11 Jan 2026. Puzer published a [github recommendor](https://puzer.github.io/github_recommender/) that uses semantic embedding from user's github stars all client side, I found some great recommendations which I plan to use: #tools #databases #rag
  - [pamburus/hl](https://github.com/pamburus/hl): A fast and powerful log viewer and processor that converts JSON logs or logfmt logs into a clear human-readable format. (⭐2657)
  - [samwho/spacer](https://github.com/samwho/spacer): CLI tool to insert spacers when command output stops (⭐1663)
  - [darrenburns/posting](https://github.com/darrenburns/posting): The modern API client that lives in your terminal. (⭐11134)
  - [plutov/oq](https://github.com/plutov/oq): Terminal OpenAPI Spec viewer (⭐943)
  - [wey-gu/py-pglite](https://github.com/wey-gu/py-pglite): PGlite wrapper in Python for testing. Test your app with Postgres just as lite as SQLite. (⭐577)
- 07 Jan 2026. Text based diagramming tools: #tools
  - [yuzutech/kroki](https://github.com/yuzutech/kroki): self-hosted solution for unified interface to buch of diagramming tools, including mermaid, d2, etc.! (⭐3875)
  - [d2](https://github.com/terrastruct/d2) provides a clean syntax and output as well.
- 07 Jan 2026. "[Django Postgres Migration Tools](https://github.com/kraken-tech/django-pg-migration-tools?tab=readme-ov-file) - add-on for safer and more scalable migrations in django. #django #databases

# Dec 2025

- 27 Dec 2025. [how uv got so fast](https://nesbitt.io/2025/12/26/how-uv-got-so-fast.html). UV performance is because of design decisions while rust contributes to micro optimizations. #python #performance
- 24 Dec 2025. "[LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) is an orchestration framework for building stateful multi-agent applications using LLMs. It provides low-level primitives such as nodes and edges, along with built-in features that give developers granular control over agent workflows, memory management and state persistence. This means developers can start with a simple pre-built graph and scale to complex, evolving agent architectures. With support for streaming, advanced context management and resilience patterns like model fallbacks and tool error handling, LangGraph enables you to build robust, production-grade agentic applications. Its graph-based approach ensures predictable, customizable workflows and simplifies debugging and scaling." #ai #python
- 22 Dec 2025. Notes from [Thoughtworks - Technology Radar vol 33](https://www.thoughtworks.com/content/dam/thoughtworks/documents/radar/2025/11/tr_technology_radar_vol_33_en.pdf) #architecture #databases #ai
  - text-to-sql solutions aren't working as expected
  - pnpm, langGraph, and pydantic recommended for adoption
- 22 Dec 2025. [`npx -y npm-check-updates`](https://github.com/raineorshine/npm-check-updates) tells you the latest versions of your `package.json`, ignoring pinned versions. #javascript #tools
- 22 Dec 2025. [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) principle -- "Don't call us, we'll call you". #architecture
  - This design principle is used widely in Web Frameworks, GUI programs, etc in the form of event listeners, dependency injections, callbacks to avoid boilerplate code, resuability and testability.
  - Some popular examples are DOM, Flask, [NestJS](https://docs.nestjs.com/providers), Angular, etc.
- 20 Dec 2025. New tools: #tools #devops #macos
  - [gh-actions-lockfile](https://github.com/gjtorikian/gh-actions-lockfile) to generate and verify lockfiles for gh-actions
  - [Proxyman](https://proxyman.com/) is more user-friendly http debugging proxy than Charles Proxy on MacOS
- 19 Dec 2025. "Choose Boring Tech" by [Dan McKinley](https://boringtechnology.club/) #architecture
  - "The failure mode of boring tech are well-understood"
- 19 Dec 2025. Notes from ["Django rapid architecture"](https://www.django-rapid-architecture.org/) #django #architecture
  - Recommends organizing the codebase with interfaces at the top layer followed by readers and "actions", Finally, 'data' as the bottom layer to organize Django codebase to allow for a simple code structure that allows for scaling
- 19 Dec 2025. [VectorChord](https://github.com/tensorchord/VectorChord/) is a faster pgvector alternative. #databases #rag
