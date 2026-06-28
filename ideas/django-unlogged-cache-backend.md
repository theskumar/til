# Django cache backend using PostgreSQL UNLOGGED tables

[hynek/psycache](https://github.com/hynek/psycache) uses PostgreSQL `UNLOGGED` tables as a Redis replacement — writes skip the write-ahead log so they're significantly faster, and crash-truncation is acceptable for a cache anyway.

This approach could be ported to Django as a custom `BaseCache` backend:

- Create an `UNLOGGED` table instead of `DatabaseCache`'s regular table, via a migration or a custom `createcachetable` management command
- Reuse Django's existing database connection pool — no extra infrastructure
- Optionally store values as JSONB instead of pickled text, enabling native Postgres querying on cached values
- Postgres-specific, so it would live in a dedicated `psycache-django` package (~200 lines)

Eliminates Redis as a dependency for teams already on Postgres, with no changes to the rest of the Django cache API.
