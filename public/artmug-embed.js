// Artmug's parent document owns the expand button and clipping styles.
(() => {
  function expandDetail() {
    const root = document.querySelector('.subContent');
    if (!root) return;
    if (!document.getElementById('artmug-detail-expanded')) {
      const style = document.createElement('style');
      style.id = 'artmug-detail-expanded';
      style.textContent = "/* Run in the Artmug document, outside the portfolio iframe. */\n.subContent .detailinfo,\n.subContent .detailinfo .showcontent,\n.subContent .showstep1 {\n  max-height: none !important;\n  height: auto !important;\n  overflow: visible !important;\n}\n.subContent .btn_open_btn,\n.subContent .btn_open,\n.subContent .btn_close {\n  display: none !important;\n}";
      document.head.appendChild(style);
    }
    root.querySelectorAll('.detailinfo, .detailinfo .showcontent').forEach(box => {
      box.classList.remove('showstep1');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', expandDetail, { once: true });
  } else {
    expandDetail();
  }
})();

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
