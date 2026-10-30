export const APPEARANCE_KEY = "nexo:aparencia:v1";
export const DEFAULT_APPEARANCE = Object.freeze({ tema: "claro", fonte: "padrao", cor: "verde", reduzirMovimento: false, altoContraste: false });

export function normalizeAppearance(value) {
  const data = value && typeof value === "object" ? value : {};
  return {
    tema: ["claro", "escuro", "sistema"].includes(data.tema) ? data.tema : DEFAULT_APPEARANCE.tema,
    fonte: ["padrao", "grande", "maior"].includes(data.fonte) ? data.fonte : DEFAULT_APPEARANCE.fonte,
    cor: ["verde", "azul", "ameixa"].includes(data.cor) ? data.cor : DEFAULT_APPEARANCE.cor,
    reduzirMovimento: data.reduzirMovimento === true,
    altoContraste: data.altoContraste === true,
  };
}

export function readAppearance(storage) {
  try { return normalizeAppearance(JSON.parse(storage.getItem(APPEARANCE_KEY))); }
  catch { return { ...DEFAULT_APPEARANCE }; }
}

export function saveAppearance(storage, preferences) {
  try { storage.setItem(APPEARANCE_KEY, JSON.stringify(normalizeAppearance(preferences))); return true; }
  catch { return false; }
}

export function applyAppearance(preferences, root, systemDark) {
  const value = normalizeAppearance(preferences);
  root.dataset.theme = value.tema === "sistema" ? (systemDark ? "escuro" : "claro") : value.tema;
  root.dataset.fontSize = value.fonte;
  root.dataset.accent = value.cor;
  root.dataset.reduceMotion = String(value.reduzirMovimento);
  root.dataset.highContrast = String(value.altoContraste);
}

export function loadBrowserAppearance() {
  try {
    const username = appearanceOwner(window.localStorage.getItem("access_token"));
    return username ? readAccountAppearance(window.localStorage, username).preferences : { ...DEFAULT_APPEARANCE };
  }
  catch { return { ...DEFAULT_APPEARANCE }; }
}

// O token identifica somente a chave do cache; o backend sempre valida a autenticação.
export function appearanceOwner(token) {
  try {
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), char => char.charCodeAt(0))));
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch { return null; }
}

export function accountAppearanceKey(username) { return `${APPEARANCE_KEY}:${encodeURIComponent(username)}`; }

export function readAccountAppearance(storage, username) {
  try {
    const value = JSON.parse(storage.getItem(accountAppearanceKey(username)));
    const preferences = normalizeAppearance(value?.preferences);
    const pending = {};
    if (value?.pending && typeof value.pending === "object") {
      for (const key of Object.keys(DEFAULT_APPEARANCE)) {
        if (Object.hasOwn(value.pending, key)) pending[key] = normalizeAppearance(value.pending)[key];
      }
    }
    return { preferences: normalizeAppearance({ ...preferences, ...pending }), pending };
  } catch { return { preferences: { ...DEFAULT_APPEARANCE }, pending: {} }; }
}

export function initializeAppearance() {
  applyAppearance(loadBrowserAppearance(), document.documentElement, window.matchMedia("(prefers-color-scheme: dark)").matches);
}
