import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { hasPremium, shouldShowPromo } from "./policy";
import "./index.css";

export default function AnuncioPlanos({ username }) {
  const dialog = useRef(null);

  useEffect(() => {
    let active = true;
    const element = dialog.current;
    const token = localStorage.getItem("access_token");
    if (!username || !token) return;
    const key = `plans-promo:${username}`;
    let timer;
    let waitingToShow = false;

    function showWhenReady() {
      if (!active || !waitingToShow || document.visibilityState !== "visible") return;
      if (localStorage.getItem("access_token") !== token) return;
      // Aguarde outro modal fechar, sem perder esta oportunidade de exibição.
      if (document.querySelector("dialog[open]")) {
        window.clearTimeout(timer);
        timer = window.setTimeout(showWhenReady, 1000);
        return;
      }
      try {
        const latest = JSON.parse(localStorage.getItem(key) || "{}");
        if (!shouldShowPromo(latest, Date.now())) return;
        element.showModal();
        waitingToShow = false;
        localStorage.setItem(key, JSON.stringify({ ...latest, lastShown: Date.now() }));
      } catch { element.close(); }
    }

    async function prepare() {
      try {
        // Cada aba conta uma única visita, inclusive após recarregar ou navegar.
        if (sessionStorage.getItem(key)) return;
        const response = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok || !active) return;
        const account = await response.json();
        if (!active || account.username !== username || localStorage.getItem("access_token") !== token) return;
        sessionStorage.setItem(key, "visited");
        if (hasPremium(account, Date.now())) return;
        const stored = JSON.parse(localStorage.getItem(key) || "{}");
        const state = {
          visits: (Number.isSafeInteger(stored.visits) && stored.visits >= 0 ? stored.visits : 0) + 1,
          lastShown: Number.isFinite(stored.lastShown) ? stored.lastShown : 0,
        };
        localStorage.setItem(key, JSON.stringify(state));
        if (!shouldShowPromo(state, Date.now())) return;

        timer = window.setTimeout(() => {
          waitingToShow = true;
          showWhenReady();
        }, 15000);
      } catch { /* O anúncio é opcional: falhas não interrompem a aplicação. */ }
    }
    document.addEventListener("visibilitychange", showWhenReady);
    prepare();
    return () => {
      active = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", showWhenReady);
      element.close();
    };
  }, [username]);

  function close() { dialog.current.close(); }

  return <dialog ref={dialog} className="plans-promo" aria-labelledby="plans-promo-title" aria-describedby="plans-promo-description" onClick={event => { if (event.target === dialog.current) { const bounds = dialog.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close(); } }}>
    <button className="plans-promo-close" type="button" aria-label="Fechar anúncio de planos" onClick={close} autoFocus>×</button>
    <span className="plans-promo-spark" aria-hidden="true">✦</span>
    <p className="plans-promo-label">CONHEÇA OS PLANOS</p>
    <h2 id="plans-promo-title">Seu próximo passo<br />começa <em>aqui.</em></h2>
    <p id="plans-promo-description">Chat e fechamento de contratos são exclusivos do Premium. Conheça o plano por R$ 29,90/mês, com renovação automática mensal. Novos benefícios por perfil estão em construção. Modo demonstração, sem cobranças.</p>
    <Link className="plans-promo-link" to="/planos" onClick={close}>Conhecer os planos <span aria-hidden="true">↗</span></Link>
    <button className="plans-promo-later" type="button" onClick={close}>Agora não</button>
  </dialog>;
}
