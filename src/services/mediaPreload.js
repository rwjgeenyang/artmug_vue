// Load the first GIF in each section before warming the remaining slides.
// Retained Image objects let rendered cards reuse the same browser resources.
export function createMediaPreloader() {
  const images = new Map();
  const links = [];
  let disposed = false;
  let generation = 0;

  function request(src, priority) {
    const existing = images.get(src);
    if (existing) {
      if (priority === 'high') existing.image.fetchPriority = 'high';
      return existing.promise;
    }
    const image = new Image();
    image.fetchPriority = priority;
    image.decoding = 'async';
    let settle;
    const promise = new Promise(resolve => { settle = resolve; });
    const entry = { image, promise, settle };
    images.set(src, entry);
    function finish(failed) {
      image.onload = image.onerror = null;
      if (failed) images.delete(src);
      settle();
    }
    image.onload = () => finish(false);
    image.onerror = () => finish(true);
    image.src = src;
    return promise;
  }

  async function preload(gifUrls, hasYoutube, firstGifUrls = []) {
    if (disposed) return;
    const run = ++generation;
    const first = new Set(firstGifUrls.filter(Boolean));
    const remaining = [...new Set(gifUrls.filter(Boolean))].filter(src => !first.has(src));
    if (hasYoutube && !links.length) {
      for (const origin of ['https://www.youtube-nocookie.com', 'https://i.ytimg.com']) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        document.head.appendChild(link);
        links.push(link);
      }
    }
    // An error also releases the queue so one missing first GIF cannot block it.
    await Promise.all([...first].map(src => request(src, 'high')));
    let index = 0;
    async function worker() {
      while (!disposed && run === generation && index < remaining.length) {
        await request(remaining[index++], 'low');
      }
    }
    // Two background requests at a time leave bandwidth for visible media.
    await Promise.all([worker(), worker()]);
  }

  function dispose() {
    disposed = true;
    generation++;
    for (const { image, settle } of images.values()) {
      image.onload = image.onerror = null;
      settle();
    }
    images.clear();
    for (const link of links) link.remove();
    links.length = 0;
  }
  return { preload, dispose };
}
