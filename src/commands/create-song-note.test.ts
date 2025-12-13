import type { App } from "obsidian";

import SongOfTheDayPlugin from "main";
import { Notice } from "obsidian";
import { createMockApp } from "test/fixtures/app";
import {
  createMockTFile,
  createMockTFolder,
} from "test/fixtures/obsidian-helpers";
import { createMockPlugin } from "test/fixtures/plugin";
import {
  createMockSpotifyService,
  MockSpotifyService,
} from "test/fixtures/spotify-service";
import { mockSpotifyTrack } from "test/fixtures/spotify-track";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FIELD_REGISTRY } from "../constants/field-registry";
import { TEMPLATE_VARIABLES } from "../constants/template-variables";
import { SpotifyService } from "../services/spotify";
import { SpotifyInputModal } from "../ui/modal";
import { registerCreateSongNoteCommand } from "./create-song-note";

type CommandCallback = () => void;

function getFieldByKey(key: string): (typeof FIELD_REGISTRY)[number] {
  const field = FIELD_REGISTRY.find((fr) => fr.key === key);

  if (!field) {
    throw new Error(`Field ${key} not found`);
  }

  return field;
}

function getTemplateVariable(
  name: string,
): (typeof TEMPLATE_VARIABLES)[number] {
  const variable = TEMPLATE_VARIABLES.find((tv) => tv.name === name);

  if (!variable) {
    throw new Error(`Template variable ${name} not found`);
  }

  return variable;
}

vi.mock(import("../ui/modal"));

// eslint-disable-next-line vitest/prefer-import-in-mock -- TypeScript doesn't support import() with factory function here
vi.mock("../services/spotify", () => ({
  SpotifyService: vi.fn(),
}));

describe("create-song-note", () => {
  describe(registerCreateSongNoteCommand, () => {
    let mockPlugin: SongOfTheDayPlugin;
    let mockService: MockSpotifyService;
    let modalCallback: ((input: string) => void) | null = null;

    function getCommandCallback(): CommandCallback {
      const call = vi.mocked(mockPlugin.addCommand).mock.calls[0][0] as {
        callback: CommandCallback;
      };

      return call.callback;
    }

    function triggerCommand(input = "spotify:track:test123"): void {
      registerCreateSongNoteCommand(mockPlugin);
      getCommandCallback()();
      modalCallback?.(input);
    }

    beforeEach(() => {
      modalCallback = null;
      mockService = createMockSpotifyService();

      vi.mocked<typeof SpotifyInputModal>(SpotifyInputModal).mockImplementation(
        function (
          this: { open: ReturnType<typeof vi.fn> },
          _app: unknown,
          callback: (input: string) => void,
        ) {
          // eslint-disable-next-line vitest/prefer-spy-on -- Cannot spy on non-existent property
          this.open = vi.fn<() => void>();
          modalCallback = callback;

          return this;
        } as unknown as typeof SpotifyInputModal,
      );

      mockPlugin = createMockPlugin();
      vi.spyOn(mockPlugin, "addCommand");
      vi.spyOn(mockPlugin, "getSpotifyService").mockReturnValue(
        mockService as SpotifyService,
      );
      vi.spyOn(mockPlugin, "saveSettings").mockResolvedValue(undefined);
    });

    afterEach(() => {
      modalCallback = null;
    });

    it("should register a command with the plugin", () => {
      registerCreateSongNoteCommand(mockPlugin);

      expect(mockPlugin.addCommand).toHaveBeenCalledWith({
        callback: expect.any(Function),
        id: "create-song-note",
        name: "Create song note",
      });
    });

    it("should not open modal when no service available", () => {
      vi.spyOn(mockPlugin, "getSpotifyService").mockReturnValue(null);

      registerCreateSongNoteCommand(mockPlugin);
      getCommandCallback()();

      expect(SpotifyInputModal).not.toHaveBeenCalled();
    });

    it("should open modal when service is available", () => {
      registerCreateSongNoteCommand(mockPlugin);
      getCommandCallback()();

      expect(SpotifyInputModal).toHaveBeenCalledWith(
        mockPlugin.app,
        expect.any(Function),
      );
    });

    it("should show notice for invalid track ID", async () => {
      mockService = createMockSpotifyService({ trackId: null });
      vi.spyOn(mockPlugin, "getSpotifyService").mockReturnValue(
        mockService as SpotifyService,
      );

      triggerCommand("invalid-input");

      await vi.waitFor(() => {
        expect(Notice).toHaveBeenCalledWith(
          "Invalid Spotify link or ID. Provide a valid Spotify track URL, URI, or ID.",
        );
      });
    });

    it("should create note successfully", async () => {
      mockPlugin.app = createMockApp() as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(mockPlugin.app.vault.create).toHaveBeenCalledWith(
          "/Purple Rain.md",
          `# Purple Rain

`,
        );
      });

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Created note"),
      );
    });

    it("should open existing file instead of creating duplicate", async () => {
      mockPlugin.settings.outputFolder = "Music";
      const existingFile = createMockTFile("Music/Purple Rain.md");
      const mockOpenFile = vi
        .fn<() => Promise<void>>()
        .mockResolvedValue(undefined);
      const mockApp = createMockApp({ existingFile });
      mockApp.workspace.getLeaf.mockReturnValue({
        openFile: mockOpenFile,
      } as unknown as ReturnType<App["workspace"]["getLeaf"]>);
      mockPlugin.app = mockApp as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(Notice).toHaveBeenCalledWith(
          expect.stringContaining("Note already exists"),
        );
      });

      expect(mockOpenFile).toHaveBeenCalledWith(existingFile);
      expect(mockApp.vault.create).not.toHaveBeenCalled();
    });

    it("should create folder if it does not exist", async () => {
      mockPlugin.settings.outputFolder = "Music/Songs";
      const mockApp = createMockApp();
      mockPlugin.app = mockApp as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(mockPlugin.app.vault.create).toHaveBeenCalledWith(
          "Music/Songs/Purple Rain.md",
          `# Purple Rain

`,
        );
      });

      expect(mockApp.vault.createFolder).toHaveBeenCalledWith("Music/Songs");
    });

    it("should not create folder if it already exists", async () => {
      mockPlugin.settings.outputFolder = "Music/Songs";
      const existingFolder = createMockTFolder("Music/Songs");
      const mockApp = createMockApp({ existingFolder });
      mockPlugin.app = mockApp as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(mockPlugin.app.vault.create).toHaveBeenCalledWith(
          "Music/Songs/Purple Rain.md",
          `# Purple Rain

`,
        );
      });

      expect(mockApp.vault.createFolder).not.toHaveBeenCalled();
    });

    it("should handle folder creation error gracefully", async () => {
      const mockApp = createMockApp({
        createFolderError: new Error("Folder already exists"),
      });
      mockPlugin.app = mockApp as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(mockPlugin.app.vault.create).toHaveBeenCalledWith(
          "/Purple Rain.md",
          `# Purple Rain

`,
        );
      });
    });

    it("should rethrow non-folder-exists errors during folder creation", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const mockApp = createMockApp({
        createFolderError: new Error("Permission denied"),
      });
      mockPlugin.app = mockApp as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(Notice).toHaveBeenCalledWith("Error: Permission denied");
      });

      consoleSpy.mockRestore();
    });

    it("should add track to playlist when playlist ID is configured", async () => {
      mockPlugin.settings.playlistId = "test-playlist-id";
      mockPlugin.app = createMockApp() as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(mockService.addTrackToPlaylist).toHaveBeenCalledWith(
          "test-playlist-id",
          `spotify:track:${mockSpotifyTrack.id}`,
        );
      });
    });

    it("should not add track to playlist when not authenticated", async () => {
      mockPlugin.settings.playlistId = "test-playlist-id";
      mockService = createMockSpotifyService({ isAuthenticated: false });
      vi.spyOn(mockPlugin, "getSpotifyService").mockReturnValue(
        mockService as SpotifyService,
      );
      mockPlugin.app = createMockApp() as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(Notice).toHaveBeenCalledWith(
          "Not authenticated with Spotify. Authenticate in settings to add songs to playlist.",
        );
      });

      expect(mockService.addTrackToPlaylist).not.toHaveBeenCalled();
    });

    it("should not add duplicate track to playlist", async () => {
      mockPlugin.settings.playlistId = "test-playlist-id";
      mockPlugin.settings.addedTrackIds = [mockSpotifyTrack.id];
      mockPlugin.app = createMockApp() as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(Notice).toHaveBeenCalledWith("Song already in playlist");
      });

      expect(mockService.addTrackToPlaylist).not.toHaveBeenCalled();
    });

    it("should handle playlist API errors gracefully", async () => {
      mockPlugin.settings.playlistId = "test-playlist-id";
      mockPlugin.settings.addedTrackIds = [];
      mockService = createMockSpotifyService({
        addTrackError: new Error("API error"),
      });
      vi.spyOn(mockPlugin, "getSpotifyService").mockReturnValue(
        mockService as SpotifyService,
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      mockPlugin.app = createMockApp() as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(mockService.addTrackToPlaylist).toHaveBeenCalledWith(
          "test-playlist-id",
          `spotify:track:${mockSpotifyTrack.id}`,
        );
      });

      await vi.waitFor(() => {
        expect(Notice).toHaveBeenCalledWith(
          "Failed to add to playlist: API error",
        );
      });

      consoleSpy.mockRestore();
    });

    it("should handle non-Error playlist failures", async () => {
      mockPlugin.settings.playlistId = "test-playlist-id";
      mockPlugin.settings.addedTrackIds = [];
      mockService = createMockSpotifyService({ addTrackError: "string error" });
      vi.spyOn(mockPlugin, "getSpotifyService").mockReturnValue(
        mockService as SpotifyService,
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      mockPlugin.app = createMockApp() as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(mockService.addTrackToPlaylist).toHaveBeenCalledWith(
          "test-playlist-id",
          `spotify:track:${mockSpotifyTrack.id}`,
        );
      });

      await vi.waitFor(() => {
        expect(Notice).toHaveBeenCalledWith(
          "Failed to add to playlist: string error",
        );
      });

      consoleSpy.mockRestore();
    });

    it("should handle getTrack API errors", async () => {
      mockService = createMockSpotifyService({
        getTrackError: new Error("Track not found"),
      });
      vi.spyOn(mockPlugin, "getSpotifyService").mockReturnValue(
        mockService as SpotifyService,
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      triggerCommand();

      await vi.waitFor(() => {
        expect(Notice).toHaveBeenCalledWith("Error: Track not found");
      });

      consoleSpy.mockRestore();
    });

    it("should save track ID after adding to playlist", async () => {
      mockPlugin.settings.playlistId = "test-playlist-id";
      mockPlugin.settings.addedTrackIds = [];
      mockPlugin.app = createMockApp() as unknown as typeof mockPlugin.app;

      triggerCommand();

      await vi.waitFor(() => {
        expect(mockPlugin.settings.addedTrackIds).toContain(
          mockSpotifyTrack.id,
        );
      });

      expect(mockPlugin.saveSettings).toHaveBeenCalledWith();
    });
  });

  describe("generateNoteBody (via template variables)", () => {
    const mockPlugin = createMockPlugin();

    it("should replace title template variable", () => {
      const titleVariable = getTemplateVariable("title");
      const result = titleVariable.getValue(mockSpotifyTrack, mockPlugin);

      expect(result).toBe("Purple Rain");
    });

    it("should replace artist template variable", () => {
      const artistVariable = getTemplateVariable("artist");
      const result = artistVariable.getValue(mockSpotifyTrack, mockPlugin);

      expect(result).toBe("Prince, The Revolution");
    });

    it("should replace album template variable", () => {
      const albumVariable = getTemplateVariable("album");
      const result = albumVariable.getValue(mockSpotifyTrack, mockPlugin);

      expect(result).toBe("Purple Rain");
    });

    it("should replace release_date template variable", () => {
      const releaseDateVariable = getTemplateVariable("release_date");
      const result = releaseDateVariable.getValue(mockSpotifyTrack, mockPlugin);

      expect(result).toBe("1984-06-25");
    });

    it("should replace spotify_url template variable", () => {
      const spotifyUrlVariable = getTemplateVariable("spotify_url");
      const result = spotifyUrlVariable.getValue(mockSpotifyTrack, mockPlugin);

      expect(result).toBe(
        "https://open.spotify.com/track/5YAeJ0Cjg5yt2OYfGHYlOc",
      );
    });

    it("should replace spotify_id template variable", () => {
      const spotifyIdVariable = getTemplateVariable("spotify_id");
      const result = spotifyIdVariable.getValue(mockSpotifyTrack, mockPlugin);

      expect(result).toBe("5YAeJ0Cjg5yt2OYfGHYlOc");
    });

    it("should replace cover template variable", () => {
      const coverVariable = getTemplateVariable("cover");
      const result = coverVariable.getValue(mockSpotifyTrack, mockPlugin);

      expect(result).toBe("https://example.com/cover-large.jpg");
    });

    it("should replace duration template variable", () => {
      const durationVariable = getTemplateVariable("duration");
      const result = durationVariable.getValue(mockSpotifyTrack, mockPlugin);

      expect(result).toBe("8:18");
    });

    it("should replace duration_ms template variable", () => {
      const durationMsVariable = getTemplateVariable("duration_ms");
      const result = durationMsVariable.getValue(mockSpotifyTrack, mockPlugin);

      expect(result).toBe("498000");
    });
  });

  describe("setFrontmatter (via field registry)", () => {
    const mockPlugin = createMockPlugin();

    it("should have title field with correct getValue", () => {
      const titleField = getFieldByKey("title");

      expect(titleField.getValue(mockSpotifyTrack, mockPlugin)).toBe(
        "Purple Rain",
      );
    });

    it("should have artist field with correct getValue", () => {
      const artistField = getFieldByKey("artist");

      expect(artistField.getValue(mockSpotifyTrack, mockPlugin)).toBe(
        "Prince, The Revolution",
      );
    });

    it("should have album field with correct getValue", () => {
      const albumField = getFieldByKey("album");

      expect(albumField.getValue(mockSpotifyTrack, mockPlugin)).toBe(
        "Purple Rain",
      );
    });

    it("should have all fields enabled by default except duration", () => {
      const enabledByDefault = FIELD_REGISTRY.filter(
        (field) => field.defaultEnabled,
      );
      const disabledByDefault = FIELD_REGISTRY.filter(
        (field) => !field.defaultEnabled,
      );

      expect(enabledByDefault).toHaveLength(9);
      expect(disabledByDefault).toHaveLength(1);
      expect(disabledByDefault[0].key).toBe("duration");
    });

    it("should have all expected field keys", () => {
      const expectedKeys = [
        "title",
        "artist",
        "album",
        "release_date",
        "date",
        "cover",
        "spotify_url",
        "spotify_id",
        "duration_ms",
        "duration",
      ];

      const actualKeys = FIELD_REGISTRY.map((field) => field.key);

      expect(actualKeys).toStrictEqual(expectedKeys);
    });
  });
});
