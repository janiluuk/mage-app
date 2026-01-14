# Automated Release Workflow

This document describes the automated release workflow for the Mage AI Studio Frontend.

## Overview

The project uses GitHub Actions to automatically create releases with version bumping and changelog generation whenever changes are merged to the `main` branch.

## Workflow Trigger

The release workflow is triggered automatically on every push to the `main` branch. This typically happens when:
- A pull request is merged to main
- A direct commit is pushed to main

## Version Bumping Strategy

The workflow uses **Conventional Commits** to determine the type of version bump:

### Version Bump Rules

1. **Major version bump** (e.g., 1.0.0 → 2.0.0):
   - Commit message contains `BREAKING CHANGE:` in the body or footer
   - Commit message has `!` after the type/scope (e.g., `feat!:` or `feat(api)!:`)

2. **Minor version bump** (e.g., 1.0.0 → 1.1.0):
   - Commit message starts with `feat:` or `feature:`
   - Examples: `feat: add new video editor`, `feature(ui): implement dark mode`

3. **Patch version bump** (e.g., 1.0.0 → 1.0.1):
   - All other commits (fixes, chores, docs, etc.)
   - Examples: `fix: resolve upload bug`, `chore: update dependencies`

### Conventional Commit Format

```
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

**Common types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (white-space, formatting)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or correcting tests
- `chore`: Changes to build process or auxiliary tools

## Changelog Generation

The workflow automatically generates a changelog by categorizing commits:

### Changelog Categories

1. **✨ Features**: Commits starting with `feat:` or `feature:`
2. **🐛 Bug Fixes**: Commits starting with `fix:` or `bugfix:`
3. **📚 Documentation**: Commits starting with `docs:`
4. **🔧 Chores & Maintenance**: Commits with types like `chore:`, `refactor:`, `style:`, `test:`, `perf:`, `ci:`
5. **Other Changes**: Any commits that don't match the above patterns

Each commit in the changelog includes:
- The commit message
- The short commit hash

The changelog also includes a link to view the full diff between releases on GitHub.

## Workflow Steps

1. **Checkout**: Fetches the entire repository history
2. **Setup Node.js**: Configures Node.js 20 environment
3. **Configure Git**: Sets up git user for automated commits
4. **Install Dependencies**: Installs npm packages
5. **Determine Version Bump**: Analyzes commit messages to determine version bump type
6. **Update package.json**: Updates version in package.json and package-lock.json
7. **Generate Changelog**: Creates formatted changelog from commits
8. **Commit Version Bump**: Commits the version bump with `[skip ci]` to avoid triggering CI
9. **Create Git Tag**: Creates a new git tag with the version
10. **Create GitHub Release**: Creates a GitHub release with the changelog

## Skipping Releases

If you want to merge changes to main without creating a release, include `[skip ci]` in your commit message or pull request title.

## Example Commit Messages

### Feature (Minor Bump)
```
feat: add video timeline scrubbing

Implement scrubbing functionality for the video timeline editor.
Users can now click and drag to navigate through video frames.
```

### Bug Fix (Patch Bump)
```
fix: resolve audio sync issue in preview

Fixed an issue where audio would desync from video during preview playback.
```

### Breaking Change (Major Bump)
```
feat!: redesign API authentication flow

BREAKING CHANGE: The authentication API has been completely redesigned.
All existing API tokens will need to be regenerated.
```

or

```
feat: migrate to new video processing engine

BREAKING CHANGE: The video processing API has changed. Projects created
with the old engine will need to be migrated.
```

## Manual Release Override

If you need to create a release manually or adjust the version:

1. Update the version in `package.json` manually
2. Create a tag: `git tag -a v1.2.3 -m "Release v1.2.3"`
3. Push the tag: `git push origin v1.2.3`
4. Create a release on GitHub manually using the tag

## Permissions

The workflow requires the following permissions:
- `contents: write` - To create releases, tags, and commit version bumps
- `pull-requests: write` - For potential future PR integration

## First Release

If no tags exist in the repository, the workflow will:
- Use `v0.0.0` as the starting point
- Include all commits in the changelog
- Create the first release based on the conventional commit rules

## Troubleshooting

### Workflow Fails on Push
- Check that the repository has the correct permissions
- Ensure the commit messages follow conventional commit format
- Review the workflow logs in GitHub Actions

### Version Not Bumping as Expected
- Verify commit message format
- Check that commits use conventional commit types (`feat:`, `fix:`, etc.)
- Review the "Determine version bump" step logs

### Duplicate Releases
- If the workflow is triggered multiple times, it may create duplicate tags
- Delete duplicate tags: `git tag -d v1.2.3 && git push origin :refs/tags/v1.2.3`

## Best Practices

1. **Use Conventional Commits**: Always format commit messages according to the conventional commits specification
2. **Squash Merge PRs**: When merging PRs, use squash merge and format the commit message properly
3. **Review Changelog**: After a release, review the generated changelog to ensure it's accurate
4. **Semantic Versioning**: Follow semantic versioning principles (MAJOR.MINOR.PATCH)
5. **Breaking Changes**: Clearly document breaking changes in commit messages

## Related Links

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
