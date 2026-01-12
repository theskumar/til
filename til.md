# Jan 2025

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
