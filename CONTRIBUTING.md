# Contributing to Gemini Usage Tracker

## Before you start

This is an internal SAS IT project. If you're outside the SAS Technology team, please open an issue before writing any code.

## Branches

| Pattern                     | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `main`                      | Production-ready code — protected, no direct pushes |
| `feat/<short-description>`  | New features                                        |
| `fix/<short-description>`   | Bug fixes                                           |
| `chore/<short-description>` | Maintenance (deps, docs, tooling)                   |

## Development workflow

1. Create a branch from `main`
2. Make your changes
3. Ensure all checks pass locally (see below)
4. Open a pull request against `main`
5. At least one team member must approve before merging

## Local checks

Run these before pushing — CI will fail on any of them:

```bash
# Root formatting and markdown
npm run format:check
npm run markdownlint

# sveltekit-app (from sveltekit-app/)
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

Pre-commit hooks (Husky + lint-staged) auto-format staged files on every `git commit`, so formatting is usually handled for you.

## Commit messages

Use the imperative mood, present tense:

```text
Add division filter to overview page     ✓
Added division filter                    ✗
Adds division filter                     ✗
```

Keep the subject line under 72 characters. Add a body if the why is non-obvious.

## Pull requests

Use the PR template. Fill in every section — incomplete PRs will be sent back.

## Apps Script changes

After editing files under `apps-script/` (`Code.js`, `WebApp.js`, `Progress.html`, or `Fallback.html`):

```bash
clasp push
```

Then verify the deployed web app still responds correctly before opening a PR.

## Adding dependencies

- Prefer dependencies with active maintenance and small footprints
- Run `npm audit` after installing — the CI pipeline blocks on moderate severity or above
- Update `package-lock.json` by committing the result of `npm install`

## Questions

Open a GitHub issue with the `question` label or ping the SAS Technology team directly.
