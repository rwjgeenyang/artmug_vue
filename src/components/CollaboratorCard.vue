<script setup>
import { ref } from 'vue';
import MediaFrame from './MediaFrame.vue';
const props = defineProps({ artist: { type: Object, required: true } });
const kind = ref('gif');
</script>

<template>
  <article class="collaborator" :aria-labelledby="'collaborator-' + artist.id">
    <div class="collaborator-work">
      <div class="media-switch" role="group" :aria-label="artist.name + ' 표시 형식'">
        <button v-for="format in ['gif', 'youtube']" :key="format" type="button"
          :aria-pressed="kind === format" :aria-controls="'collaborator-media-' + artist.id"
          @click="kind = format">{{ format === 'gif' ? 'GIF' : 'YOUTUBE' }}</button>
      </div>
      <MediaFrame :id="'collaborator-media-' + artist.id" :src="artist[kind]"
        :kind="kind" :label="artist.name + ' 협업 작품'" lazy />
    </div>
    <div class="information-card collaborator-copy">
      <h3 :id="'collaborator-' + artist.id">
        <a v-if="artist.url" :href="artist.url" target="_blank" rel="noopener noreferrer">{{ artist.name }} ↗</a>
        <span v-else>{{ artist.name }}</span>
      </h3>
      <p>{{ artist.intro || '작가님 소개가 들어갈 공간입니다.' }}</p>
      <div class="collaborator-note">
        <p>작가님 이름 클릭 시 페이지로 이동합니다.</p>
        <p v-if="artist.note">{{ artist.note }}</p>
        <p v-if="!artist.url" class="missing-link">아트머그 링크 등록 예정입니다.</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.collaborator { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 20px; align-items: start; }
.collaborator-work { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.collaborator-copy { min-width: 0; margin-top: 44px; }
h3 { margin: 0 0 16px; font-size: 21px; overflow-wrap: anywhere; }
a { color: inherit; text-decoration: underline; text-underline-offset: 5px; }
a:hover { color: #646b75; }
a:focus-visible { outline: 2px solid #707b8f; outline-offset: 4px; }
.collaborator-note { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e3e5e9; color: #747982; }
.collaborator-note p { font-size: 12px; }
.collaborator-note p + p { margin-top: 8px; }
.missing-link { color: #969da8; }
@media (max-width: 640px) { .collaborator { grid-template-columns: minmax(0, 1fr); gap: 16px; } .collaborator-copy { margin-top: 0; } }
</style>
