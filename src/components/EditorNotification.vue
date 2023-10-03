<!-- Notification.vue -->
<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed bottom-4 right-4 p-4 bg-green-400 text-white rounded-md shadow-lg"
    >
      <div class="flex items-center">
        <svg
          class="w-6 h-6 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M18.75 14.3746C19.2152 13.8913 19.5 13.2042 19.5 12.5C19.5 11.0409 18.3284 10 16.875 10H7.125C5.67157 10 4.5 11.0409 4.5 12.5C4.5 13.2042 4.78482 13.8913 5.25 14.3746M9 17h6m-3-13V9m0 4v4"
          ></path>
        </svg>
        <div>
          <div class="font-bold">Notification</div>
          {{ message }}
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';

const props = defineProps({
  message: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 3000,
  },
});

const visible = ref(true);

watchEffect(() => {
  setTimeout(() => {
    visible.value = false;
  }, props.duration);
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
