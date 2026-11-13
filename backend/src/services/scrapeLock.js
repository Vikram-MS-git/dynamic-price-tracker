/**
 * In-process locks so the same work is never scraped twice at once
 * (double clicks, overlapping cron runs, refresh-all during a scheduled update).
 */
const held = new Set();

export const tryAcquire = (key) => {
  if (held.has(key)) return false;
  held.add(key);
  return true;
};
export const release = (key) => held.delete(key);
export const isHeld = (key) => held.has(key);
export const anyHeld = () => held.size > 0;
export const _resetForTests = () => held.clear();
