#!/usr/bin/env python3
"""Extract new TIL entries from a git diff and post each to Mastodon."""

import json
import os
import re
import subprocess
import sys
import urllib.request

MASTODON_INSTANCE = "https://mastodon.social"
TIL_URL = "https://saurabh-kumar.com/til"
CHAR_LIMIT = 500


def get_new_entries(diff_text: str) -> list[str]:
    """Parse added TIL entries from a unified diff of til.md."""
    entries = []
    current_lines: list[str] = []

    for line in diff_text.splitlines():
        if not line.startswith("+"):
            continue
        if line.startswith("+++"):
            continue
        content = line[1:]

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


def format_for_mastodon(entry: str) -> str:
    """Convert a TIL entry to a Mastodon-friendly post."""
    text = re.sub(r"^\d{1,2} \w+ \d{4}\.\s*-?\s*", "", entry)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", text)

    tags = re.findall(r"#(\w[\w-]*)", text)
    text = re.sub(r"\s*#\w[\w-]*", "", text)
    text = text.rstrip()

    tags.insert(0, "TIL")
    hashtags = " ".join(f"#{t}" for t in tags)
    suffix = f"\n\n{hashtags}"

    available = CHAR_LIMIT - len(suffix)
    if len(text) > available:
        text = text[: available - 1].rstrip() + "…"

    return text + suffix


def post_to_mastodon(status: str, token: str) -> dict:
    """Post a status to Mastodon, return the API response."""
    url = f"{MASTODON_INSTANCE}/api/v1/statuses"
    data = json.dumps({"status": status, "visibility": "public"}).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


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

    entries = get_new_entries(diff)
    if not entries:
        print("No new TIL entries found in diff.")
        return

    for entry in entries:
        status = format_for_mastodon(entry)
        print(f"--- Post ({len(status)} chars) ---")
        print(status)
        print("---")

        if dry_run:
            print("(dry-run, skipping post)")
            continue

        result = post_to_mastodon(status, token)
        print(f"Posted: {result.get('url', 'unknown')}")


if __name__ == "__main__":
    main()
