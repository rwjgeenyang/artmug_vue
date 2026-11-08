<script setup>
import { computed, nextTick, ref } from 'vue';

const props = defineProps({ fields: { type: Array, default: () => [] } });
const answers = ref({});
const status = ref('');
const fallback = ref(false);
const copyArea = ref(null);
const copyText = computed(() => props.fields.map(field =>
  `${field.title}\n${answers.value[field.id] || ''}`
).join('\n\n'));
const defaultStyle = { fontSize: '18px', fontWeight: '700' };

async function copy() {
  status.value = '';
  fallback.value = false;
  try {
    await navigator.clipboard.writeText(copyText.value);
    status.value = '복사했습니다.';
  } catch {
    // Clipboard access can be denied inside an Artmug iframe.
    fallback.value = true;
    await nextTick();
    copyArea.value.focus();
    copyArea.value.select();
    try {
      if (document.execCommand('copy')) {
        fallback.value = false;
        status.value = '복사했습니다.';
        return;
      }
    } catch { /* Keep selected text visible for manual copying. */ }
    status.value = '자동 복사가 제한되어 있습니다. 아래 선택된 내용을 복사해 주세요.';
  }
}
</script>

<template>
  <div class="information-card application-form">
    <div v-for="field in fields" :key="field.id" class="application-field">
      <label :for="'application-' + field.id" :style="{ ...defaultStyle, ...field.titleStyle }">{{ field.title }}</label>
      <p v-if="field.description" :id="'application-description-' + field.id" :style="{ ...defaultStyle, ...field.descriptionStyle }">{{ field.description }}</p>
      <textarea :id="'application-' + field.id" v-model="answers[field.id]" rows="4"
        :aria-describedby="field.description ? 'application-description-' + field.id : undefined"
        :placeholder="field.placeholder || '내용을 입력해 주세요.'"
        :style="{ ...defaultStyle, ...field.textStyle }" @input="status = ''; fallback = false"></textarea>
    </div>
    <p v-if="!fields.length">신청양식을 준비 중입니다···</p>
    <div v-else class="copy-actions">
      <button type="button" @click="copy">복사하기</button>
      <p role="status" aria-live="polite">{{ status }}</p>
    </div>
    <textarea v-if="fallback" ref="copyArea" class="copy-fallback" readonly :value="copyText"
      aria-label="복사할 신청양식" rows="8"></textarea>
  </div>
</template>

<style scoped>
.application-form { display: flex; flex-direction: column; gap: 28px; }
.application-field { display: flex; flex-direction: column; gap: 12px; }
label { color: var(--text-color); overflow-wrap: anywhere; }
textarea { display: block; box-sizing: border-box; width: 100%; min-height: 130px; resize: vertical; border: 1px solid #d5d8dd; border-radius: 12px; padding: 16px; font-family: inherit; line-height: 1.7; color: var(--text-color); background: #fff; }
textarea:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 2px; }
textarea::placeholder { color: #747982; opacity: 1; }
.copy-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.copy-actions button { margin: 0; padding: 12px 28px; border-color: var(--accent-border); background: var(--accent-background); color: var(--accent-color); font-size: 18px; font-weight: 700; }
.copy-actions p:empty { display: none; }
</style>
