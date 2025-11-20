import type SongOfTheDayPlugin from "src/main";
import type { SpotifyService } from "src/services/spotify";

import { moment, Notice, TFile, TFolder } from "obsidian";
import { SpotifyInputModal } from "src/ui/modal";
import { exampleTitle } from "src/utils/format";
import {
  createMockPlugin,
  createMockSpotifyService,
  mockFile,
  mockLeaf,
} from "test/fixtures/obsidian";
import { mockTrackId, mockTrackResponse } from "test/fixtures/spotify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CREATE_SONG_NOTE_ID, registerCreateSongNoteCommand } from ".";

vi.mock("../../ui/modal");

const mockTrackURI = `spotify:track:${mockTrackId}`;

/**
 *
 * @param plugin - The main plugin instance
 * @param input - Spotify track URL, URI, or track ID
 */
async function executeCommand(
  plugin: SongOfTheDayPlugin,
  input: string,
): Promise<void> {
  let capturedCallback: ((input: string) => Promise<void>) | null = null;

  vi.mocked(SpotifyInputModal).mockImplementation(function (
    this: unknown,
    _app: unknown,
    callback: (input: string) => Promise<void>,
  ) {
    capturedCallback = callback;

    return { open: vi.fn() } as unknown as SpotifyInputModal;
  } as never);

  registerCreateSongNoteCommand(plugin);

  const commandConfig = vi.mocked(plugin.addCommand).mock.calls[0][0];

  commandConfig.callback?.();

  await (capturedCallback as unknown as (input: string) => Promise<void>)(
    input,
  );
}

describe(CREATE_SONG_NOTE_ID, () => {
  let mockPlugin: SongOfTheDayPlugin;
  let mockService: SpotifyService;

  beforeEach(() => {
    mockService = createMockSpotifyService();
    mockPlugin = createMockPlugin({
      getSpotifyService: vi.fn(() => mockService),
    });
  });

  describe(registerCreateSongNoteCommand, () => {
    it("should register command with correct id and name", () => {
      registerCreateSongNoteCommand(mockPlugin);

      expect(mockPlugin.addCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          id: CREATE_SONG_NOTE_ID,
          name: "Create song note",
        }),
      );
    });

    it("should return early if service is not available", () => {
      vi.spyOn(mockPlugin, "getSpotifyService").mockImplementation(() => null);
      registerCreateSongNoteCommand(mockPlugin);

      const commandConfig = vi.mocked(mockPlugin.addCommand).mock.calls[0][0];

      commandConfig.callback?.();

      expect(SpotifyInputModal).not.toHaveBeenCalled();
    });

    it("should open modal when service is available", () => {
      const mockModalInstance = {
        open: vi.fn(),
      } as unknown as SpotifyInputModal;

      vi.mocked(SpotifyInputModal).mockImplementation(function () {
        return mockModalInstance;
      });

      registerCreateSongNoteCommand(mockPlugin);

      const commandConfig = vi.mocked(mockPlugin.addCommand).mock.calls[0][0];

      expect(commandConfig.callback).toBeDefined();
      commandConfig.callback?.();

      expect(mockPlugin.getSpotifyService).toHaveBeenCalledWith();
      expect(SpotifyInputModal).toHaveBeenCalledWith(
        mockPlugin.app,
        expect.any(Function),
      );
      expect(mockModalInstance.open).toHaveBeenCalledWith();
    });
  });

  describe("createSongNote", () => {
    beforeEach(() => {
      mockService = createMockSpotifyService({
        extractTrackId: vi.fn((input: string) =>
          input.includes("track") ? mockTrackId : null,
        ),
        getTrack: vi.fn(() => Promise.resolve(mockTrackResponse)),
      });

      vi.mocked(moment).mockReturnValue({
        format: vi.fn(() => "2024-01-01"),
      } as never);
    });

    it("should show error notice for invalid track ID", async () => {
      expect.hasAssertions();

      await executeCommand(mockPlugin, "invalid-input");

      expect(Notice).toHaveBeenCalledWith(
        "Invalid Spotify link or ID. Please provide a valid Spotify track URL, URI, or ID.",
      );
      expect(mockService.getTrack).not.toHaveBeenCalled();
    });

    it("should extract track ID and fetch track data", async () => {
      expect.hasAssertions();

      await executeCommand(mockPlugin, mockTrackURI);

      expect(mockService.extractTrackId).toHaveBeenCalledWith(mockTrackURI);
      expect(mockService.getTrack).toHaveBeenCalledWith(mockTrackId);
    });

    it("should create note file with correct path and content", async () => {
      expect.hasAssertions();

      await executeCommand(mockPlugin, mockTrackURI);

      expect(mockPlugin.app.vault.create).toHaveBeenCalledWith(
        `Music/${exampleTitle}.md`,
        expect.stringContaining(exampleTitle),
      );
    });

    it("should update frontmatter after creating note", async () => {
      expect.hasAssertions();

      await executeCommand(mockPlugin, mockTrackURI);

      expect(
        mockPlugin.app.fileManager.processFrontMatter,
      ).toHaveBeenCalledWith(mockFile, expect.any(Function));
    });

    it("should open created note in editor", async () => {
      expect.hasAssertions();

      await executeCommand(mockPlugin, mockTrackURI);

      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
    });

    it("should show success notice after creating note", async () => {
      expect.hasAssertions();

      await executeCommand(mockPlugin, mockTrackURI);

      expect(Notice).toHaveBeenCalledWith(`Created song note: ${exampleTitle}`);
    });

    it("should handle existing file", async () => {
      expect.hasAssertions();

      const existingFile = Object.assign(new TFile(), {
        path: "Music/test-song.md",
      });

      vi.spyOn(
        mockPlugin.app.vault,
        "getAbstractFileByPath",
      ).mockImplementation((_path: string) => existingFile);

      await executeCommand(mockPlugin, mockTrackURI);

      expect(Notice).toHaveBeenCalledWith(
        `Note already exists: ${exampleTitle}.md`,
      );
      expect(mockLeaf.openFile).toHaveBeenCalledWith(existingFile);
      expect(mockPlugin.app.vault.create).not.toHaveBeenCalled();
    });

    it("should create folder if it doesn't exist", async () => {
      expect.hasAssertions();

      vi.spyOn(
        mockPlugin.app.vault,
        "getAbstractFileByPath",
      ).mockImplementation((path: string) => {
        if (path === "Music") {
          return null;
        }

        return null;
      });

      await executeCommand(mockPlugin, mockTrackURI);

      expect(mockPlugin.app.vault.createFolder).toHaveBeenCalledWith("Music");
    });

    it("should not create folder if it exists", async () => {
      expect.hasAssertions();

      const existingFolder = Object.assign(new TFolder(), { path: "Music" });

      vi.spyOn(
        mockPlugin.app.vault,
        "getAbstractFileByPath",
      ).mockImplementation((path: string) => {
        if (path === "Music") {
          return existingFolder;
        }

        return null;
      });

      await executeCommand(mockPlugin, mockTrackURI);

      expect(mockPlugin.app.vault.createFolder).not.toHaveBeenCalled();
    });

    it("should handle API errors", async () => {
      expect.hasAssertions();

      vi.spyOn(mockService, "getTrack").mockRejectedValue(
        new Error("API Error"),
      );
      vi.spyOn(console, "error").mockImplementation(() => null);

      await executeCommand(mockPlugin, mockTrackURI);

      expect(Notice).toHaveBeenCalledWith("Error: API Error");
    });

    it("should handle non-Error exceptions", async () => {
      expect.hasAssertions();

      vi.spyOn(mockService, "getTrack").mockRejectedValue("String error");
      vi.spyOn(console, "error").mockImplementation(() => null);

      await executeCommand(mockPlugin, mockTrackURI);

      expect(Notice).toHaveBeenCalledWith("Error: String error");
    });
  });
});
