/* eslint-disable @typescript-eslint/no-useless-constructor */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Mock implementation of the Obsidian API for testing.
 * Only includes the parts of the API that are used in testable code.
 */

import { vi } from "vitest";

export const Notice = vi.fn(function (this: { hide: () => void }) {
  this.hide = vi.fn();
}) as unknown as new (
  message: string,
  duration?: number,
) => {
  hide: () => void;
};

export interface App {
  fileManager: {
    processFrontMatter: (
      file: unknown,
      callback: (frontmatter: Record<string, unknown>) => void,
    ) => Promise<void>;
  };
  setting: {
    open: () => void;
    openTabById: (id: string) => void;
  };
  vault: {
    create: (path: string, content: string) => Promise<TFile>;
    createFolder: (path: string) => Promise<void>;
    getAbstractFileByPath: (path: string) => null | TFile | TFolder;
  };
  workspace: {
    getLeaf: () => {
      openFile: (file: TFile) => Promise<void>;
    };
  };
}

export class TFile {
  path: string;

  constructor(path?: string) {
    this.path = path ?? "";
  }
}

export class TFolder {
  path: string;

  constructor(path?: string) {
    this.path = path ?? "";
  }
}

export class Modal {
  app: App;
  contentEl = {
    createEl: vi.fn(),
    empty: vi.fn(),
  };

  constructor(app: App) {
    this.app = app;
  }

  close() {}
  onClose() {}
  onOpen() {}
  open() {}
}

export class Setting {
  constructor(_containerEl: unknown) {}

  addButton(_callback: (btn: unknown) => void) {
    return this;
  }

  addText(_callback: (text: unknown) => void) {
    return this;
  }

  setDesc(_desc: string) {
    return this;
  }

  setName(_name: string) {
    return this;
  }
}

export const displayTooltip = vi.fn();

export const moment = vi.fn();

export const normalizePath = (path: string) => path;

export interface RequestUrlResponse {
  arrayBuffer: ArrayBuffer;
  headers: Record<string, string>;
  json: unknown;
  status: number;
  text: string;
}

export const requestUrl = vi.fn();
