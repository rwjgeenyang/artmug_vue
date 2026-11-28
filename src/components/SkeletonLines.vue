<script setup>
defineProps({ lines: { type: Number, default: 3 } });
</script>

<template>
  <div class="skeleton-lines" role="status" aria-label="콘텐츠 로딩 중" aria-busy="true">
    <span v-for="line in lines" :key="line" class="skeleton-bar" aria-hidden="true"
      :style="{ width: line === 1 ? '100%' : line === lines ? '72%' : '88%' }"></span>
  </div>
</template>

<style scoped>
.skeleton-lines { display: grid; gap: 12px; min-width: 0; padding: 4px 0; }
.skeleton-bar { display: block; height: 16px; border-radius: 8px; background: #3d3d42; }
</style>
