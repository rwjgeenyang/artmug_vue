(() => {
  const iframe = document.getElementById('artmug-portfolio');
  const origin = 'https://warm-squirrel-5cfab5.netlify.app';
  if (!iframe || iframe.dataset.autoHeightBound === 'true') return;
  if (new URL(iframe.src, document.baseURI).origin !== origin) return;
  iframe.dataset.autoHeightBound = 'true';
  function requestHeight() {
    iframe.contentWindow?.postMessage({ type: 'artmug:measure' }, origin);
  }
  window.addEventListener('message', event => {
    if (event.origin !== origin || event.source !== iframe.contentWindow) return;
    if (event.data?.type !== 'artmug:height') return;
    const height = event.data.height;
    if (typeof height !== 'number' || !Number.isFinite(height) || height < 1 || height > 100000) return;
    const pixels = Math.ceil(height);
    iframe.style.height = pixels + 'px';
    iframe.setAttribute('height', String(pixels));
    iframe.setAttribute('scrolling', 'no');
    iframe.contentWindow.postMessage({ type: 'artmug:height-applied' }, origin);
  });
  iframe.addEventListener('load', requestHeight);
  window.addEventListener('resize', requestHeight);
  requestHeight();
})();
