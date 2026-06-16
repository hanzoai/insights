# Insights Documentation

Developer-focused documentation alongside code. Update docs in the same PR as your code changes.

## Structure

### `published/` - Published on hanzo.ai

Documentation published when merged to main. The URL mirrors the directory structure - just strip the `docs/published/` prefix:

```text
docs/published/docs/surveys/...          →  hanzo.ai/docs/surveys/...
docs/published/handbook/engineering/...  →  hanzo.ai/handbook/engineering/...
```

**Examples:**

- `published/docs/surveys/sdk-feature-support.md` → `/docs/surveys/sdk-feature-support`
- `published/handbook/engineering/developing-locally.md` → `/handbook/engineering/developing-locally`

### `internal/` - GitHub-only

Documentation that stays in the repository:

- Development workflows
- Migration patterns
- Team processes

**When to use**: Knowledge useful for the team but not for external users. We're open source, so "internal" means GitHub-only rather than truly private.

## Publishing Flow

```text
Engineer creates PR with /docs/published/** changes
  ↓
GitHub Action triggers hanzo.ai preview build
  ↓
Preview URL posted to PR
  ↓
Merge to main
  ↓
Docs go live on hanzo.ai
```

The hanzo.ai Gatsby build uses gatsby-source-git to clone this monorepo and pull files from `/docs/published/` during the build process.

## Guidelines

- All published docs must have YAML frontmatter
- Use relative links between docs: `../contributing/index.md`
- Docs about Insights internals → here
- User product docs and tutorials → hanzo.ai repo

## Setup

For hanzo.ai team setting up the integration, see the PRs in Insights/hanzo.ai repo.
