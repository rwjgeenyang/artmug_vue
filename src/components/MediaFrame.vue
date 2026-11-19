<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({ src: String, kind: String, label: String, lazy: Boolean, pending: Boolean });
// Keep the last loaded GIF's proportions until the next image has dimensions.
const ratio = ref(16 / 9);
const loading = ref(false);
const failed = ref(false);
const viewer = ref(null);
const trigger = ref(null);
const canExpand = computed(() => props.kind === 'gif' && props.src && !props.pending && !loading.value && !failed.value);
let ownsFullscreen = false;
let closed = true;
function closeViewer() {
  closed = true;
  viewer.value?.close();
  if (ownsFullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  ownsFullscreen = false;
  trigger.value?.focus({ preventScroll: true });
}
function fullscreenChanged() {
  if (ownsFullscreen && !document.fullscreenElement) closeViewer();
}
function openViewer() {
  if (!canExpand.value || viewer.value?.open) return;
  closed = false;
  viewer.value.showModal();
  // An embedded page needs browser fullscreen to escape the tall Artmug iframe.
  if (window.self !== window.top && document.fullscreenEnabled && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      ownsFullscreen = true;
      if (closed) closeViewer();
    }).catch(() => {});
  }
}
document.addEventListener('fullscreenchange', fullscreenChanged);
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', fullscreenChanged);
  closeViewer();
});
watch(() => [props.src, props.kind], () => {
  if (viewer.value?.open) closeViewer();
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
  <div ref="trigger" class="media-frame" :class="{ expandable: canExpand }"
    :role="kind === 'gif' ? 'button' : undefined" :tabindex="canExpand ? 0 : undefined"
    :aria-label="kind === 'gif' ? label + ' GIF 크게 보기' : undefined"
    @click="openViewer" @keydown.enter.prevent="openViewer" @keydown.space.prevent="openViewer"
    :style="{ aspectRatio: kind === 'youtube' ? 16 / 9 : ratio }" :aria-busy="pending || loading">
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
  <Teleport to="body">
    <dialog ref="viewer" class="gif-viewer" :aria-label="label + ' GIF 크게 보기'"
      @cancel.prevent="closeViewer" @click.self="closeViewer">
      <button type="button" class="viewer-close" aria-label="전체화면 닫기" autofocus @click="closeViewer">×</button>
      <img v-if="src && kind === 'gif'" class="viewer-image" :src="src" :alt="label" draggable="false" />
    </dialog>
  </Teleport>
</template>

<style scoped>
.media-frame { width: 100%; position: relative; display: grid; place-items: center; overflow: hidden; border-radius: 18px; background: #f5f6f8; }
.media-frame::after { content: ""; position: absolute; inset: 0; border: 1px solid #000; border-radius: inherit; pointer-events: none; z-index: 1; }
.media-message { margin: 0; padding: 24px; color: #747982; font-size: 13px; text-align: center; }
.media-frame > img, .media-frame > iframe { position: absolute; inset: 0; display: block; width: 100%; height: 100%; border: 0; border-radius: inherit; }
.media-frame > img { object-fit: contain; pointer-events: none; }
.media-frame > img.pending { visibility: hidden; }
.media-frame.expandable { cursor: zoom-in; }
.media-frame:focus-visible { outline: 2px solid var(--accent-color, #c93c4b); outline-offset: 3px; }
.gif-viewer { position: fixed; inset: 0; margin: 0; padding: 64px 24px 24px; width: 100%; height: 100%; max-width: none; max-height: none; border: 0; background: transparent; overflow: hidden; }
.gif-viewer[open] { display: grid; place-items: center; }
.gif-viewer::backdrop { background: rgba(0, 0, 0, .7); }
.gif-viewer .viewer-image { display: block; width: auto; height: auto; max-width: 100%; max-height: calc(100dvh - 88px); object-fit: contain; border-radius: 0; }
.gif-viewer .viewer-close { position: absolute; top: 16px; right: 16px; display: grid; place-items: center; width: 44px; height: 44px; margin: 0; padding: 0; border: 1px solid #ffffff80; border-radius: 50%; background: #222; color: #fff; font-size: 32px; line-height: 1; cursor: pointer; }
.gif-viewer .viewer-close:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
</style>
