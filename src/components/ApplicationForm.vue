<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({ fields: { type: Array, default: () => [] } });
const root = ref(null);
const answers = ref({});
const status = ref('');
const fallback = ref(false);
const copied = ref(false);
const copyText = computed(() => props.fields.map(field =>
  `[${field.title}]\n${answers.value[field.id] || ''}`
).join('\n\n'));
const defaultStyle = { fontSize: '18px' };
let successTimer;
let resizeFrame;
let observer;

function resizeFields() {
  for (const field of root.value?.querySelectorAll('.application-field textarea') || []) {
    const style = getComputedStyle(field);
    const mirror = field.cloneNode();
    // A value mirror measures long placeholders too, including explicit line breaks.
    mirror.removeAttribute('id');
    mirror.removeAttribute('name');
    mirror.setAttribute('aria-hidden', 'true');
    mirror.tabIndex = -1;
    mirror.value = field.value || field.placeholder;
    const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const minimum = Math.max(130, 4 * parseFloat(style.lineHeight) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + border);
    mirror.style.cssText = `position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none;box-sizing:border-box;width:${field.getBoundingClientRect().width}px;height:0;min-height:0;overflow:hidden;resize:none;font:${style.font};letter-spacing:${style.letterSpacing};padding:${style.padding};border:${style.border};`;
    root.value.appendChild(mirror);
    const height = Math.max(minimum, mirror.scrollHeight + border);
    mirror.remove();
    field.style.height = `${Math.ceil(height)}px`;
  }
}
function scheduleResize() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(resizeFields);
}
watch(() => props.fields, () => nextTick(scheduleResize), { deep: true });
onMounted(() => {
  let width = -1;
  observer = new ResizeObserver(entries => {
    const nextWidth = entries[0].contentRect.width;
    if (nextWidth !== width) { width = nextWidth; scheduleResize(); }
  });
  observer.observe(root.value);
  scheduleResize();
  document.fonts?.ready.then(() => { if (root.value) scheduleResize(); });
});
onBeforeUnmount(() => {
  observer?.disconnect();
  cancelAnimationFrame(resizeFrame);
  clearTimeout(successTimer);
});
function success() {
  fallback.value = false;
  copied.value = true;
  clearTimeout(successTimer);
  successTimer = setTimeout(() => { copied.value = false; }, 2000);
}
function legacyCopy(text) {
  const active = document.activeElement;
  const selection = active && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;
  const scrolls = [];
  for (let node = active; node; node = node.parentElement) scrolls.push([node, node.scrollLeft, node.scrollTop]);
  const x = window.scrollX, y = window.scrollY;
  const area = document.createElement('textarea');
  area.value = text;
  area.readOnly = true;
  area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(area);
  try {
    area.focus({ preventScroll: true });
    area.select();
    return document.execCommand('copy');
  } finally {
    area.remove();
    active?.focus({ preventScroll: true });
    if (selection) active.setSelectionRange(...selection);
    for (const [node, left, top] of scrolls) { node.scrollLeft = left; node.scrollTop = top; }
    window.scrollTo({ left: x, top: y, behavior: 'instant' });
  }
}
async function copy() {
  clearTimeout(successTimer);
  copied.value = false;
  status.value = '';
  fallback.value = false;
  try {
    await navigator.clipboard.writeText(copyText.value);
    success();
  } catch {
    try { if (legacyCopy(copyText.value)) { success(); return; } } catch { /* Offer manual copy without moving focus. */ }
    fallback.value = true;
    status.value = '자동 복사가 제한되어 있습니다. 아래 내용을 직접 복사해 주세요.';
  }
}
function onInput() { status.value = ''; fallback.value = false; scheduleResize(); }
</script>

<template>
  <div ref="root" class="information-card application-form">
    <div v-for="field in fields" :key="field.id" class="application-field">
      <label :for="'application-' + field.id" :style="{ ...defaultStyle, ...field.titleStyle }">{{ field.title }}</label>
      <p v-if="field.description" :id="'application-description-' + field.id" :style="{ ...defaultStyle, ...field.descriptionStyle }">{{ field.description }}</p>
      <textarea :id="'application-' + field.id" v-model="answers[field.id]" rows="4"
        :aria-describedby="field.description ? 'application-description-' + field.id : undefined"
        :placeholder="field.placeholder || '내용을 입력해 주세요.'"
        :style="{ ...defaultStyle, ...field.textStyle }" @input="onInput"></textarea>
    </div>
    <p v-if="!fields.length">신청양식을 준비 중입니다···</p>
    <div v-else class="copy-actions">
      <button type="button" :class="{ copied }" @click="copy"><span aria-live="polite">{{ copied ? '복사 완료!' : '복사하기' }}</span></button>
      <p v-if="status" role="status">{{ status }}</p>
    </div>
    <textarea v-if="fallback" class="copy-fallback" readonly :value="copyText"
      aria-label="복사할 신청양식" rows="8"></textarea>
  </div>
</template>

<style scoped>
.application-form { display: flex; flex-direction: column; gap: 28px; }
.application-field { display: flex; flex-direction: column; gap: 12px; }
label { color: var(--text-color); overflow-wrap: anywhere; }
textarea { display: block; box-sizing: border-box; width: 100%; min-height: 130px; resize: vertical; border: 1px solid #d5d8dd; border-radius: 12px; padding: 16px; font-family: inherit; font-weight: 700; line-height: 1.7; color: var(--text-color); background: #fff; }
.application-field textarea { overflow-y: hidden; }
textarea:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 2px; }
textarea::placeholder { color: #747982; opacity: 1; }
.copy-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.copy-actions button { min-width: 160px; margin: 0; padding: 12px 28px; border-color: var(--accent-border); background: var(--accent-background); color: var(--accent-color); font-size: 18px; font-weight: 700; transition: background .15s, color .15s; }
.copy-actions button:active { background: #a82234; border-color: #a82234; color: #fff; }
.copy-actions button.copied { background: #16803d; border-color: #16803d; color: #fff; }
@media (prefers-reduced-motion: reduce) { .copy-actions button { transition: none; } }
</style>
