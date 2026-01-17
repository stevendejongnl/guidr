# Contributing to Guidr

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with semantic-release for automated versioning and releases.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Version Bump | Example |
|------|-------------|--------------|---------|
| `feat` | New feature | **Minor** (0.x.0) | `feat: add timer pause functionality` |
| `fix` | Bug fix | **Patch** (0.0.x) | `fix: correct step duration calculation` |
| `perf` | Performance improvement | **Patch** (0.0.x) | `perf: optimize session state updates` |
| `refactor` | Code refactoring | **Patch** (0.0.x) | `refactor: simplify guide service logic` |
| `docs` | Documentation only | No release | `docs: update README installation steps` |
| `style` | Code style changes | No release | `style: format with prettier` |
| `test` | Adding/updating tests | No release | `test: add session service unit tests` |
| `chore` | Build/tooling changes | No release | `chore: update dependencies` |

### Breaking Changes

For **major** version bumps (x.0.0), include `BREAKING CHANGE:` in the commit body:

```bash
git commit -m "feat: redesign guide execution API

BREAKING CHANGE: Session.start() now requires duration parameter"
```

### Scopes (Optional)

Scopes help categorize commits:
- `domain` - Domain layer changes
- `ui` - UI/presentation changes
- `infra` - Infrastructure changes
- `ios` - iOS-specific changes
- `android` - Android-specific changes
- `ci` - CI/CD changes

Example:
```bash
git commit -m "feat(domain): add category hierarchy support"
```

## Examples

### Feature Addition (Minor Version Bump)
```bash
git commit -m "feat: add step reordering in guide editor

Allow users to drag and drop steps to reorder them.
Includes validation to ensure step order integrity."
```

### Bug Fix (Patch Version Bump)
```bash
git commit -m "fix: session timer not pausing correctly

The timer continued running after pause() was called.
Fixed by properly clearing the interval in pause method."
```

### Breaking Change (Major Version Bump)
```bash
git commit -m "refactor: change guide API structure

BREAKING CHANGE: Guide.getSteps() now returns Promise<Step[]>
instead of Step[]. Update all calls to use async/await."
```

### Documentation (No Release)
```bash
git commit -m "docs: add TestFlight installation guide"
```

## Automated Release Process

When you push to `main`:

1. **Semantic-release analyzes** commits since last release
2. **Determines version bump** based on commit types:
   - `feat` → Minor (0.1.0 → 0.2.0)
   - `fix` → Patch (0.1.0 → 0.1.1)
   - `BREAKING CHANGE` → Major (0.1.0 → 1.0.0)
3. **Generates CHANGELOG.md** from commit messages
4. **Builds Android APK** for distribution
5. **Creates GitHub Release** with APK
6. **Triggers TestFlight workflow** for iOS distribution
7. **Commits version changes** back to repo

## Pre-commit Checklist

Before committing:

- [ ] Code follows project style (run `npm run lint`)
- [ ] Tests pass (run `npm test`)
- [ ] TypeScript compiles (run `npm run typecheck`)
- [ ] Commit message follows conventional format
- [ ] Changes are properly scoped and described

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/add-timer-settings
```

### 2. Make Changes and Commit
```bash
# Make your changes
git add .
git commit -m "feat: add configurable timer settings"
```

### 3. Push and Create PR
```bash
git push -u origin feature/add-timer-settings
# Create PR on GitHub
```

### 4. After PR Merge
Semantic-release automatically:
- Determines version
- Creates release
- Builds and publishes IPA

## Issue Tracking

This project uses GitHub Projects for tracking work: https://github.com/users/stevendejongnl/projects/3

**Statuses**: Todo → In Progress → Done

### Workflow

1. **Before Starting Work**
   ```bash
   # Assign yourself to the issue
   gh issue edit <number> --add-assignee @me

   # Move to "In Progress"
   gh issue edit <number> --add-project "Guidr" --project-field "Status" --project-value "In Progress"
   ```

2. **During Development**
   - Keep ticket status updated
   - Link commits to the ticket (include issue number in commit message: `#123`)
   - Update ticket with progress notes if needed using `gh issue comment <number> --body "progress update"`

3. **After Completing Work**
   ```bash
   # Reference ticket in PR description (e.g., "Closes #123")
   # Move to "Done" when PR is merged (automatic if using "Closes #123")
   gh issue edit <number> --add-project "Guidr" --project-field "Status" --project-value "Done"
   ```

### Common Commands

```bash
# Assign yourself to an issue
gh issue edit 123 --add-assignee @me

# Update issue status
gh issue edit 123 --add-project "Guidr" --project-field "Status" --project-value "In Progress"
gh issue edit 123 --add-project "Guidr" --project-field "Status" --project-value "Done"

# Add a comment
gh issue comment 123 --body "Progress update: completed step 1"

# View issue details
gh issue view 123
```

### For Claude Code

When working on tickets:
- Always assign yourself to the ticket before starting work
- Update ticket status through the development lifecycle using gh CLI
- Include ticket references in commit messages (e.g., `feat: add timer #123`)
- Use gh CLI commands to keep the project board current

## Commit Message Tips

### ✅ Good Commit Messages
```bash
feat: add dark mode support
fix: resolve memory leak in session service
perf: optimize guide loading performance
refactor: extract timer logic to separate service
docs: update iOS build instructions
```

### ❌ Bad Commit Messages
```bash
update stuff
fix bug
changes
WIP
asdf
```

## Manual Release (Emergency)

If you need to trigger a release manually:

```bash
# Trigger workflow via GitHub UI
# Go to Actions → Release → Run workflow
```

Or create a commit that triggers a release:
```bash
git commit --allow-empty -m "fix: trigger release"
git push origin main
```

## Questions?

- Read [Conventional Commits spec](https://www.conventionalcommits.org/)
- Check [semantic-release docs](https://semantic-release.gitbook.io/)
- Open an issue if you need help

## Release Badge

Current version: ![GitHub Release](https://img.shields.io/github/v/release/stevendejongnl/guidr)
