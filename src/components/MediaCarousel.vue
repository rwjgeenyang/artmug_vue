<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({ urls: { type: Array, default: () => [] }, kind: String, label: String });
const slides = computed(() => props.urls.length ? props.urls : ['', '']);
const index = ref(0);
const offset = ref(0);
const dragging = ref(false);
const failed = ref(false);
let gesture = null;
watch(() => props.urls, () => { index.value = 0; failed.value = false; });
const current = computed(() => slides.value[index.value]);
function move(direction) {
  const next = Math.max(0, Math.min(slides.value.length - 1, index.value + direction));
  if (next !== index.value) { failed.value = false; }
  index.value = next;
  offset.value = 0;
}
function down(event) {
  if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a, iframe')) return;
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null };
  event.currentTarget.setPointerCapture(event.pointerId);
}
function drag(event) {
  if (!gesture || gesture.id !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  if (!gesture.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  if (gesture.axis !== 'x') return;
  dragging.value = true;
  const edge = (index.value === 0 && dx > 0) || (index.value === slides.value.length - 1 && dx < 0);
  offset.value = dx * (edge ? 0.18 : 1);
}
function end(event, cancelled = false) {
  if (!gesture || gesture.id !== event.pointerId) return;
  const delta = event.clientX - gesture.x;
  const threshold = Math.min(80, event.currentTarget.clientWidth * 0.15);
  if (!cancelled && gesture.axis === 'x' && Math.abs(delta) > threshold) move(delta < 0 ? 1 : -1);
  gesture = null;
  dragging.value = false;
  offset.value = 0;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
}
function keyboard(event) {
  if (event.target !== event.currentTarget) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
  }
}
</script>

<template>
  <div class="carousel" role="region" aria-roledescription="슬라이더" :aria-label="label" tabindex="0" @keydown="keyboard">
    <div class="carousel-surface" :class="{ dragging }" @pointerdown="down" @pointermove="drag" @pointerup="end($event)" @pointercancel="end($event, true)" @lostpointercapture="end($event, true)" @dragstart.prevent>
      <div class="carousel-content" :style="{ transform: 'translateX(' + offset + 'px)' }">
        <div class="carousel-media" :class="{ 'gif-media': kind === 'gif', 'gif-filled': kind === 'gif' && current && !failed }">
          <template v-if="current">
            <img v-if="kind === 'gif' && !failed" :key="current" :src="current" :alt="label + ' ' + (index + 1)" draggable="false" @error="failed = true" />
            <iframe v-else-if="kind === 'youtube'" :src="current" :title="label + ' ' + (index + 1)" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
            <p v-else class="empty-copy">이미지를 불러오지 못했습니다.</p>
          </template>
          <div v-else class="empty-copy"><span class="empty-symbol">{{ kind === 'gif' ? 'GIF' : '▷' }}</span><strong>{{ label }} {{ String(index + 1).padStart(2, '0') }}</strong><span>{{ kind === 'gif' ? '애니메이션이 들어갈 공간' : '유튜브 영상이 들어갈 공간' }}</span></div>
        </div>
      </div>
    </div>
    <div class="carousel-controls" :aria-label="label + ' 탐색'">
      <button type="button" :disabled="index === 0" :aria-label="label + ' 이전'" @click="move(-1)">←</button>
      <span class="counter-text" aria-live="polite">{{ index + 1 }} / {{ slides.length }}</span>
      <button type="button" :disabled="index === slides.length - 1" :aria-label="label + ' 다음'" @click="move(1)">→</button>
    </div>
  </div>
</template>

<style scoped>
.carousel { display: flex; flex-direction: column; align-items: stretch; gap: 12px; }
.carousel:focus-visible { outline: 2px solid #707b8f; outline-offset: 4px; }
.carousel-controls { align-self: center; display: flex; align-items: center; gap: 16px; padding: 8px 12px; border: 1px solid #512b33; border-radius: 16px; background: linear-gradient(135deg, #171316, #30171e); box-shadow: 0 6px 24px #0003; }
.counter-text { font-size: 12px; min-width: 42px; text-align: center; color: #e5cbd1; font-variant-numeric: tabular-nums; }
.carousel-controls button { width: 36px; height: 36px; border-radius: 50%; margin: 0; padding: 0; font-size: 18px; }
button:disabled { opacity: .3; cursor: default; }
.carousel-surface { border-radius: 18px; box-shadow: 0 6px 24px #0003; overflow: hidden; touch-action: pan-y pinch-zoom; cursor: grab; user-select: none; }
.carousel-surface.dragging { cursor: grabbing; }
.carousel-content { transition: transform .25s ease; }
.dragging .carousel-content { transition: none; }
.carousel-media { aspect-ratio: 16 / 9; position: relative; display: grid; place-items: center; background: #201419; overflow: hidden; }
.gif-media { aspect-ratio: 16 / 10; }
.gif-media.gif-filled { aspect-ratio: auto; display: block; }
.carousel-media img { display: block; width: 100%; height: auto; border-radius: 18px; pointer-events: none; }
.carousel-media iframe { display: block; border: 0; width: 100%; height: 100%; position: absolute; inset: 0; }
.empty-copy { display: flex; align-items: center; flex-direction: column; gap: 12px; padding: 24px; text-align: center; font-size: 12px; color: #c2a4ac; }
.empty-copy strong { color: #edd8dd; font-size: 15px; font-weight: 500; }
.empty-symbol { font-size: 28px; letter-spacing: .1em; color: #b8bdc6; }
@media (prefers-reduced-motion: reduce) { .carousel-content { transition: none; } }
</style>
