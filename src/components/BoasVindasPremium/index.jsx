import { useEffect, useRef } from "react";
import "./index.css";

const welcomed = new Set();

export default function BoasVindasPremium({ username, subscriptionId, premium }) {
  const dialog = useRef(null);

  useEffect(() => {
    if (!premium || !username) return;
    const key = `premium-welcome:${username}:${subscriptionId || "legacy"}`;
    if (welcomed.has(key)) return;
    try { if (localStorage.getItem(key)) return; } catch { /* Use a memória se o armazenamento estiver indisponível. */ }

    const element = dialog.current;
    let timer;
    function show() {
      if (document.visibilityState !== "visible") return;
      // O checkout e as confirmações devem terminar antes das boas-vindas.
      const checkoutVisible = [...document.querySelectorAll(".paddle-frame")].some(frame =>
        frame.getClientRects().length > 0 && window.getComputedStyle(frame).visibility !== "hidden"
      );
      if (document.querySelector("dialog[open]") || checkoutVisible) {
        timer = window.setTimeout(show, 500);
        return;
      }
      if (welcomed.has(key)) return;
      try { if (localStorage.getItem(key)) return; } catch { /* A memória mantém o controle nesta sessão. */ }
      element.showModal();
      welcomed.add(key);
      try { localStorage.setItem(key, "shown"); } catch { /* O popup continua disponível sem armazenamento. */ }
    }
    function onVisible() {
      window.clearTimeout(timer);
      timer = window.setTimeout(show, 0);
    }
    timer = window.setTimeout(show, 0);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      element.close();
    };
  }, [premium, username, subscriptionId]);

  function close() { dialog.current.close(); }

  return <dialog ref={dialog} className="premium-welcome" aria-labelledby="premium-welcome-title" aria-describedby="premium-welcome-description">
    <button className="premium-welcome-close" type="button" aria-label="Fechar boas-vindas" onClick={close}>×</button>
    <span className="premium-welcome-spark" aria-hidden="true">✦</span>
    <p className="premium-welcome-label">UM NOVO CAPÍTULO</p>
    <h2 id="premium-welcome-title">Parabéns!<br />Você agora é <em>Premium.</em></h2>
    <p id="premium-welcome-description">Sua assinatura está ativa. Obrigado por fazer parte dessa nova etapa e construir novas conexões com a gente!</p>
    <p className="premium-welcome-note">Acompanhe sua assinatura e conheça todos os benefícios na aba Planos. Os recursos em construção serão indicados por lá.</p>
    <button className="premium-welcome-button" type="button" onClick={close} autoFocus>Vamos começar <span aria-hidden="true">↗</span></button>
  </dialog>;
}
