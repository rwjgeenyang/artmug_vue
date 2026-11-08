// Request every GIF once, without waiting for visitors to select its slide.
// Keep Image objects alive so the browser can reuse their loaded resources.
export function createMediaPreloader() {
  const images = new Map();
  const links = [];
  let disposed = false;
  function preload(gifUrls, hasYoutube) {
    if (disposed) return;
    for (const src of new Set(gifUrls.filter(Boolean))) {
      if (images.has(src)) continue;
      const image = new Image();
      image.fetchPriority = 'low';
      image.decoding = 'async';
      image.onerror = () => { images.delete(src); };
      images.set(src, image);
      image.src = src;
    }
    if (hasYoutube && !links.length) {
      for (const origin of ['https://www.youtube-nocookie.com', 'https://i.ytimg.com']) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        document.head.appendChild(link);
        links.push(link);
      }
    }
  }
  function dispose() {
    disposed = true;
    for (const image of images.values()) image.onerror = null;
    images.clear();
    for (const link of links) link.remove();
    links.length = 0;
  }
  return { preload, dispose };
}
