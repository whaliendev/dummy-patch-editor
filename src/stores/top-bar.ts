import { acceptHMRUpdate, defineStore } from "pinia";

export const useTopBarStore = defineStore("topBar", {
  state: () => ({
    directory: '',
    source: '',
    target: '',
  }),
  actions: {
    async setDirectory(directory: string) {
      this.directory = directory;
    },
    async setSource(source: string) {
      this.source = source;
    },
    async setTarget(target: string) {
      this.target = target;
    },
  },
  persist: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useTopBarStore as any, import.meta.hot));
