# actions/checkout may leak GitHub credentials

The popular [`actions/checkout`](https://github.com/actions/checkout) GitHub
Action can unintentionally expose workflow credentials by saving them in the
`.git/config` file.

By default, it stores a copy of the workflow's credential (either the default
`secrets.GITHUB_TOKEN` or a custom one) in the checked-out repository's
`.git/config`.

This is problematic because CI workflows often archive and upload the repository
as a workflow artifact. A team at Palo Alto Networks discovered that many
projects inadvertently leak credentials this way.

GitHub is aware of this and considers it intentional behavior, which is
concerning. To prevent credentials from being added to your `.git/config`,
GitHub suggests running actions/checkout with the following configuration:

```yml
uses: actions/checkout@v4
  with:
    persist-credentials: false
```

Mitigate this risk by explicitly setting `persist-credentials: false` when using
the action. This ensures sensitive information isn't accidentally leaked through
artifact uploads.

Also, consider using [zizmor](https://github.com/woodruffw/zizmor) to scan your GitHub Actions
workflows for potential credential leaks.

## References

- [Palo Alto Networks Blog Post](https://unit42.paloaltonetworks.com/github-repo-artifacts-leak-tokens/)
- [zizmor would have caught the Ultralytics workflow vulnerability](https://blog.yossarian.net/2024/12/06/zizmor-ultralytics-injection)
