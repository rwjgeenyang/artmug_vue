<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { getPageData } from "./services/sheetApi";
import { connectEmbedHeight } from "./services/embedHeight";
import MediaCarousel from "./components/MediaCarousel.vue";
import CollaboratorCard from "./components/CollaboratorCard.vue";

const items = ref([]);
const loading = ref(true);
const error = ref("");
const valueOf = (type) => items.value.find(item => item?.type === type)?.value;
const name = computed(() => valueOf("name") || "작가 이름");
const introduction = computed(() => valueOf("intro") || valueOf("text") || "자기소개가 들어갈 공간입니다.");
const about = computed(() => valueOf("about") || "소개글이 들어갈 공간입니다.");
const notice = computed(() => valueOf("notice") || "주의사항이 들어갈 공간입니다.");
const profileImage = computed(() => safeUrl(valueOf("profile_image")));
const profileFailed = ref(false);
const job = computed(() => valueOf("job") || "");
function safeUrl(value) {
  try {
    const url = new URL(String(value));
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}
function youtubeEmbed(value) {
  try {
    const url = new URL(String(value));
    const host = url.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/")[1];
    else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      id = url.searchParams.get("v") || (/^\/(embed|shorts|live)\//.test(url.pathname) ? url.pathname.split("/")[2] : "");
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? "https://www.youtube-nocookie.com/embed/" + id : "";
  } catch { return ""; }
}
const categories = [
  { type: "broadcast", label: "방송화면 및 대기화면", number: "03" },
  { type: "wallpaper", label: "월페이퍼 및 반응형 월페이퍼", number: "04" },
  { type: "ingame", label: "인게임", number: "05" },
];
const selectedMedia = ref({ broadcast: "gif", wallpaper: "gif", ingame: "gif" });
const mediaSections = computed(() => categories.map(category => {
  const works = new Map();
  const ensure = number => {
    if (!works.has(number)) works.set(number, { number, gif: '', youtube: '', description: '' });
    return works.get(number);
  };
  for (const kind of ['gif', 'youtube']) {
    const legacy = items.value.filter(item => item?.type === category.type + '_' + kind ||
      (kind === 'youtube' && item?.type === category.type) ||
      (category.type === 'broadcast' && item?.type === kind));
    legacy.forEach((item, index) => {
      ensure(index + 1)[kind] = kind === 'gif' ? safeUrl(item.value) : youtubeEmbed(item.value);
    });
  }
  for (const item of items.value) {
    const match = new RegExp('^' + category.type + '_([1-9]\\d*)_(gif|youtube|description)$').exec(item?.type || '');
    if (!match) continue;
    const work = ensure(Number(match[1]));
    work[match[2]] = match[2] === 'gif' ? safeUrl(item.value) : match[2] === 'youtube' ? youtubeEmbed(item.value) : String(item.value ?? '');
  }
  return { ...category, works: [...works.values()].sort((a, b) => a.number - b.number) };
}));

function artmugUrl(value) {
  try {
    const url = new URL(String(value));
    return ['https:', 'http:'].includes(url.protocol) &&
      ['artmug.kr', 'www.artmug.kr'].includes(url.hostname) ? url.href : '';
  } catch { return ''; }
}
const collaborators = computed(() => {
  const groups = new Map();
  for (const item of items.value) {
    const match = /^collab_([1-9]\d*)_(name|url|intro|gif|youtube|note)$/.exec(item?.type || '');
    if (!match) continue;
    const [, id, field] = match;
    if (!groups.has(id)) groups.set(id, { id });
    const group = groups.get(id);
    if (group[field] === undefined) group[field] = String(item.value ?? '').trim();
  }
  const artists = [...groups.values()]
    .filter(artist => artist.name)
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map(artist => ({ ...artist, gif: safeUrl(artist.gif), youtube: youtubeEmbed(artist.youtube), url: artmugUrl(artist.url) }));
  return artists.length ? artists : [{ id: 'placeholder', name: '협업작가 이름', intro: '', url: '', gif: '', youtube: '', note: '' }];
});

const pageElement = ref(null);
let disconnectEmbed = () => {};
onMounted(() => { disconnectEmbed = connectEmbedHeight(pageElement.value); });
onBeforeUnmount(() => disconnectEmbed());

async function load() {
  loading.value = true;
  error.value = "";
  try { items.value = await getPageData(); }
  catch { error.value = "내용을 불러오지 못했습니다."; }
  finally { loading.value = false; }
}
onMounted(load);
</script>

<template>
  <main class="page" ref="pageElement">
    <p v-if="loading" class="status" role="status">내용을 불러오는 중입니다…</p>
    <div v-if="error" class="status" role="alert">
      {{ error }} <button type="button" @click="load">다시 불러오기</button>
    </div>

    <section class="section" aria-labelledby="intro-heading">
      <header class="section-heading"><span class="number">01</span><h2 id="intro-heading">자기소개</h2></header>
      <div class="introduction">
        <img v-if="profileImage && !profileFailed" class="profile-image" :src="profileImage" :alt="name + ' 프로필'" @error="profileFailed = true" />
        <div v-else class="profile-placeholder" aria-label="프로필 이미지 자리">PROFILE</div>
        <div class="intro-copy">
          <h1>{{ name }}</h1>
          <p v-if="job" class="job">{{ job }}</p>
          <p class="intro-text">{{ introduction }}</p>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="about-heading">
      <header class="section-heading"><span class="number">02</span><h2 id="about-heading">소개글</h2></header>
      <div class="information-card"><p>{{ about }}</p></div>
    </section>

    <section v-for="category in mediaSections" :key="category.type" class="section" :aria-labelledby="category.type + '-heading'">
      <header class="section-heading category-heading">
        <span class="number">{{ category.number }}</span>
        <h2 :id="category.type + '-heading'">{{ category.label }}</h2>
        <div class="media-switch" role="group" :aria-label="category.label + ' 표시 형식'">
          <button v-for="kind in ['gif', 'youtube']" :key="kind" type="button"
            :aria-pressed="selectedMedia[category.type] === kind"
            :aria-controls="category.type + '-media'"
            @click="selectedMedia[category.type] = kind">{{ kind === 'gif' ? 'GIF' : 'YOUTUBE' }}</button>
        </div>
      </header>
      <div :id="category.type + '-media'">
        <MediaCarousel :key="category.type"
          :works="category.works"
          :kind="selectedMedia[category.type]" :label="category.label" />
      </div>
    </section>
    <section class="section" aria-labelledby="collaborators-heading">
      <header class="section-heading"><span class="number">06</span><h2 id="collaborators-heading">협업작가</h2></header>
      <div class="collaborators-list">
        <CollaboratorCard v-for="artist in collaborators" :key="artist.id" :artist="artist" />
      </div>
    </section>
    <section class="section" aria-labelledby="notice-heading">
      <header class="section-heading"><span class="number">07</span><h2 id="notice-heading">주의사항</h2></header>
      <div class="information-card"><p>{{ notice }}</p></div>
    </section>
  </main>
</template>

<style>
html, body { overflow-y: auto !important; overflow-x: hidden; scrollbar-width: none; }
html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
.profile-image { width: 128px; height: 128px; flex: 0 0 128px; object-fit: contain; border-radius: 50%; background: #f8f9fa; }
@media (max-width: 560px) { .profile-image { width: 96px; height: 96px; flex-basis: auto; } }

.collaborators-list { display: flex; flex-direction: column; gap: 40px; }
.information-card { padding: clamp(24px, 4vw, 32px); border: 1px solid #e3e5e9; border-radius: 20px; background: #fff; color: #303238; box-shadow: 0 10px 32px #252b3510; }
.information-card p { font-size: 15px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
.category-heading { flex-wrap: wrap; }
.category-heading h2 { flex: 1; min-width: 0; }
.media-switch { display: flex; flex-shrink: 0; gap: 4px; margin-left: auto; padding: 4px; border: 1px solid #e3e5e9; border-radius: 12px; background: #f5f6f8; }
.media-switch button { margin: 0; padding: 8px 12px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: #747982; font-size: 12px; font-weight: 600; }
.media-switch button[aria-pressed="true"] { background: #fff; color: #303238; border-color: #e3e5e9; box-shadow: 0 2px 6px #252b3510; }
.media-switch button:hover { color: #303238; }
@media (max-width: 560px) {
  .category-heading { display: grid; grid-template-columns: auto minmax(0, 1fr); }
  .category-heading .media-switch { grid-column: 2; justify-self: end; }
}
</style>
