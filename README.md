# Song of the Day

An Obsidian plugin that creates formatted song notes from Spotify links, complete with metadata and album art.

## Features

- **Quick song note creation** from Spotify URLs, URIs, or track IDs
- **Automatic metadata extraction** including:
  - Song title and artist(s)
  - Album and release date
  - Album cover art (external URL)
  - Spotify link
- **Formatted frontmatter** with wikilinks for artists and dates
- **Configurable output** folder and file naming conventions
- **Duplicate detection** - opens existing notes instead of creating duplicates

## Installation

### Using BRAT (Recommended for Beta Testing)

Until this plugin is published to the Obsidian community plugin store, the easiest way to install it is using [BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tool):

1. Install BRAT from Obsidian's Community Plugins (Settings → Community Plugins → Browse)
2. Enable BRAT in your installed plugins
3. Open the command palette (`Cmd/Ctrl + P`) and run **"BRAT: Add a beta plugin for testing"**
4. Enter this repository URL: `https://github.com/snelling-a/obsidian-song-of-the-day`
5. BRAT will automatically download and install the plugin
6. Reload Obsidian and enable "Song of the Day" in Settings → Community Plugins

BRAT will also notify you when updates are available.

### From Community Plugins (Coming Soon)

Once published to the Obsidian community plugin store, you can install it directly from Obsidian's Settings → Community Plugins.

### Manual Installation

#### Option 1: Download Release (Recommended)

1. Download the latest release from the [Releases page](https://github.com/snelling-a/obsidian-song-of-the-day/releases)
2. Extract the zip file
3. Copy the entire `obsidian-song-of-the-day` folder to your vault's `.obsidian/plugins/` directory
4. Reload Obsidian
5. Enable the plugin in Settings → Community Plugins

#### Option 2: Build from Source

1. Clone this repository into your vault's `.obsidian/plugins/` folder:

   ```bash
   cd /path/to/your/vault/.obsidian/plugins/
   git clone https://github.com/snelling-a/obsidian-song-of-the-day.git
   cd obsidian-song-of-the-day
   ```

2. Install dependencies and build:

   ```bash
   npm install
   npm run build
   ```

3. Copy the built files from `dist/` to the plugin directory:

   ```bash
   cp dist/* .
   ```

4. Reload Obsidian and enable the plugin in Settings → Community Plugins

**Tip for active development:** Set `PATH_TO_DEV_VAULT` in a `.env` file to automatically build to your vault:

```bash
cp .env.example .env
# Edit .env and set: PATH_TO_DEV_VAULT=/path/to/your/vault
npm run dev  # Now builds directly to your vault
```

See the [CONTRIBUTING.md](./docs/CONTRIBUTING.md) guide for more details on the development workflow.

## Setup

### 1. Get Spotify API Credentials

To use this plugin, you need to create a Spotify application:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account

   <!-- Screenshot placeholder: Spotify Developer Dashboard login page -->

   ![Spotify Developer Dashboard](./.github/screenshots/spotify-dashboard-login.png)

3. Click "Create app"

   <!-- Screenshot placeholder: Create app button on dashboard -->

   ![Create App Button](./.github/screenshots/spotify-create-app-button.png)

4. Fill in the required fields:
   - **App name**: "Obsidian Song of the Day" (or any name you prefer)
   - **App description**: "Personal use for Obsidian plugin"
   - **Redirect URI**: `https://example.com/callback` (required but not used)
   - **API/SDKs**: Select "Web API"

   <!-- Screenshot placeholder: App creation form -->

   ![App Creation Form](./.github/screenshots/spotify-app-form.png)

5. Accept the terms and create the app
6. On your app's page, click "Settings"
7. Copy your **Client ID** and **Client Secret**

   <!-- Screenshot placeholder: Settings page showing Client ID and Client Secret -->

   ![Client Credentials](./.github/screenshots/spotify-credentials.png)

### 2. Configure the Plugin

1. Open Obsidian Settings → Song of the Day
2. Paste your **Client ID** and **Client Secret**
3. (Optional) Customize the output folder path (default: `art_culture/music/song_of_the_day`)
4. (Optional) Choose your preferred file naming format:
   - **snake_case**: `i_would_die_4_u.md`
   - **kebab-case**: `i-would-die-4-u.md`
   - **Original**: `I Would Die 4 U.md`

## Usage

### Create a Song Note

1. Open the Command Palette (`Cmd/Ctrl + P`)
2. Search for "Create Song of the Day Note"
3. Paste a Spotify link, URI, or track ID:
   - URL: `https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6`
   - URI: `spotify:track:6rqhFgbbKwnb9MLmUQDhG6`
   - Track ID: `6rqhFgbbKwnb9MLmUQDhG6`
4. Press Enter or click "Create"

The plugin will:

- Fetch the track data from Spotify
- Create a new note in your configured folder
- Open the note for editing

### Example Output

Here's what a generated song note looks like (using default settings):

```markdown
---
title: I Would Die 4 U
artist:
  - Prince
  - "Prince and The Revolution"
album: Purple Rain
release_date: 1984-06-25
date: 2024-01-15
cover: https://i.scdn.co/image/ab67616d0000b273...
spotify_url: https://open.spotify.com/track/3QszJeuSyyZQmD9pY1tqpo
spotify_id: 3QszJeuSyyZQmD9pY1tqpo
duration_ms: 169320
---

# I Would Die 4 U
```

The frontmatter can be customized further using your vault's CSS or by processing it with other plugins (like Dataview or Templater).

### Template Variables

You can customize the note template using these variables:

| Variable           | Description                                 | Example Output                                          |
| ------------------ | ------------------------------------------- | ------------------------------------------------------- |
| `{{title}}`        | Track name                                  | `I Would Die 4 U`                                       |
| `{{artist}}`       | Artist(s), comma-separated                  | `Prince, Prince and The Revolution`                     |
| `{{album}}`        | Album name                                  | `Purple Rain`                                           |
| `{{release_date}}` | Album release date (formatted per settings) | `1984-06-25`                                            |
| `{{spotify_url}}`  | Spotify track URL                           | `https://open.spotify.com/track/3QszJeuSyyZQmD9pY1tqpo` |

> **Note:** The frontmatter also includes auto-generated fields (`date`, `cover`, `spotify_id`, `duration_ms`) that are not available as template variables. These fields are automatically added to every note and cannot be customized in the template.

**Example custom template:**

```markdown
# {{title}}

**Artist**: {{artist}}
**Album**: {{album}}
**Released**: {{release_date}}

[Listen on Spotify]({{spotify_url}})

## Notes
```

This template would generate a more structured note with labeled sections.

## Settings

| Setting               | Description                                 | Default           | Options                                |
| --------------------- | ------------------------------------------- | ----------------- | -------------------------------------- |
| Spotify Client ID     | Your Spotify app's client ID (required)     | (empty)           | -                                      |
| Spotify Client Secret | Your Spotify app's client secret (required) | (empty)           | -                                      |
| Output Folder         | Where to create song notes                  | (empty)           | Any folder path in your vault          |
| Note Name Format      | How to format file names                    | `Original`        | `Original`, `snake_case`, `kebab-case` |
| Date Format           | Date format for frontmatter                 | `YYYY-MM-DD`      | Any moment.js format string            |
| Note Template         | Custom template for note body               | `# {{title}}\n\n` | Text with template variables           |

## Support

If you encounter issues or have feature requests:

1. Check the [existing issues](https://github.com/snelling-a/obsidian-song-of-the-day/issues)
2. Create a new issue:
   - [Report a bug](https://github.com/snelling-a/obsidian-song-of-the-day/issues/new?template=bug_report.yml)
   - [Request a feature](https://github.com/snelling-a/obsidian-song-of-the-day/issues/new?template=feature_request.yml)
3. Include your Obsidian version and error messages if applicable

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for:

- Development setup instructions
- Code guidelines and project structure
- Commit message format
- Pull request process

## Roadmap

See [ROADMAP.md](./docs/ROADMAP.md) for planned features and future improvements.

## License

This project is released into the public domain under [The Unlicense](https://unlicense.org). See the [UNLICENSE](./UNLICENSE) file for details.

## Credits

Built by [snelling-a](https://github.com/snelling-a)

Inspired by the [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
