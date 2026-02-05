# Feb 2025

- 05 Feb 2026. **Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems** by Martin Kleppmann manages to be both rigorous technical manual and something approaching a philosophical treatise on the nature of truth, consistency, and trust in distributed systems. [Claude][https://claude.ai/chat/0f58f2f6-bd56-41a1-a785-8267afa5a3d1]
	- Foundation. He starts by asking the questions *"What do we actually want in our data systems"*, answers them as - reliability, scalability and maintainability.
		- Reliability. The question isn't whether failure will happen, it will, but the whether the systems can survive them.
		- Scalability. It's not a binary question of whether a system is "scalable" or "not scalable". Ask - "What happens when specific load parameter increase?"
		- Maintainability - most underappreciated of the three, he argues the majority of cost isn't in initial development but in ongoing maintainence.
	- The data model wars - the skill isn't in choosing the "best" database but in understanding which tradeoffs matter for your specific problem.
	- Storage engines. Two major approaches to read & write data from disk, neither is universally better.
		- **Log-structured storage** (like LSM-trees) optimizes for writes, every write is appended and the merged/compacted later. 
		- **Page-oriented storage** (like B-trees) optimizes for reads, data is stored in fixed-sized block, which then get updated in-place, more like filing cabinet with each document has a designated slot.
	- Instead of asking "how do I build this?" ask "what does it mean for this to work correctly?"

# Jan 2025

- 31 Jan 2026. Notes on "How AI assistance impacts the formation of coding skills" [Article](https://www.anthropic.com/research/AI-assistance-coding-skills) [HN](https://news.ycombinator.com/item?id=46820924)
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
- 12 Jan 2026. Distributed Key-value store -- https://etcd.io/
- 12 Jan 2026. Learnt about [VoiceLink](https://tryvoiceink.com/), an alternative to [Wispr Flow] that have been using as my STT software, with it's pricing model VoiceLink might be better replacement if it performs as good as WisprFlow
- 12 Jan 2026. The free-threaded version of python can be added to uv and github actions with `t` suffix. e.g. `3.14t` and `3.13t` [source](https://github.com/actions/setup-python?tab=readme-ov-file#basic-usage)
- 11 Jan 2026. Puzer published a [github recommendor](https://puzer.github.io/github_recommender/) that uses semantic embedding from user's github stars all client side, I found some great recommendations which I plan to use:
  - [pamburus/hl](https://github.com/pamburus/hl): A fast and powerful log viewer and processor that converts JSON logs or logfmt logs into a clear human-readable format. (⭐2657)
  - [samwho/spacer](https://github.com/samwho/spacer): CLI tool to insert spacers when command output stops (⭐1663)
  - [darrenburns/posting](https://github.com/darrenburns/posting): The modern API client that lives in your terminal. (⭐11134)
  - [plutov/oq](https://github.com/plutov/oq): Terminal OpenAPI Spec viewer (⭐943)
  - [wey-gu/py-pglite](https://github.com/wey-gu/py-pglite): PGlite wrapper in Python for testing. Test your app with Postgres just as lite as SQLite. (⭐577)
- 07 Jan 2026. Text based diagramming tools:
  - [yuzutech/kroki](https://github.com/yuzutech/kroki): self-hosted solution for unified interface to buch of diagramming tools, including mermaid, d2, etc.! (⭐3875)
  - [d2](https://github.com/terrastruct/d2) provides a clean syntax and output as well.
- 07 Jan 2026. "[Django Postgres Migration Tools](https://github.com/kraken-tech/django-pg-migration-tools?tab=readme-ov-file) - add-on for safer and more scalable migrations in django.

# Dec 2025

- 27 Dec 2025. [how uv got so fast](https://nesbitt.io/2025/12/26/how-uv-got-so-fast.html). UV performance is because of design decisions while rust contributes to micro optimizations.
- 24 Dec 2025. "[LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) is an orchestration framework for building stateful multi-agent applications using LLMs. It provides low-level primitives such as nodes and edges, along with built-in features that give developers granular control over agent workflows, memory management and state persistence. This means developers can start with a simple pre-built graph and scale to complex, evolving agent architectures. With support for streaming, advanced context management and resilience patterns like model fallbacks and tool error handling, LangGraph enables you to build robust, production-grade agentic applications. Its graph-based approach ensures predictable, customizable workflows and simplifies debugging and scaling."
- 22 Dec 2025. Notes from [Thoughtworks - Technology Radar vol 33](https://www.thoughtworks.com/content/dam/thoughtworks/documents/radar/2025/11/tr_technology_radar_vol_33_en.pdf)
  - text-to-sql solutions aren't working as expected
  - pnpm, langGraph, and pydantic recommended for adoption
- 22 Dec 2025. [`npx -y npm-check-updates`](https://github.com/raineorshine/npm-check-updates) tells you the latest versions of your `package.json`, ignoring pinned versions.
- 22 Dec 2025. [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) principle -- "Don't call us, we'll call you".
  - This design principle is used widely in Web Frameworks, GUI programs, etc in the form of event listeners, dependency injections, callbacks to avoid boilerplate code, resuability and testability.
  - Some popular examples are DOM, Flask, [NestJS](https://docs.nestjs.com/providers), Angular, etc.
- 20 Dec 2025. New tools:
  - [gh-actions-lockfile](https://github.com/gjtorikian/gh-actions-lockfile) to generate and verify lockfiles for gh-actions
  - [Proxyman](https://proxyman.com/) is more user-friendly http debugging proxy than Charles Proxy on MacOS
- 19 Dec 2025. "Choose Boring Tech" by [Dan McKinley](https://boringtechnology.club/)
  - "The failure mode of boring tech are well-understood"
- 19 Dec 2025. Notes from ["Django rapid architecture"](https://www.django-rapid-architecture.org/)
  - Recommends organizing the codebase with interfaces at the top layer followed by readers and "actions", Finally, 'data' as the bottom layer to organize Django codebase to allow for a simple code structure that allows for scaling
- 19 Dec 2025. [VectorChord](https://github.com/tensorchord/VectorChord/) is a faster pgvector alternative.
