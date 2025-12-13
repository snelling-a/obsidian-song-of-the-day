import SongOfTheDayPlugin from "main";
import { createMockPlugin } from "test/fixtures/plugin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerCommands } from "./index";

vi.mock(import("./create-song-note"), () => ({
  registerCreateSongNoteCommand: vi.fn<typeof import("./create-song-note").registerCreateSongNoteCommand>(),
}));

describe(registerCommands, () => {
  let mockPlugin: SongOfTheDayPlugin;

  beforeEach(() => {
    mockPlugin = createMockPlugin();
  });

  it("should register all commands with the plugin", async () => {
    const { registerCreateSongNoteCommand } = await import("./create-song-note");

    registerCommands(mockPlugin);

    expect(registerCreateSongNoteCommand).toHaveBeenCalledWith(mockPlugin);
  });
});
