import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Sidebar from "../Dashboard/Sidebar";
import { hasActivePremium } from "../../services/assinatura";
import "../Dashboard/index.css";
import "./index.css";

export default function RecursosPremium({ recurso }) {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [premium, setPremium] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const title = recurso === "contratos" ? "Contratos" : "Mensagens";

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/login", { replace: true }); return; }
    async function load() {
      try {
        const response = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!active) return;
        if ([401, 422].includes(response.status)) { navigate("/login", { replace: true }); return; }
        if (!response.ok) throw new Error("Não foi possível verificar sua assinatura. Tente novamente.");
        const user = await response.json();
        if (!active) return;
        if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
        setAccount(user);
        setPremium(hasActivePremium(user, Date.now()));
      } catch (err) { if (active) setError(err.message); }
    }
    load();
    return () => { active = false; };
  }, [navigate, attempt]);

  if (!account) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Verificando sua assinatura…"}</p>{error && <button type="button" className="premium-access-button" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Tentar novamente</button>}</main>;

  return <main className="dash-page premium-access-page">
    <Sidebar profile={account} />
    <div className="dash-content">
      <header className="dash-header"><div><p className="dash-label">PARCERIAS COM MAIS POSSIBILIDADES</p><h1>{title}<span> ✦</span></h1></div><span className="dash-role">{account.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</span></header>
      <section className="premium-access-card" aria-labelledby="premium-access-title">
        <span className="premium-access-icon" aria-hidden="true">{premium ? "✦" : "◇"}</span>
        <p className="dash-label">{premium ? "EM CONSTRUÇÃO" : "EXCLUSIVO PREMIUM"}</p>
        <h2 id="premium-access-title">{premium ? recurso === "contratos" ? "Seus próximos acordos, em breve." : "Novas conversas estão por vir." : recurso === "contratos" ? "Feche contratos com o Premium." : "Converse com o Premium."}</h2>
        <p>{premium ? recurso === "contratos" ? "Sua assinatura permite acessar este espaço. O fluxo de criação e fechamento de contratos está em construção." : "Sua assinatura permite acessar este espaço. A interface de chat está em construção." : "O chat e o fechamento de contratos são exclusivos para usuários com assinatura Premium ativa, tanto empresas quanto influenciadores."}</p>
        <Link className="premium-access-button" to={premium ? "/explorar" : "/planos"}>{premium ? "Continuar explorando" : "Conhecer o Premium · R$ 29,90/mês"} <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  </main>;
}
