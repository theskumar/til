## Configure Relative Line Numbers

Set `relative_line_numbers` to allow you to navigate faster.

```json
{
  "relative_line_numbers": true,
  "vim": {
    "toggle_relative_line_numbers": true
  }
}
```

The `toggle_relative_line_numbers` setting is particularly useful because it
shows relative numbers in Normal Mode (for jumping) but switches to absolute
numbers in Insert Mode (for context).

## Common motions for Python Lang

- `[[ / ]]` - Leap between function definitions in a large Django or FastAPI file.
- `f:` - quickly move to the end of `if`, `def` or `class`
