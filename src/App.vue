<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as monaco from 'monaco-editor';
import { useDark } from '@vueuse/core';
import EditorNotification from './components/EditorNotification.vue';
import FileList from './components/FileList.vue';
import { useTopBarStore } from './stores/top-bar';
import { findConflictBlocks, getConflictBlockDecorations } from './utils/conflicts';
import { postMergeScenario, getResolution } from './api/mergebot'
import type { MergeScenarioPayload, ResolutionVO, ResolutionPayload } from './api/mergebot'

const topBarStore = useTopBarStore();

/// dark theme
const isDark = useDark();
const toggleDark = () => {
  isDark.value = !isDark.value;
  editor.updateOptions({ theme: isDark.value ? 'vs-dark' : 'vs-light' });
};

/// load repo
// indicator for left panel FileList component
const projectSelected = ref(false);
// conflicts loading status
const conflictSources = ref<Array<string>>([]);
// indicator for left panel FileList component loading status
const isLoading = ref(false);
const selectDirectory = async () => {
  try {
    const directory = await window.electron.selectDirectory();
    console.log(directory);
    topBarStore.setDirectory(directory);
    projectSelected.value = true;

    isLoading.value = true;

    await loadConflictSources();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    triggerNotification(error.message);
    topBarStore.setDirectory('');
    projectSelected.value = false;
  }
};

const selectedFileContent = ref<Array<string>>([]);
const handleFileSelected = async (relativePath: string) => {
  try {
    const fullPath = await window.electron.joinPath(
      topBarStore.directory,
      relativePath
    );
    const content = await window.electron.readFile(fullPath);
    selectedFileContent.value = content;
    setEditorContent(content.join('\n'));

    highlightConflictBlocks(content);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    triggerNotification(`Error reading file: ${error.message}`);
  }

  let resolutionVO: ResolutionVO;
  try {
    const resolutionPayload = {
      ms: {
        ours: topBarStore.target,
        theirs: topBarStore.source,
      },
      path: topBarStore.directory,
      file: relativePath,
    } as ResolutionPayload;
    resolutionVO = getResolution(resolutionPayload);
  } catch (error) {
    triggerNotification(`Error post merge scenario: ${error.message}`);
  }

  // add decorations based on resolutionVO, unifying the format of patch and resolution
  // margin glyph across multiple lines, hover message,
};

/// post merge scenario
const postMergeScenarioHandler = async () => {
  try {
    const scenario = {
      ms: {
        ours: topBarStore.target,
        theirs: topBarStore.source,
      },
      path: topBarStore.directory,
    } as MergeScenarioPayload;
    postMergeScenario(scenario);
    triggerNotification('post merge scenario successfully!')
  } catch (error) {
    // console.error('Error post merge scenario:', error);
    triggerNotification(`Error post merge scenario: ${error.message}`);
  }
};

/// monaco editor
const editorContainer = ref<HTMLElement | null>(null);
const code = ref(
  [
    '#include <iostream>',
    '',
    'int main() {',
    '  std::cout << "Hello world!" << std::endl;',
    '  return 0;',
    '}',
  ].join('\n')
);

let editor: monaco.editor.IStandaloneCodeEditor;
onMounted(() => {
  isDark.value = false;
  if (!editorContainer.value) return;
  editor = monaco.editor.create(editorContainer.value, {
    value: code.value,
    language: 'cpp',
    theme: 'vs-light',
    formatOnPaste: true,
  });

  editor.onDidChangeModelContent(() => {
    code.value = editor.getValue();
  });

  if (topBarStore.directory) {
    projectSelected.value = true;
    isLoading.value = true;
    loadConflictSources();
  }

  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  editor?.dispose();

  window.removeEventListener('resize', handleResize);
});

/// util functions
const setEditorContent = (newContent: string) => {
  code.value = newContent;
  if (editor) {
    editor.setValue(newContent);
  }
};

const showNotification = ref(false);
const notificationMessage = ref('');
const triggerNotification = (message: string) => {
  notificationMessage.value = message;
  showNotification.value = true;
  setTimeout(() => {
    showNotification.value = false;
  }, 5000);
};

const loadConflictSources = async () => {
  try {
    console.log('Loading conflict sources...');
    const files = await window.electron.loadConflictSources(
      topBarStore.directory
    );
    // console.log(files);
    conflictSources.value = files;
    isLoading.value = false;
  } catch (error) {
    console.error('Error loading conflict sources:', error);
    triggerNotification(`Error loading conflict sources: ${error}`);
    isLoading.value = false;
    topBarStore.setDirectory('');
    projectSelected.value = false;
  }

  if (conflictSources.value.length > 0) {
    await handleFileSelected(conflictSources.value[0]);
  }
};

const handleResize = () => {
  editor.layout();
};

const highlightConflictBlocks = (content: Array<string>) => {
  const conflictBlocks = findConflictBlocks(content);
  // console.log(conflictBlocks);
  const newDecorations = getConflictBlockDecorations(conflictBlocks);
  // console.log(newDecorations);
  const oldDecorations =
    editor
      .getModel()
      ?.getAllDecorations()
      .map((decoration) => decoration.id) || [];
  editor.getModel()?.deltaDecorations(oldDecorations, newDecorations);
  // console.log(newDecorations);
  // editor.createDecorationsCollection(newDecorations);
};
</script>

<template>
  <div
    id="app"
    class="flex flex-col h-screen"
    :class="{ 'dark:bg-gray-800 dark:text-white': isDark }"
  >
    <!-- 顶部输入框区域 -->
    <div class="flex items-center p-4 space-x-4 border-b border-gray-300">
      <label for="project" class="text-gray-500 flex-shrink-0"
        >选择项目：</label
      >
      <input
        id="project"
        v-model="topBarStore.directory"
        type="text"
        class="flex-1 p-1 border rounded-md text-gray-600 text-sm flex-shrink"
        placeholder="点击选择目录"
        @click="selectDirectory"
      />

      <label for="target" class="text-gray-500 flex-shink-0">target: </label>
      <input
        id="target"
        v-model="topBarStore.target"
        type="text"
        class="flex-1 p-1 border rounded-md text-gray-600 text-sm flex-shrink"
        placeholder="输入文本"
      />

      <label for="source" class="text-gray-500 flex-shink-0">source: </label>
      <input
        id="source"
        v-model="topBarStore.source"
        type="text"
        class="flex-1 p-1 border rounded-md text-gray-600 text-sm flex-shrink"
        placeholder="输入文本"
      />

      <button
        class="px-1.5 py-1 bg-green-400 text-white rounded-md flex-shrink-0"
        @click="postMergeScenarioHandler"
      >
        post ms
      </button>

      <button class="flex-shrink-0" @click="toggleDark">
        {{ isDark ? '🌙 dark' : '💡 light' }}
      </button>
    </div>

    <div class="flex h-screen">
      <!-- 左侧文件列表 -->
      <div class="relative w-1/5 min-w-[200px] max-w-[320px] border-r h-full">
        <div
          v-if="!projectSelected"
          class="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-gray-500"
        >
          未选择项目
        </div>
        <div v-else class="h-full">
          <FileList
            :files="conflictSources"
            :is-loading="isLoading"
            @file-selected="handleFileSelected"
          />
        </div>
      </div>

      <!-- 右侧 Monaco Editor -->
      <div
        ref="editorContainer"
        class="flex-grow h-full"
        style="width: 100%; height: 100%"
      ></div>
    </div>
  </div>

  <EditorNotification
    v-if="showNotification"
    :message="notificationMessage"
    @close="showNotification = false"
  />
</template>

<style scoped>
#app {
  height: 100vh;
}

:global(.conflicts-ours) {
  background: lightblue;
}

:global(.conflicts-base) {
  background: lightgrey;
}

:global(.conflicts-theirs) {
  background: pink;
}
</style>
