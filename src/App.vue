<template>
  <div>{{ items[0]?.value }}</div>

  <ImageBlock
    v-for="(item, index) in items.filter(i => i.type === 'image')"
    :key="index"
    :value="item.value"
  />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getPageData } from "../services/sheetApi";
import ImageBlock from "./components/ImageBlock.vue";

const items = ref([]);

onMounted(async () => {
  items.value = await getPageData();
});
</script>