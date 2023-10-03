"use strict";
const { ipcRenderer, contextBridge } = require("electron");
const safeDOM = {
  append(parent, child) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent, child) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }
  }
};
function useLoading() {
  const className = `loaders-css__square-spin`;
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");
  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`;
  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    }
  };
}
const { appendLoading, removeLoading } = useLoading();
setTimeout(removeLoading, 100);
contextBridge.exposeInMainWorld("electron", {
  selectDirectory: async () => {
    const result = await ipcRenderer.invoke("select-directory");
    if (result.success) {
      return result.directory;
    }
    throw new Error(result.error);
  },
  loadConflictSources: (repoPath) => {
    return new Promise((resolve, reject) => {
      const onSuccess = (event, data) => {
        ipcRenderer.removeListener("load-conflict-sources-success", onSuccess);
        ipcRenderer.removeListener("load-conflict-sources-error", onError);
        resolve(data);
      };
      const onError = (event, error) => {
        ipcRenderer.removeListener("load-conflict-sources-success", onSuccess);
        ipcRenderer.removeListener("load-conflict-sources-error", onError);
        reject(error);
      };
      ipcRenderer.send("load-conflict-sources", repoPath);
      ipcRenderer.once("load-conflict-sources-success", onSuccess);
      ipcRenderer.once("load-conflict-sources-error", onError);
    });
  },
  joinPath: (...paths) => {
    return ipcRenderer.invoke("join-path", ...paths);
  },
  readFile: (filePath) => {
    return ipcRenderer.invoke("read-file", filePath);
  }
});
//# sourceMappingURL=index.js.map
