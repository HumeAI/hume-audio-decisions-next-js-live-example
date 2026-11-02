/** Formats milliseconds as m:ss, with tenths of a second when not whole. */
export function formatTime(ms: number): string {
  const tenths = Math.round(ms / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  const fraction = tenths % 10;
  return `${String(minutes)}:${String(seconds).padStart(2, "0")}${fraction ? `.${String(fraction)}` : ""}`;
}
