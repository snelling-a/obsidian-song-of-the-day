# Contributing to Song of the Day

<!--toc:start-->

- [Contributing to Song of the Day](#contributing-to-song-of-the-day)
  - [Development Setup](#development-setup)
    - [Prerequisites](#prerequisites)
    - [Getting Started](#getting-started)
    - [Building](#building)
  - [Project Structure](#project-structure)
  - [Tech Stack](#tech-stack)
  - [Code Guidelines](#code-guidelines)
  - [Commit Message Format](#commit-message-format)
    - [Types](#types)
    - [Examples](#examples)
  - [Release Process](#release-process)
    - [How It Works](#how-it-works)
    - [Manual Release Testing](#manual-release-testing)
  - [Testing](#testing)
  - [Pull Request Process](#pull-request-process)
  - [Questions or Issues?](#questions-or-issues)
  - [License](#license)
  <!--toc:end-->

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Development Setup

### Prerequisites

- **Node.js v24.2.0** (specified in `.nvmrc`)
  - Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage Node versions
  - Run `nvm use` or `fnm use` in the project directory to automatically switch to the correct version
- npm package manager
- Obsidian for testing

### Getting Started

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/YOUR-USERNAME/obsidian-song-of-the-day.git
   cd obsidian-song-of-the-day
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file for automatic building to your dev vault:

   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and set your vault path:

   ```bash
   PATH_TO_DEV_VAULT=/Users/yourname/Documents/ObsidianVaults/TestVault
   ```

5. (Optional but recommended) Install hot-reload for automatic plugin reloading:

   ```bash
   npm run setup-hot-reload
   ```

   Then in Obsidian:
   - Reload Obsidian (`Ctrl/Cmd + R`)
   - Go to Settings → Community plugins
   - Enable "Hot-Reload"

### Building

```bash
npm run dev    # Watch mode - auto-builds to dev vault or dist/ directory
npm run build  # Production build - outputs to dist/ directory
```

**When `PATH_TO_DEV_VAULT` is set**, `npm run dev` will:

- Automatically create the plugin directory in your vault
- Build directly to your vault's plugin folder
- Copy `manifest.json` and `styles.css` to the vault
- Create a `.hotreload` marker file (for hot-reload plugin detection)
- Watch for changes and rebuild on save
- If hot-reload plugin is installed and enabled, your plugin will automatically reload
- Otherwise, manually reload Obsidian (`Ctrl/Cmd + R`) to see changes

**When `PATH_TO_DEV_VAULT` is not set**, `npm run dev` will:

- Build to the `dist/` directory
- Watch for changes and rebuild on save
- You'll need to manually copy files to your vault for testing

**Production builds** always output to `dist/` directory with minification enabled.

## Project Structure

```text
src/
├── main.ts                    # Plugin entry point (lifecycle only)
├── types.ts                   # TypeScript interfaces
├── settings.ts                # Settings interface and tab
├── commands/
│   ├── index.ts               # Command registration
│   └── create-song-note.ts    # Main song creation logic
├── services/
│   ├── spotify.ts             # Spotify API service
│   └── spotify-manager.ts     # Service instantiation helper
├── ui/
│   ├── modal.ts               # Input modal component
│   ├── folder-suggest.ts      # Folder picker autocomplete
│   └── template-suggest.ts    # Template variable autocomplete
├── utils/
│   └── format.ts              # Filename formatting helpers
└── constants/
    ├── settings.ts            # Default values and constants
    ├── template-variables.ts  # Template variable definitions
    └── css.ts                 # CSS constants

dist/                          # Build output (gitignored)
├── main.js                    # Bundled plugin code
├── manifest.json              # Generated plugin metadata
└── styles.css                 # Plugin styles

scripts/                       # Build and development scripts
├── esbuild.config.mjs         # Build configuration
├── generate-manifest.mjs      # Manifest generation from package.json
└── setup-hot-reload.mjs       # Hot-reload installer
```

The codebase follows the [AGENTS.md](../AGENTS.md) guidelines:

- `src/main.ts` is minimal (~55 lines) - focused on plugin lifecycle
- Code is split into focused modules (all under 200 lines)
- Clear separation of concerns (commands, services, UI, settings, utils)

## Tech Stack

- TypeScript
- Obsidian API
- Spotify Web API (Client Credentials Flow)
- esbuild for bundling

## Code Guidelines

Please follow the coding conventions outlined in [AGENTS.md](../AGENTS.md):

- Code should be self-documenting; no inline comments unless absolutely necessary
- Use block comments to document functions with JSDoc-style descriptions

## Commit Message Format

This project uses [semantic-release](https://semantic-release.gitbook.io) with [conventional commits](https://www.conventionalcommits.org/) to automate versioning and releases.

Follow the Conventional Commits specification:

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` - New feature (triggers minor version bump)
- `fix:` - Bug fix (triggers patch version bump)
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependencies

### Examples

```bash
git commit -m "feat: add lyrics fetching from Genius"
git commit -m "fix: resolve duplicate note detection issue"
git commit -m "docs: update installation instructions"
git commit -m "feat!: redesign settings interface" # Breaking change (major version)
```

## Release Process

Releases are automated via GitHub Actions when:

- Pull requests are merged to the `main` branch
- Commits are pushed directly to the `main` branch

### How It Works

1. **Commit Analysis** - Semantic-release analyzes your commit messages
2. **Version Bump** - Determines the next version based on commit types:
   - `fix:` → patch version (1.0.0 → 1.0.1)
   - `feat:` → minor version (1.0.0 → 1.1.0)
   - `BREAKING CHANGE:` → major version (1.0.0 → 2.0.0)
3. **Changelog Generation** - Creates/updates CHANGELOG.md
4. **Build** - Compiles the plugin to `dist/`
5. **File Updates** - Updates package.json and manifest.json
6. **Git Commit** - Commits the version changes with `[skip ci]`
7. **GitHub Release** - Creates a release with `main.js`, `manifest.json`, and `styles.css` from `dist/`

**Note:** Only commits with conventional commit types (`feat:`, `fix:`, etc.) will trigger a release. Commits with types like `docs:`, `style:`, `refactor:`, `test:`, or `chore:` will not create a new release.

### Manual Release Testing

To test the release process locally without creating an actual release:

```bash
npx semantic-release --dry-run
```

## Code Quality Tools

This project uses several tools to maintain code quality:

- **TypeScript** - Type checking
- **ESLint** - Code linting with TypeScript and Perfectionist plugins
- **Prettier** - Code formatting
- **Markdownlint** - Markdown file linting
- **Knip** - Unused dependencies, exports, and files detection

### Knip

[Knip](https://knip.dev/) analyzes the codebase to find:

- Unused npm dependencies
- Unused exports (functions, types, etc.)
- Unused files

Run Knip:

```bash
npm run knip        # Check for issues
npm run knip:fix    # Automatically fix issues (removes unused code)
```

Knip can automatically:

- Remove unused dependencies from `package.json`
- Remove unused exports from files
- Remove unused type definitions
- Format files after fixes using Prettier

**Note:** File removal requires manual confirmation for safety.

## Testing

Before submitting a pull request:

1. Test your changes in a real Obsidian vault
2. Run the type checker: `npm run typecheck`
3. Run the linter: `npm run lint:check`
4. Run the formatter: `npm run format:check`
5. Run Knip: `npm run knip`
6. Or run all checks at once: `npm run check`

Fix any issues with:

```bash
npm run fix  # Runs typecheck, lint:fix, format:fix, markdown:fix, and knip:fix
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code guidelines
3. Write clear, conventional commit messages
4. Ensure all checks pass (`npm run check`)
5. Push your branch and create a pull request
6. Describe your changes and link any related issues
7. Wait for review and address any feedback

## Questions or Issues?

- Check [existing issues](https://github.com/snelling-a/obsidian-song-of-the-day/issues)
- Create a new issue:
  - [Report a bug](https://github.com/snelling-a/obsidian-song-of-the-day/issues/new?template=bug_report.yml)
  - [Request a feature](https://github.com/snelling-a/obsidian-song-of-the-day/issues/new?template=feature_request.yml)
- Include Obsidian version and error messages when reporting bugs

## License

By contributing, you agree that your contributions will be released into the public domain under [The Unlicense](./UNLICENSE).
