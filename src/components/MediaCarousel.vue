<script setup>
import { computed, ref, watch } from 'vue';
import MediaFrame from './MediaFrame.vue';

const props = defineProps({ works: { type: Array, default: () => [] }, kind: String, label: String });
const slides = computed(() => props.works.length ? props.works : [{ number: 1, gif: '', youtube: '', description: '' }]);
const index = ref(0);
const offset = ref(0);
const dragging = ref(false);
let gesture = null;
watch(() => props.works.length, () => { index.value = Math.min(index.value, slides.value.length - 1); });
const current = computed(() => slides.value[index.value]);
const displayDate = computed(() => String(current.value.date || '').trim().replace(/\s*\d{1,2}일\s*$/, ''));
function move(direction) {
  const next = Math.max(0, Math.min(slides.value.length - 1, index.value + direction));
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
    <div class="information-card work-description">
      <p :style="{ fontSize: '18px', fontWeight: '700', ...current.descriptionStyle }">{{ current.description || '작품 설명을 준비 중입니다···' }}</p>
      <div v-if="displayDate" class="work-date" :style="{ fontSize: '18px', fontWeight: '700', ...current.dateStyle }">{{ displayDate }}</div>
    </div>
    <div class="carousel-surface" :class="{ dragging }" @pointerdown="down" @pointermove="drag" @pointerup="end($event)" @pointercancel="end($event, true)" @lostpointercapture="end($event, true)" @dragstart.prevent>
      <div class="carousel-content" :style="{ transform: 'translateX(' + offset + 'px)' }">
        <MediaFrame :src="current[kind]" :kind="kind" :label="label + ' ' + current.number" />
      </div>
    </div>
    <div v-if="works.length" class="carousel-controls" :aria-label="label + ' 탐색'">
      <button type="button" :disabled="index === 0" :aria-label="label + ' 이전'" @click="move(-1)">←</button>
      <span class="counter-text" aria-live="polite">{{ index + 1 }} / {{ slides.length }}</span>
      <button type="button" :disabled="index === slides.length - 1" :aria-label="label + ' 다음'" @click="move(1)">→</button>
    </div>
  </div>
</template>

<style scoped>
.work-date { width: fit-content; max-width: 100%; padding: 12px .8em 0 0; border-top: 1px solid var(--accent-border); margin-top: 16px; color: var(--text-color); font-size: var(--text-size); font-weight: var(--text-weight); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.carousel { display: flex; flex-direction: column; align-items: stretch; gap: 12px; }
.carousel:focus-visible { outline: 2px solid #707b8f; outline-offset: 4px; }
.carousel-controls { align-self: center; display: flex; align-items: center; gap: 16px; padding: 8px 12px; border: 1px solid #e3e5e9; border-radius: 16px; background: #fff; box-shadow: 0 4px 16px #252b3510; }
.counter-text { font-size: 12px; min-width: 42px; text-align: center; color: #6e7580; font-variant-numeric: tabular-nums; }
.carousel-controls button { background: #fff; color: #303238; border: 1px solid #d5d8dd; width: 36px; height: 36px; border-radius: 50%; margin: 0; padding: 0; font-size: 18px; }
.carousel-controls button:not(:disabled):hover { background: #f5f6f8; }
button:disabled { opacity: .3; cursor: default; }
.carousel-surface { border-radius: 18px; box-shadow: 0 6px 24px #252b3510; overflow: hidden; touch-action: pan-y pinch-zoom; cursor: grab; user-select: none; }
.carousel-surface.dragging { cursor: grabbing; }
.carousel-content { transition: transform .25s ease; }
.dragging .carousel-content { transition: none; }
@media (prefers-reduced-motion: reduce) { .carousel-content { transition: none; } }
</style>
