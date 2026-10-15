<script setup>
import { computed, onMounted, ref } from "vue";
import { getPageData } from "./services/sheetApi";
import MediaCarousel from "./components/MediaCarousel.vue";

const items = ref([]);
const loading = ref(true);
const error = ref("");
const valueOf = (type) => items.value.find(item => item?.type === type)?.value;
const name = computed(() => valueOf("name") || "작가 이름");
const introduction = computed(() => valueOf("intro") || valueOf("text") || "자기소개가 들어갈 공간입니다.");
const job = computed(() => valueOf("job") || "");
function safeUrl(value) {
  try {
    const url = new URL(String(value));
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}
const gifs = computed(() => items.value
  .filter(item => item?.type === "gif")
  .map(item => safeUrl(item.value)).filter(Boolean));
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
const videos = computed(() => items.value
  .filter(item => item?.type === "youtube")
  .map(item => youtubeEmbed(item.value)).filter(Boolean));

// Mouse-drag the page background; touch users keep native vertical scrolling.
const pageDragging = ref(false);
let pageGesture = null;
function pageDown(event) {
  if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest(".carousel, button, a, input, textarea")) return;
  pageGesture = { id: event.pointerId, y: event.clientY, scroll: window.scrollY };
  event.currentTarget.setPointerCapture(event.pointerId);
  event.preventDefault();
}
function pageMove(event) {
  if (!pageGesture || pageGesture.id !== event.pointerId) return;
  const delta = event.clientY - pageGesture.y;
  if (Math.abs(delta) > 5) pageDragging.value = true;
  if (pageDragging.value) window.scrollTo({ top: pageGesture.scroll - delta, behavior: "instant" });
}
function pageUp(event) {
  pageGesture = null;
  pageDragging.value = false;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
}

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
  <main class="page" :class="{ 'page-dragging': pageDragging }" @pointerdown="pageDown" @pointermove="pageMove" @pointerup="pageUp" @pointercancel="pageUp" @lostpointercapture="pageUp">
    <p v-if="loading" class="status" role="status">내용을 불러오는 중입니다…</p>
    <div v-if="error" class="status" role="alert">
      {{ error }} <button type="button" @click="load">다시 불러오기</button>
    </div>

    <section class="section" aria-labelledby="intro-heading">
      <header class="section-heading"><span class="number">01</span><h2 id="intro-heading">자기소개</h2></header>
      <div class="introduction">
        <div class="profile-placeholder" aria-label="프로필 이미지 자리">PROFILE</div>
        <div class="intro-copy">
          <h1>{{ name }}</h1>
          <p v-if="job" class="job">{{ job }}</p>
          <p class="intro-text">{{ introduction }}</p>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="gif-heading">
      <header class="section-heading"><span class="number">02</span><h2 id="gif-heading">GIF</h2></header>
      <MediaCarousel :urls="gifs" kind="gif" label="GIF" />
    </section>

    <section class="section" aria-labelledby="youtube-heading">
      <header class="section-heading"><span class="number">03</span><h2 id="youtube-heading">작업물 <small>YouTube</small></h2></header>
      <MediaCarousel :urls="videos" kind="youtube" label="작업물" />
    </section>
  </main>
</template>
