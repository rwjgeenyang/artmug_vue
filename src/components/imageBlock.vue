<script setup>
defineProps({
  value: {
    type: String,
    required: true
  }
});
</script>

<template>
  <img :src="value" alt="이미지" />
</template>

<style scoped>
img {
  width: 100%;
  display: block;
}
</style>