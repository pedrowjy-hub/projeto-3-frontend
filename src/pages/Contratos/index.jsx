import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Sidebar from "../Dashboard/Sidebar";
import { getSession } from "../../services/session";
import { hasActivePremium } from "../../services/assinatura";
import usePremiumStatus from "../../hooks/usePremiumStatus";
import { listarContratos } from "../../services/contratos";
import ContratoCard from "../../components/ContratosDaConversa/ContratoCard";
import "../Dashboard/index.css";
import "./index.css";

export default function Contratos() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null), [contracts, setContracts] = useState([]);
  const [error, setError] = useState(""), [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0);
  const { premium } = usePremiumStatus(profile);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      const token = localStorage.getItem("access_token");
      if (!token) { navigate("/login", { replace: true }); return; }
      try {
        const user = await getSession(token);
        if (!active) return;
        if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
        setProfile(user);
        if (hasActivePremium(user, Date.now())) {
          const data = await listarContratos(token, controller.signal);
          if (active) setContracts(data);
        }
      } catch (err) { if (active) { if ([401, 422].includes(err.status)) navigate("/login", { replace: true }); else setError(err.message); } }
      finally { if (active) setLoading(false); }
    }
    load(); return () => { active = false; controller.abort(); };
  }, [navigate, attempt]);
  if (!profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando contratos…"}</p>{error && <button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}</main>;
  return <main className="dash-page contracts-page"><Sidebar profile={profile} /><div className="dash-content">
    <header className="dash-header"><div><p className="dash-label">ACORDOS COM CLAREZA</p><h1>Contratos<span> ✦</span></h1></div><span className="dash-role">{profile.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</span></header>
    <section className="contracts-intro"><h2>Cada acordo tem uma conversa.</h2><p>Crie, revise e assine os documentos dentro da negociação com seu parceiro. Aqui você encontra os contratos reunidos e pode voltar à conversa de origem.</p><Link className="contracts-button contracts-primary" to={premium ? "/mensagens" : "/planos"}>{premium ? "Abrir mensagens ↗" : "Conhecer o Premium ↗"}</Link></section>
    {premium && <><div className="contracts-list-heading"><h2>Seus acordos</h2><button className="contracts-button" disabled={loading} onClick={() => setAttempt(value => value + 1)}>Atualizar lista</button></div>
    {error && <p role="alert" className="contracts-error">{error}</p>}{loading ? <p role="status">Carregando…</p> : contracts.length ? contracts.map(contract => <ContratoCard key={contract.id} contrato={contract} profile={profile} onUpdate={updated => setContracts(previous => previous.map(item => item.id === updated.id ? updated : item))} />) : <div className="dash-empty"><h3>Seu primeiro acordo começa no chat.</h3><p>Abra uma conversa e prepare o documento com seu parceiro.</p></div>}</>}
  </div></main>;
}
