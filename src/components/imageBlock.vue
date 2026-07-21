<script setup>
defineProps({
  value: {
    type: String,
    required: true
  }
});
</script>

<template>
  <img :src="value" alt="image" />
</template>

<style scoped>
img {
  width: 100%;
  display: block;
  border-radius: 10px;
}
</style>