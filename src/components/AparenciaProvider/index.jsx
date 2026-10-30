import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { DEFAULT_APPEARANCE, accountAppearanceKey, appearanceOwner, applyAppearance, loadBrowserAppearance } from "../../services/aparencia";
import { createAppearanceSync } from "../../services/sincronizarAparencia";
import { AppearanceContext } from "../../hooks/useAppearance";

function accessToken() {
  try { return window.localStorage.getItem("access_token"); } catch { return null; }
}
const unavailableStorage = { getItem() { return null; }, setItem() { throw new Error("indisponível"); } };

export default function AparenciaProvider({ children }) {
  useLocation(); // Login e logout já navegam; a troca de rota faz reler o token.
  const [, authChanged] = useState(0);
  const token = accessToken();
  const username = appearanceOwner(token);
  const [view, setView] = useState(() => ({ owner: username, preferences: loadBrowserAppearance(), loading: !!username, saving: false, error: "", storageError: false }));
  const sync = useRef(null);
  const preferences = view.owner === username ? view.preferences : loadBrowserAppearance();

  useEffect(() => {
    if (!token || !username) { sync.current = null; return; }
    let storage;
    try { storage = window.localStorage; } catch { storage = unavailableStorage; }
    const manager = createAppearanceSync({ token, username, storage,
      onChange: state => setView({ ...state, owner: username }),
    });
    sync.current = manager;
    manager.refresh();
    return () => { manager.stop(); if (sync.current === manager) sync.current = null; };
  }, [token, username]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => applyAppearance(preferences, document.documentElement, media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preferences]);

  useEffect(() => {
    const refresh = () => { sync.current?.refresh(); };
    function onStorage(event) {
      if (event.key === "access_token" || event.key === null) { authChanged(value => value + 1); return; }
      if (username && event.key === accountAppearanceKey(username)) {
        try {
          const data = JSON.parse(event.newValue);
          if (data && !Object.keys(data.pending || {}).length) refresh();
        } catch { /* Uma entrada inválida não substitui o estado autenticado. */ }
      }
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [username]);

  function update(patch) {
    if (sync.current?.username === username) return sync.current.update(patch);
  }
  const current = view.owner === username ? view : { loading: !!username, saving: false, error: "", storageError: false };
  return <AppearanceContext.Provider value={{ ...current, preferences: preferences || DEFAULT_APPEARANCE, update, retry: () => sync.current?.refresh() }}>{children}</AppearanceContext.Provider>;
}
