export function validColor(value) {
  const color = String(value ?? '').trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : '';
}

// Explicit type/value rows work with the existing Apps Script JSON endpoint.
export function textStyle(valueOf, key) {
  const style = {};
  const color = validColor(valueOf(key + '_color'));
  if (color) style.color = color;
  const size = Number(valueOf(key + '_font_size'));
  if (Number.isFinite(size) && size >= 10 && size <= 48) style.fontSize = size + 'px';
  const bold = String(valueOf(key + '_bold') ?? '').trim().toLowerCase();
  if (['true', '1', 'yes'].includes(bold)) style.fontWeight = '700';
  else if (['false', '0', 'no'].includes(bold)) style.fontWeight = '400';
  return style;
}
