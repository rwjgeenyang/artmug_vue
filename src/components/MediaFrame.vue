<script setup>
import { ref, watch } from 'vue';

const props = defineProps({ src: String, kind: String, label: String, lazy: Boolean, pending: Boolean });
// Keep the last loaded GIF's proportions until the next image has dimensions.
const ratio = ref(16 / 9);
const loading = ref(false);
const failed = ref(false);
watch(() => [props.src, props.kind], () => {
  loading.value = Boolean(props.src);
  failed.value = false;
}, { immediate: true });
function loaded(event) {
  if (event.currentTarget.getAttribute('src') !== props.src) return;
  const image = event.currentTarget;
  if (props.kind === 'gif' && image.naturalWidth && image.naturalHeight) {
    ratio.value = image.naturalWidth / image.naturalHeight;
  }
  loading.value = false;
}
function errored(event) {
  if (event.currentTarget.getAttribute('src') !== props.src) return;
  failed.value = true;
  loading.value = false;
}
</script>

<template>
  <div class="media-frame" :style="{ aspectRatio: kind === 'youtube' ? 16 / 9 : ratio }" :aria-busy="pending || loading">
    <p v-if="pending" class="media-message" role="status">불러오는 중입니다...</p>
    <p v-else-if="!src" class="media-message">준비 중입니다···</p>
    <p v-else-if="failed" class="media-message">미디어를 불러오지 못했습니다.</p>
    <template v-else>
      <p v-if="loading" class="media-message" role="status">불러오는 중입니다...</p>
      <img v-if="kind === 'gif'" :key="src" :src="src" :alt="label"
        :class="{ pending: loading }" :loading="lazy ? 'lazy' : 'eager'"
        draggable="false" @load="loaded" @error="errored" />
      <iframe v-else :key="src" :src="src" :title="label" :loading="lazy ? 'lazy' : 'eager'"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin" @load="loaded" @error="errored"></iframe>
    </template>
  </div>
</template>

<style scoped>
.media-frame { width: 100%; position: relative; display: grid; place-items: center; overflow: hidden; border-radius: 18px; background: #f5f6f8; }
.media-frame::after { content: ""; position: absolute; inset: 0; border: 1px solid #000; border-radius: inherit; pointer-events: none; z-index: 1; }
.media-message { margin: 0; padding: 24px; color: #747982; font-size: 13px; text-align: center; }
img, iframe { position: absolute; inset: 0; display: block; width: 100%; height: 100%; border: 0; border-radius: inherit; }
img { object-fit: contain; pointer-events: none; }
img.pending { visibility: hidden; }
</style>
