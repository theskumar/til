#!/usr/bin/env python3
"""Extract new/edited TIL entries from a git diff and post/update on Mastodon.

After posting, appends a [discuss](url) link to the entry in til.md.
After editing, updates the existing Mastodon status in place.
"""

import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

MASTODON_INSTANCE = "https://mastodon.social"
CHAR_LIMIT = 500
# Site permalink base (mirrors build-site.js MAIN_SITE + BASE_URL).
SITE_BASE = "https://saurabh-kumar.com/til"
TIL_MD = Path(__file__).resolve().parent.parent / "til.md"

_DATE_PREFIX_RE = re.compile(r"^(\d{1,2} \w+ \d{4})\.")
_DISCUSS_RE = re.compile(r"\s*\[discuss\]\(https://mastodon\.social/@\w+/(\d+)\)")


def _entry_key(entry: str) -> str | None:
    m = _DATE_PREFIX_RE.match(entry)
    return m.group(1) if m else None


def _parse_entries(diff_text: str, prefix: str) -> list[str]:
    entries = []
    current_lines: list[str] = []

    for line in diff_text.splitlines():
        if not line.startswith(prefix) or line.startswith(prefix * 3):
            continue
        content = line[len(prefix):]

        if content.startswith("- ") and re.match(r"^- \d{1,2} \w+ \d{4}\. ", content):
            if current_lines:
                entries.append("\n".join(current_lines))
            current_lines = [content[2:]]  # strip leading "- "
        elif current_lines and (content.startswith("  ") or content == ""):
            current_lines.append(content)
        else:
            if current_lines:
                entries.append("\n".join(current_lines))
                current_lines = []

    if current_lines:
        entries.append("\n".join(current_lines))

    return entries


def classify_entries(diff_text: str) -> tuple[list[str], list[str]]:
    """Return (new_entries, edited_entries) from a diff."""
    added = _parse_entries(diff_text, "+")
    removed = _parse_entries(diff_text, "-")

    removed_keys = {_entry_key(e) for e in removed} - {None}

    new = []
    edited = []
    for entry in added:
        key = _entry_key(entry)
        if key and key in removed_keys:
            edited.append(entry)
        else:
            new.append(entry)

    return new, edited


def extract_status_id(entry: str) -> str | None:
    """Pull the Mastodon status ID from a [discuss] link in the entry."""
    m = _DISCUSS_RE.search(entry)
    return m.group(1) if m else None


def strip_discuss_link(entry: str) -> str:
    return _DISCUSS_RE.sub("", entry)


def _week_end(entry: str) -> str | None:
    """Replicate build-site.js getWeekEnd: the Sunday on/after the entry date."""
    key = _entry_key(entry)
    if not key:
        return None
    d = datetime.strptime(key, "%d %b %Y")
    js_dow = (d.weekday() + 1) % 7  # JS getUTCDay: Sunday=0
    days = (7 - js_dow) % 7 or 7
    return (d + timedelta(days=days)).strftime("%Y-%m-%d")


def _slug(entry: str) -> str:
    """Replicate build-site.js slugifyNote on the entry's first line."""
    first = strip_discuss_link(entry.split("\n", 1)[0])
    text = re.sub(r"^\d{1,2} \w+ \d{4}\.\s*", "", first)
    m = re.search(r"\[([^\]]+)\]", text)
    raw = m.group(1) if m else text[:60]
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", raw.lower()))


def note_permalink(entry: str) -> str | None:
    """Deep link to the full note on its weekly page anchor."""
    week = _week_end(entry)
    if not week:
        return None
    return f"{SITE_BASE}/weekly/{week}.html#{_slug(entry)}"


_TOOT_RE = re.compile(r"<!--\s*toot:\s*(.*?)\s*-->", re.DOTALL)


def extract_toot_override(entry: str) -> str | None:
    """An optional hand-written short form: `<!-- toot: ... -->` in the entry."""
    m = _TOOT_RE.search(entry)
    return m.group(1).strip() if m else None


def smart_truncate(text: str, limit: int) -> str:
    """Trim to a sentence boundary if one is near the limit, else a word one.

    Never cuts mid-word. Caller appends the ellipsis.
    """
    if len(text) <= limit:
        return text
    cut = text[:limit]
    for sep in (". ", "! ", "? "):
        idx = cut.rfind(sep)
        if idx >= limit * 0.6:
            return cut[: idx + 1].rstrip()
    idx = cut.rfind(" ")
    if idx > 0:
        cut = cut[:idx]
    return cut.rstrip()


def format_for_mastodon(entry: str) -> str:
    override = extract_toot_override(entry)
    entry_wo = _TOOT_RE.sub("", entry)
    tags = re.findall(r"#(\w[\w-]*)", entry_wo)

    text = override if override is not None else entry_wo
    text = strip_discuss_link(text)
    text = re.sub(r"^\d{1,2} \w+ \d{4}\.\s*-?\s*", "", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", text)
    text = re.sub(r"\s*#\w[\w-]*", "", text).rstrip()

    tags.insert(0, "TIL")
    hashtags = " ".join(f"#{t}" for t in tags)
    suffix = f"\n\n{hashtags}"

    available = CHAR_LIMIT - len(suffix)
    if len(text) <= available:
        return text + suffix

    # Truncated: reserve room for a read-more permalink so readers can reach the
    # full note. Mastodon counts any URL as 23 chars, so reserving its real
    # length is conservative and never overflows the real limit.
    permalink = note_permalink(entry)
    if permalink:
        tail = f"…\n\nFull note: {permalink}"
        text = smart_truncate(text, available - len(tail))
        return f"{text}{tail}{suffix}"

    return smart_truncate(text, available - 1) + "…" + suffix


def append_discuss_link(entry_date: str, mastodon_url: str):
    """Find the entry line in til.md by date prefix and append [discuss](url)."""
    text = TIL_MD.read_text()
    lines = text.split("\n")
    prefix = f"- {entry_date}. "
    for i, line in enumerate(lines):
        if line.startswith(prefix) and "[discuss]" not in line:
            lines[i] = line.rstrip() + f" [discuss]({mastodon_url})"
            break
    TIL_MD.write_text("\n".join(lines))


def mastodon_request(method: str, path: str, token: str, data: dict | None = None) -> dict:
    url = f"{MASTODON_INSTANCE}{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def post_status(status: str, token: str) -> dict:
    return mastodon_request("POST", "/api/v1/statuses", token, {"status": status, "visibility": "public"})


def edit_status(status_id: str, status: str, token: str) -> dict:
    return mastodon_request("PUT", f"/api/v1/statuses/{status_id}", token, {"status": status})


def main():
    token = os.environ.get("MASTODON_ACCESS_TOKEN", "")
    if not token:
        print("MASTODON_ACCESS_TOKEN not set", file=sys.stderr)
        sys.exit(1)

    dry_run = "--dry-run" in sys.argv

    diff = subprocess.run(
        ["git", "diff", "HEAD~1", "HEAD", "--", "til.md"],
        capture_output=True, text=True, check=True,
    ).stdout

    new_entries, edited_entries = classify_entries(diff)
    if not new_entries and not edited_entries:
        print("No new or edited TIL entries found in diff.")
        return

    for entry in new_entries:
        status = format_for_mastodon(entry)
        key = _entry_key(entry)
        print(f"--- New post ({len(status)} chars) ---")
        print(status)
        print("---")

        if dry_run:
            print("(dry-run, skipping)")
            continue

        result = post_status(status, token)
        mastodon_url = result.get("url", "")
        print(f"Posted: {mastodon_url}")
        if key and mastodon_url:
            append_discuss_link(key, mastodon_url)

    for entry in edited_entries:
        status = format_for_mastodon(entry)
        status_id = extract_status_id(entry)

        if not status_id:
            key = _entry_key(entry)
            print(f"--- Edit skipped (no [discuss] link for {key!r}) ---")
            continue

        print(f"--- Edit ({len(status)} chars, status {status_id}) ---")
        print(status)
        print("---")

        if dry_run:
            print("(dry-run, skipping)")
            continue

        result = edit_status(status_id, status, token)
        print(f"Edited: {result.get('url', 'unknown')}")


if __name__ == "__main__":
    main()
