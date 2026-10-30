import { accountAppearanceKey, DEFAULT_APPEARANCE, normalizeAppearance, readAccountAppearance } from "./aparencia.js";

const URL = "/api/usuarios/me/preferencias";

async function request(token, patch, signal) {
  const response = await fetch(URL, {
    method: patch ? "PATCH" : "GET", signal,
    headers: { Authorization: `Bearer ${token}`, ...(patch ? { "Content-Type": "application/json" } : {}) },
    ...(patch ? { body: JSON.stringify(patch) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error([401, 422].includes(response.status)
    ? "Sua sessão expirou. Entre novamente para sincronizar."
    : data?.erro || "Não foi possível sincronizar suas preferências.");
  if (!data?.preferencias || typeof data.preferencias !== "object" || Array.isArray(data.preferencias)) {
    throw new Error("O servidor não retornou suas preferências. Tente novamente.");
  }
  return normalizeAppearance(data.preferencias);
}

export function createAppearanceSync({ token, username, storage, onChange }) {
  let { preferences, pending } = readAccountAppearance(storage, username);
  let active = true, loading = false, saving = false, error = "", inFlight = {}, storageError = false;
  const controller = new AbortController();
  function emit() {
    if (active) onChange({ preferences: { ...preferences }, loading, saving, error, storageError });
  }
  function persist() {
    try {
      const key = accountAppearanceKey(username);
      const value = JSON.stringify({ preferences, pending: { ...inFlight, ...pending } });
      if (storage.getItem(key) !== value) storage.setItem(key, value);
      storageError = false;
    } catch { storageError = true; }
  }
  async function flush() {
    if (!active || loading || saving) return;
    saving = true;
    error = "";
    emit();
    try {
      while (active && Object.keys(pending).length) {
        inFlight = { ...pending };
        pending = {};
        persist();
        const saved = await request(token, inFlight, controller.signal);
        if (!active) return;
        preferences = normalizeAppearance({ ...saved, ...pending });
        inFlight = {};
        persist();
        emit();
      }
    } catch (err) {
      if (!active) return;
      pending = { ...inFlight, ...pending };
      inFlight = {};
      error = err.message;
      persist();
    } finally {
      saving = false;
      emit();
    }
  }
  async function refresh() {
    if (!active || loading || saving) return;
    loading = true;
    error = "";
    emit();
    try {
      const remote = await request(token, null, controller.signal);
      if (!active) return;
      preferences = normalizeAppearance({ ...remote, ...pending });
      persist();
    } catch (err) {
      if (active) error = err.message;
    } finally {
      loading = false;
      emit();
    }
    if (active && !error && Object.keys(pending).length) await flush();
  }
  function update(patch) {
    if (!active) return;
    const next = normalizeAppearance({ ...preferences, ...patch });
    for (const key of Object.keys(DEFAULT_APPEARANCE)) {
      if (Object.hasOwn(patch, key)) pending[key] = next[key];
    }
    preferences = next;
    persist();
    emit();
    return flush();
  }
  return { username, refresh, update, stop() { active = false; controller.abort(); }, snapshot() { return { preferences, pending }; } };
}
