import { moment, TFile } from "obsidian";
import SongOfTheDayPlugin from "src/main";
import { Track } from "src/types/spotify";

/**
 * Sets the frontmatter metadata for the song note
 * @param plugin - The main plugin instance containing settings
 * @param file - The created note file to add metadata to
 * @param track - The Spotify track data to extract metadata from
 */
export async function setFrontmatter(
  plugin: SongOfTheDayPlugin,
  file: TFile,
  track: Track,
): Promise<void> {
  const artists = track.artists.map((a) => a.name);
  const coverImage = track.album.images[0].url;
  const createdDate = moment().format(plugin.settings.dateFormat);

  await plugin.app.fileManager.processFrontMatter(
    file,
    (frontmatter: Record<string, unknown>) => {
      frontmatter.title = track.name;
      frontmatter.artist = artists;
      frontmatter.album = track.album.name;
      frontmatter.release_date = track.album.release_date;
      frontmatter.date = createdDate;
      frontmatter.cover = coverImage;
      frontmatter.spotify_url = track.external_urls.spotify;
      frontmatter.spotify_id = track.id;
      frontmatter.duration_ms = track.duration_ms;
    },
  );
}
