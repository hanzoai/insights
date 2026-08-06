# Sampo

This directory stores pending release changesets for `insights-cli`.

Run from `cli/`:

```bash
sampo add --package cargo/insights-cli --bump patch --message "Describe the CLI change"
```

The release workflow consumes files in `cli/.sampo/changesets/`, updates
`cli/Cargo.toml`, `cli/Cargo.lock`, and `cli/CHANGELOG.md`, then commits the
release bump to `master`. The same approved `Release CLI` workflow runs
cargo-dist against that release commit, creates the `insights-cli/vX.Y.Z`
GitHub release, and publishes the npm package.

Do not run `sampo publish` or push `insights-cli/vX.Y.Z` tags manually for
`insights-cli`; cargo-dist publishing is owned by `Release CLI`.
