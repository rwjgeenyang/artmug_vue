<script setup>
import { computed, onMounted, onBeforeUnmount, nextTick, ref } from "vue";
import { textStyle, validColor } from "./services/textStyle";
import { createMediaPreloader } from "./services/mediaPreload";
import { getPageData } from "./services/sheetApi";
import { connectEmbedHeight } from "./services/embedHeight";
import MediaCarousel from "./components/MediaCarousel.vue";
import ApplicationForm from "./components/ApplicationForm.vue";
import CollaboratorCard from "./components/CollaboratorCard.vue";

const items = ref([]);
const loading = ref(true);
const error = ref("");
const valuesByType = computed(() => {
  const values = new Map();
  for (const item of items.value) {
    if (item && !values.has(item.type)) values.set(item.type, item.value);
  }
  return values;
});
const valueOf = type => valuesByType.value.get(type);
const styleFor = key => textStyle(valueOf, key);
const pageStyle = computed(() => {
  const base = styleFor('text');
  return {
    '--text-color': base.color || '#303238',
    '--text-size': base.fontSize || '15px',
    '--text-weight': base.fontWeight || '400',
    '--accent-color': validColor(valueOf('accent_color')) || '#c93c4b',
    '--accent-background': validColor(valueOf('accent_background')) || '#fff0f2',
    '--accent-border': validColor(valueOf('accent_border')) || '#e77a87',
  };
});
const processSteps = computed(() => {
  const steps = new Map();
  for (const item of items.value) {
    const match = /^process_([1-9]\d*)$/.exec(item?.type || '');
    if (!match) continue;
    const number = Number(match[1]);
    const title = String(item.value ?? '').trim();
    if (title && !steps.has(number)) steps.set(number, {
      number, title, revisions: valueOf('process_' + number + '_revisions'),
    });
  }
  return [...steps.values()].sort((a, b) => a.number - b.number);
});
const processRevisions = computed(() => valueOf('process_revisions') || '수정 횟수를 입력해 주세요.');
const name = computed(() => valueOf("name") || "작가 이름");
const introduction = computed(() => valueOf("intro") || valueOf("text") || "자기소개가 들어갈 공간입니다.");
const about = computed(() => valueOf("about") || "소개글이 들어갈 공간입니다.");
const notice = computed(() => valueOf("notice") || "주의사항이 들어갈 공간입니다.");
const noticeLines = computed(() => String(notice.value).split('^').map(line => line.trim().replace(/^[●•]\s*/, '')).filter(Boolean));
const applicationFields = computed(() => {
  const rows = items.value.filter(item => /^form_[1-9]\d*_(title|description|placeholder)$/.test(item?.type || ''));
  const groups = new Map();
  for (const row of rows) {
    const [, id, field] = /^form_([1-9]\d*)_(title|description|placeholder)$/.exec(row.type);
    if (!groups.has(id)) groups.set(id, { id });
    if (groups.get(id)[field] === undefined) groups.get(id)[field] = String(row.value ?? '').trim();
  }
  const fields = rows.length ? [...groups.values()].filter(field => field.title) : [
    { id: '1', title: '사용 목적', description: '방송용인지, 대기화면인지' },
    { id: '2', title: '파츠분리 여부', description: 'psd 파일의 파츠 분리 여부' },
  ];
  return fields.sort((a, b) => Number(a.id) - Number(b.id)).map(field => ({
    ...field,
    titleStyle: styleFor('form_' + field.id + '_title'),
    descriptionStyle: styleFor('form_' + field.id + '_description'),
    textStyle: styleFor('form_' + field.id + '_text'),
  }));
});
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
  { type: "broadcast", label: "방송화면 및 대기화면", number: "04" },
  { type: "wallpaper", label: "월페이퍼 및 반응형 월페이퍼", number: "05" },
  { type: "ingame", label: "인게임", number: "06" },
];
const selectedMedia = ref({ broadcast: "gif", wallpaper: "gif", ingame: "gif" });
const mediaSections = computed(() => categories.map(category => {
  const works = new Map();
  const ensure = number => {
    if (!works.has(number)) works.set(number, { number, gif: '', youtube: '', description: '', date: '' });
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
    const match = new RegExp('^' + category.type + '_([1-9]\\d*)_(gif|youtube|description|date)$').exec(item?.type || '');
    if (!match) continue;
    const work = ensure(Number(match[1]));
    work[match[2]] = match[2] === 'gif' ? safeUrl(item.value) : match[2] === 'youtube' ? youtubeEmbed(item.value) : String(item.value ?? '');
  }
  return { ...category, works: [...works.values()].sort((a, b) => a.number - b.number).map(work => ({ ...work, dateStyle: styleFor(category.type + '_' + work.number + '_date'), descriptionStyle: styleFor(category.type + '_' + work.number + '_description') })) };
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
    .map(artist => ({ ...artist, gif: safeUrl(artist.gif), youtube: youtubeEmbed(artist.youtube), url: artmugUrl(artist.url), nameStyle: styleFor('collab_' + artist.id + '_name'), introStyle: styleFor('collab_' + artist.id + '_intro'), noteStyle: styleFor('collab_' + artist.id + '_note') }));
  return artists.length ? artists : [{ id: 'placeholder', name: '협업작가 이름', intro: '', url: '', gif: '', youtube: '', note: '' }];
});

const preloader = createMediaPreloader();
onBeforeUnmount(() => preloader.dispose());
const pageElement = ref(null);
let disconnectEmbed = () => {};
onMounted(() => { disconnectEmbed = connectEmbedHeight(pageElement.value); });
onBeforeUnmount(() => disconnectEmbed());

async function load() {
  loading.value = true;
  error.value = "";
  try {
    items.value = await getPageData();
    // Render the selected media first, then warm all other GIFs in the background.
    await nextTick();
    const media = [...mediaSections.value.flatMap(section => section.works), ...collaborators.value];
    preloader.preload(media.map(work => work.gif), media.some(work => work.youtube));
  }
  catch { error.value = "내용을 불러오지 못했습니다."; }
  finally { loading.value = false; }
}
onMounted(load);
</script>

<template>
  <main class="page" ref="pageElement" :style="pageStyle">
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
          <h1 :style="styleFor('name')">{{ name }}</h1>
          <p v-if="job" class="job" :style="styleFor('job')">{{ job }}</p>
          <p class="intro-text" :style="styleFor(valueOf('intro') ? 'intro' : 'text')">{{ introduction }}</p>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="about-heading">
      <header class="section-heading"><span class="number">02</span><h2 id="about-heading">소개글</h2></header>
      <div class="information-card"><p :style="styleFor('about')">{{ about }}</p></div>
    </section>

    <section class="section" aria-labelledby="process-heading">
      <header class="section-heading"><span class="number">03</span><h2 id="process-heading">작업 진행 방식</h2></header>
      <div class="information-card process-card">
        <ol v-if="processSteps.length" class="process-steps" :class="{ 'many-steps': processSteps.length > 6 }" :style="{ '--step-count': processSteps.length }">
          <li v-for="step in processSteps" :key="step.number" class="process-step">
            <span class="step-number">STEP {{ String(step.number).padStart(2, '0') }}</span>
            <p :style="{ fontWeight: '700', ...styleFor('process_' + step.number) }">{{ step.title }}</p>
            <p v-if="step.revisions" class="step-revisions" :style="{ fontWeight: '700', ...styleFor('process_' + step.number + '_revisions') }">{{ step.revisions }}</p>
          </li>
        </ol>
        <p v-else>작업 진행 방식을 준비 중입니다···</p>
        <div class="revision-summary">
          <span class="revision-label">수정 횟수</span>
          <p :style="{ fontWeight: '700', ...styleFor('process_revisions') }">{{ processRevisions }}</p>
        </div>
      </div>
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
      <header class="section-heading"><span class="number">07</span><h2 id="collaborators-heading">협업작가</h2></header>
      <div class="collaborators-list">
        <CollaboratorCard v-for="artist in collaborators" :key="artist.id" :artist="artist" />
      </div>
    </section>
    <section class="section" aria-labelledby="application-heading">
      <header class="section-heading"><span class="number">08</span><h2 id="application-heading">신청양식</h2></header>
      <ApplicationForm :fields="applicationFields" />
    </section>
    <section class="section" aria-labelledby="notice-heading">
      <header class="section-heading"><span class="number">09</span><h2 id="notice-heading">주의사항</h2></header>
      <div class="information-card">
        <ul class="notice-list" :style="styleFor('notice')">
          <li v-for="(line, index) in noticeLines" :key="index"><span class="notice-bullet" aria-hidden="true">●</span><span>{{ line }}</span></li>
        </ul>
      </div>
    </section>
  </main>
</template>

<style>
.profile-image { width: 128px; height: 128px; flex: 0 0 128px; object-fit: contain; border-radius: 50%; background: #f8f9fa; }
@media (max-width: 560px) { .profile-image { width: 96px; height: 96px; flex-basis: auto; } }

.page { color: var(--text-color); }
.page .section-heading { border-bottom-color: var(--accent-border); }
.page .introduction, .page .information-card, .page .process-step,
.page .carousel-controls, .page .media-switch, .page .revision-summary {
  border-color: var(--accent-border);
}
.page .intro-text, .page .job { color: var(--text-color); font-size: var(--text-size); font-weight: var(--text-weight); }
.page .number { color: var(--accent-color); font-size: 16px; font-weight: 800; }
.process-steps { display: grid; grid-template-columns: repeat(var(--step-count), minmax(0, 1fr)); gap: 24px; list-style: none; padding: 0; margin: 0; }
.process-step { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 140px; gap: 12px; padding: 18px 12px; border: 1px solid #e3e5e9; border-radius: 14px; background: #fafafa; text-align: center; }
.process-step:not(:last-child)::after { content: '→'; position: absolute; right: -22px; top: 50%; transform: translateY(-50%); color: var(--accent-color); font-size: 18px; }
.process-steps.many-steps { grid-template-columns: minmax(0, 1fr); gap: 28px; }
.process-steps.many-steps .process-step:not(:last-child)::after { content: '↓'; top: auto; bottom: -25px; right: 50%; transform: translateX(50%); }
.step-number { color: var(--accent-color); font-size: 11px; font-weight: 700; letter-spacing: .04em; }
.step-revisions { padding: 5px 8px; border-radius: 8px; background: var(--accent-background); }
.revision-summary { display: flex; justify-content: center; text-align: center; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 24px; padding: 16px 20px; border: 1px solid var(--accent-border); border-radius: 12px; background: var(--accent-background); }
.revision-label { color: var(--accent-color); font-size: 14px; font-weight: 700; }
.notice-list { padding: 0; margin: 0; list-style: none; color: var(--text-color); font-size: var(--text-size); font-weight: var(--text-weight); line-height: 1.8; }
.notice-list li { display: flex; align-items: baseline; gap: 10px; overflow-wrap: anywhere; }
.notice-list li + li { border-top: 1px solid #e3e5e9; margin-top: 16px; padding-top: 16px; }
.notice-list li > span:last-child { white-space: pre-wrap; }
.notice-bullet { flex-shrink: 0; font-size: .65em; }
@media (max-width: 720px) {
  .process-steps { grid-template-columns: minmax(0, 1fr); gap: 28px; }
  .process-step:not(:last-child)::after { content: '↓'; top: auto; bottom: -25px; right: 50%; transform: translateX(50%); }
}
.collaborators-list { display: flex; flex-direction: column; gap: 40px; }
.information-card { padding: clamp(24px, 4vw, 32px); border: 1px solid #e3e5e9; border-radius: 20px; background: #fff; color: var(--text-color); box-shadow: 0 10px 32px #252b3510; }
.information-card p { color: var(--text-color); font-size: var(--text-size); font-weight: var(--text-weight); line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
.category-heading { flex-wrap: wrap; }
.category-heading h2 { flex: 1; min-width: 0; }
.media-switch { display: flex; flex-shrink: 0; gap: 4px; margin-left: auto; padding: 4px; border: 1px solid #e3e5e9; border-radius: 12px; background: #f5f6f8; }
.media-switch button { margin: 0; padding: 8px 12px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: #747982; font-size: 12px; font-weight: 600; }
.media-switch button[aria-pressed="true"] { background: var(--accent-background); color: var(--accent-color); border-color: var(--accent-border); box-shadow: 0 2px 6px #252b3510; }
.media-switch button:hover { color: #303238; }
@media (max-width: 560px) {
  .category-heading { display: grid; grid-template-columns: auto minmax(0, 1fr); }
  .category-heading .media-switch { grid-column: 2; justify-self: end; }
}
</style>
