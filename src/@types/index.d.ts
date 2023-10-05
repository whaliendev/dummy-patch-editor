export {};

declare global {
  interface Window {
    electron: {
      selectDirectory: () => Promise<string>;
      loadConflictSources: (repoPath: string) => Promise<string[]>;
      joinPath: (...paths: string[]) => Promise<string>;
      readFile: (filePath: string) => Promise<string>;
    }
  }
}
