# Ideas

A running log of interesting ideas worth exploring, usually sparked by something in the TIL notes.

---

## 28 Jun 2026 — Django UNLOGGED cache backend

**Origin:** [PostgreSQL UNLOGGED tables](#) in `til.md`

Port [hynek/psycache](https://github.com/hynek/psycache)'s approach into the Django cache framework as a drop-in `BaseCache` backend:

- Create an `UNLOGGED` table instead of `DatabaseCache`'s regular table (via migration or custom `createcachetable` command)
- Reuse Django's existing database connection pool — no extra infrastructure
- Optionally store values as JSONB instead of pickled text for native Postgres querying
- Postgres-specific, so it would live in a dedicated `psycache-django` package (~200 lines)

**Why it's interesting:** Eliminates Redis as a dependency for teams already on Postgres, and crash-truncation is fine for a cache.
