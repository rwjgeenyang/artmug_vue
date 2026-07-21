<script setup>
import { ref, onMounted } from "vue";
import { getPageData } from "./services/sheetApi";

const items = ref([]);

onMounted(async () => {
  items.value = await getPageData();
});
</script>

<template>
  <pre>{{ items }}</pre>
</template>