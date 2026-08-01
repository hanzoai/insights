# Insights Elements

[![MIT License](https://img.shields.io/badge/License-MIT-red.svg?style=flat-square)](https://opensource.org/licenses/MIT)

The design system. Please see [Insights Storybook](https://storybook.dev.insights.dev/).

Consumed from source, never from a build. Every resolver in the repo maps the
package name onto `src/`:

| Resolver   | Mapping                                                        |
| ---------- | -------------------------------------------------------------- |
| TypeScript | `tsconfig.json` `paths` → `@hanzo/elements/src/index`          |
| esbuild    | the same `tsconfig.json`, passed through by `common/esbuilder` |
| Jest       | `frontend/jest.config.ts` `moduleNameMapper`                   |
| Vite       | `frontend/vite.config.ts` `resolve.alias`                      |
| Storybook  | `common/storybook/webpack.config.js` `resolve.alias`           |

So there is nothing to build here and no `dist/` to emit into: a bundle would be
unreachable, and the declaration emit would only duplicate `typescript:check`.
Types are checked once, repo-wide, by the CI job that runs `kea-typegen` first —
these components sit in the same graph as the app, so they need the generated
`*LogicType` files that only that lane produces.

The package is not published; `products/*` depend on it as `workspace:*`.
