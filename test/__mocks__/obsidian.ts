import { vi } from "vitest";

/**
 * Re-export moment from the actual moment library.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/moment
 * @see https://momentjs.com/docs/
 */
export { default as moment } from "moment";

/**
 * Mock implementation of Obsidian's requestUrl function.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/requestUrl
 */
export const requestUrl = vi.fn();

/**
 * Mock implementation of Obsidian's AbstractInputSuggest class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/AbstractInputSuggest
 */
export abstract class AbstractInputSuggest<T> {
  close = vi.fn();

  open = vi.fn();

  /**
   *
   */
  constructor(
    public app: App,
    public inputEl: HTMLInputElement | HTMLTextAreaElement,
  ) {
    this.app = app;
    this.inputEl = inputEl;
  }
  abstract getSuggestions(inputStr: string): T[];

  abstract renderSuggestion(item: T, el: HTMLElement): void;
  abstract selectSuggestion(item: T): void;
}

/**
 * Mock implementation of Obsidian's TFolder class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/TFolder
 */
export class TFolder {
  children: (TFile | TFolder)[] = [];

  isRoot = vi.fn().mockReturnValue(false);

  /**
   *
   */
  constructor(public path: string) {}
}

/**
 * Mock implementation of Obsidian's FileManager class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/FileManager
 */
export class FileManager {
  getNewFileParent = vi.fn().mockReturnValue(new TFolder(""));
  processFrontMatter = vi
    .fn()
    .mockImplementation(
      (_file: TFile, fn: (frontmatter: Record<string, unknown>) => void) => {
        const frontmatter = {};
        fn(frontmatter);

        return Promise.resolve();
      },
    );
}

/**
 * Mock implementation of Obsidian's MetadataCache class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/MetadataCache
 */
export class MetadataCache {
  getCache = vi.fn().mockReturnValue(null);
  getFileCache = vi.fn().mockReturnValue(null);
  off = vi.fn();
  on = vi.fn();
  trigger = vi.fn();
}

/**
 * Mock implementation of Obsidian's TFile class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/TFile
 */
export class TFile {
  stat = {
    ctime: Date.now(),
    mtime: Date.now(),
    size: 0,
  };

  /**
   *
   */
  constructor(
    public path: string,
    public name: string = path.split("/").pop() || "",
    public basename: string = name.split(".")[0] || "",
    public extension: string = name.split(".").pop() || "",
  ) {}
}

/**
 * Mock implementation of Obsidian's Vault class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/Vault
 */
export class Vault {
  adapter = {
    exists: vi.fn().mockResolvedValue(false),
    mkdir: vi.fn().mockResolvedValue(undefined),
  };

  cachedRead = vi.fn().mockResolvedValue("");
  create = vi.fn().mockImplementation((path: string, _content: string) => {
    return Promise.resolve(new TFile(path));
  });

  delete = vi.fn().mockResolvedValue(undefined);
  getAbstractFileByPath = vi.fn().mockReturnValue(null);
  getAllLoadedFiles = vi.fn().mockReturnValue([]);
  getFiles = vi.fn().mockReturnValue([]);
  getMarkdownFiles = vi.fn().mockReturnValue([]);
  modify = vi.fn().mockResolvedValue(undefined);
  read = vi.fn().mockResolvedValue("");
  process = vi
    .fn()
    .mockImplementation((file: TFile, fn: (content: string) => string) => {
      return this.read(file)
        .then(fn)
        .then((content: string) => {
          return this.modify(file, content);
        });
    });

  rename = vi.fn().mockResolvedValue(undefined);
}

/**
 * Mock implementation of Obsidian's Workspace class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/Workspace
 */
export class Workspace {
  activeLeaf = null;
  getActiveFile = vi.fn().mockReturnValue(null);
  getLeaf = vi.fn().mockReturnValue({
    open: vi.fn().mockResolvedValue(undefined),
    openFile: vi.fn().mockResolvedValue(undefined),
  });

  leftSplit = null;

  off = vi.fn();
  on = vi.fn();
  rightSplit = null;
  rootSplit = null;
  trigger = vi.fn();
}

/**
 * Mock implementation of Obsidian's App class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/App
 */
export class App {
  fileManager = new FileManager();
  metadataCache = new MetadataCache();
  plugins = {
    enabledPlugins: new Set<string>(),
    plugins: {},
  };

  vault = new Vault();
  workspace = new Workspace();
}

/**
 * Mock implementation of Obsidian's Modal class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/Modal
 */
export class Modal {
  app: App;
  close = vi.fn();
  contentEl: HTMLElement;
  modalEl: HTMLElement;

  onClose = vi.fn();

  onOpen = vi.fn();
  open = vi.fn();
  titleEl: HTMLElement;

  /**
   *
   */
  constructor(app: App) {
    this.app = app;
    this.contentEl = document.createElement("div");
    this.titleEl = document.createElement("div");
    this.modalEl = document.createElement("div");
  }
}

/**
 * Mock implementation of Obsidian's Notice class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/Notice
 */
export const Notice = vi.fn(function (
  this: { hide: ReturnType<typeof vi.fn>; message: string; duration?: number },
  message: string,
  duration?: number,
) {
  this.message = message;
  this.duration = duration;
  this.hide = vi.fn();
}) as unknown as new (message: string, duration?: number) => {
  duration?: number;
  hide: ReturnType<typeof vi.fn>;
  message: string;
};

/**
 * Mock implementation of Obsidian's Plugin class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/Plugin
 */
export class Plugin {
  addCommand = vi.fn();
  addSettingTab = vi.fn();

  app: App = new App();
  loadData = vi.fn().mockResolvedValue({});
  manifest = {
    author: "Test Author",
    authorUrl: "",
    description: "Test plugin",
    id: "test-plugin",
    isDesktopOnly: false,
    minAppVersion: "0.0.0",
    name: "Test Plugin",
    version: "1.0.0",
  };

  registerDomEvent = vi.fn();
  registerEvent = vi.fn();
  registerInterval = vi.fn();
  saveData = vi.fn().mockResolvedValue(undefined);
}

/**
 * Mock implementation of Obsidian's PluginSettingTab class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/PluginSettingTab
 */
export class PluginSettingTab {
  display = vi.fn();

  hide = vi.fn();

  /**
   *
   */
  constructor(
    public app: App,
    public plugin: Plugin,
  ) {}
}

/**
 * Mock implementation of Obsidian's Setting class.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/Setting
 */
export class Setting {
  addButton = vi.fn().mockReturnThis();
  addDropdown = vi.fn().mockReturnThis();
  addExtraButton = vi.fn().mockReturnThis();
  addMomentFormat = vi.fn().mockReturnThis();

  addSearch = vi.fn().mockReturnThis();

  addSlider = vi.fn().mockReturnThis();
  addText = vi.fn().mockReturnThis();
  addTextArea = vi.fn().mockReturnThis();
  addToggle = vi.fn().mockReturnThis();
  controlEl: HTMLElement;
  descEl: HTMLElement;
  nameEl: HTMLElement;
  setClass = vi.fn().mockReturnThis();
  setDesc = vi.fn().mockReturnThis();
  setDisabled = vi.fn().mockReturnThis();
  setName = vi.fn().mockReturnThis();
  settingEl: HTMLElement;
  setTooltip = vi.fn().mockReturnThis();
  then = vi.fn().mockReturnThis();

  /**
   *
   */
  constructor(public containerEl: HTMLElement) {
    this.settingEl = document.createElement("div");
    this.nameEl = document.createElement("div");
    this.descEl = document.createElement("div");
    this.controlEl = document.createElement("div");
  }
}

/**
 * Mock implementation of normalizePath.
 *
 * @see https://docs.obsidian.md/Reference/TypeScript+API/normalizePath
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}
