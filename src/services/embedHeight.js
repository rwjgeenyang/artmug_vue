// Only the containing page can resize a cross-origin iframe.
export function connectEmbedHeight(element) {
  if (!element || window.parent === window) return () => {};
  const origins = new Set(['https://artmug.kr', 'https://www.artmug.kr', window.location.origin]);
  let parentOrigin = null;
  try {
    const referrer = new URL(document.referrer).origin;
    if (origins.has(referrer)) parentOrigin = referrer;
  } catch { /* An explicit parent handshake can establish its origin. */ }
  let frame = 0;
  let disposed = false;
  function report() {
    if (disposed || !parentOrigin) return;
    const height = Math.ceil(element.getBoundingClientRect().height) + 2;
    window.parent.postMessage({ type: 'artmug:height', height }, parentOrigin);
  }
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(report);
  }
  function receive(event) {
    if (event.source !== window.parent || !origins.has(event.origin)) return;
    if (event.data?.type === 'artmug:measure') {
      parentOrigin = event.origin;
      schedule();
    } else if (event.data?.type === 'artmug:height-applied' && event.origin === parentOrigin) {
      document.documentElement.classList.add('artmug-auto-height');
    }
  }
  const observer = new ResizeObserver(schedule);
  observer.observe(element);
  window.addEventListener('message', receive);
  window.addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  schedule();
  return () => {
    disposed = true;
    observer.disconnect();
    cancelAnimationFrame(frame);
    window.removeEventListener('message', receive);
    window.removeEventListener('resize', schedule);
    document.documentElement.classList.remove('artmug-auto-height');
  };
}
