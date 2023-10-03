<script setup lang="ts">
import { ref } from 'vue';
import FileListItem from './FileListItem.vue';

const props = defineProps({
  files: {
    type: Array as () => string[],
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['file-selected']);

const selectedFile = ref('');

const selectFile = (filename: string) => {
  selectedFile.value = filename;
  emit('file-selected', filename);
};
</script>

<template>
  <div class="border rounded-md overflow-y-auto h-full relative">
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50"
    >
      <div
        class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"
      ></div>
    </div>
    <FileListItem
      v-for="file in files"
      :key="file"
      :filename="file"
      :is-selected="selectedFile === file"
      @selected="selectFile"
    />
  </div>
</template>
