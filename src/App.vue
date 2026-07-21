<script setup>
import { ref, onMounted } from "vue";
import { getPageData } from "./services/sheetApi";
import imageBlock from "./components/imageBlock.vue";

const items = ref([]);

onMounted(async () => {
  items.value = await getPageData();
});
</script>

<template>
  <ImageBlock
    v-for="(item, index) in items.filter(i => i.type === 'image')"
    :key="index"
    :value="item.value"
  />
</template>