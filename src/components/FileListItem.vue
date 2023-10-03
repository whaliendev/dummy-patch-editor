<!-- FileListItem.vue -->
<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  filename: {
    type: String,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['selected']);

const showFullText = ref(false);

const selectItem = () => {
  emit('selected', props.filename);
};
</script>

<template>
  <div
    class="flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-150"
    :class="{ 'bg-emerald-100 dark:bg-emerald-200': isSelected }"
    @click="selectItem"
    @mouseover="showFullText = true"
    @mouseout="showFullText = false"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
    >
      <path
        fill="#888888"
        d="M16 0H8C6.9 0 6 .9 6 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6l-6-6m4 18H8V2h7v5h5v11M4 4v18h16v2H4c-1.1 0-2-.9-2-2V4h2m6 6v2h8v-2h-8m0 4v2h5v-2h-5Z"
      />
    </svg>
    <div
      class="truncate ml-2 text-gray-500"
      :title="showFullText ? filename : ''"
    >
      {{ filename }}
    </div>
  </div>
</template>
