import "obsidian";

declare module "obsidian" {
  interface App {
    setting: {
      open(): void;
      openTabById(id: string): void;
    };
  }
}
