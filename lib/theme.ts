type Theme = "light" | "dark";

const STORAGE_KEY = "audio-decisions-live:theme";

/**
 * Applies the theme chosen with the theme button, or else the system's. It
 * runs in the page head, before the first paint, so the page never shows the
 * other theme first.
 */
export const THEME_SCRIPT = `(() => {
  let theme = null;
  try {
    theme = localStorage.getItem("${STORAGE_KEY}");
  } catch {}
  document.documentElement.dataset.theme =
    theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
})();`;

export function toggleTheme() {
  const root = document.documentElement;
  const theme: Theme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The theme still applies until the page is reloaded.
  }
}
