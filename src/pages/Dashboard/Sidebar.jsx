import "./refinements.css";
import FotoPerfil from "../../components/FotoPerfil";
import { Link, NavLink, useNavigate } from "react-router";
import PlanoBadge from "../../components/PlanoBadge";
import BoasVindasPremium from "../../components/BoasVindasPremium";
import usePremiumStatus from "../../hooks/usePremiumStatus";

const tabs = ["Início", "Explorar", "Postagens", "Mensagens", "Contratos", "Avaliações", "Análise", "Planos", "Denúncias", "Configurações"];
const icons = { "Início": "⌂", "Explorar": "⌕", "Postagens": "▤", "Mensagens": "✉", "Contratos": "▧", "Avaliações": "☆", "Análise": "▥", "Planos": "✦", "Denúncias": "◇", "Configurações": "⚙" };

const routes = { "Análise": "/analises", "Início": "/inicio", "Configurações": "/configuracoes", "Explorar": "/explorar", "Postagens": "/postagens", "Mensagens": "/mensagens", "Contratos": "/contratos", "Avaliações": "/avaliacoes", "Planos": "/planos", "Denúncias": "/denuncias" };

export default function Sidebar({ profile }) {
  const navigate = useNavigate();
  const { premium } = usePremiumStatus(profile);
  function handleSair() {
    localStorage.removeItem("access_token");
    navigate("/login", { replace: true });
  }

  return <><BoasVindasPremium username={profile.username} subscriptionId={profile.paddle_subscription_id} premium={premium} /><aside className="dash-sidebar">
    <p className="dash-sidebar-label">SEU ESPAÇO</p>
    <nav aria-label="Menu do dashboard">
      {tabs.filter(tab => tab !== "Análise" || profile.tipo_perfil === "influenciador").map((tab) => routes[tab]
        ? <NavLink className={tab === "Planos" || tab === "Configurações" ? "dash-nav-divider" : undefined} key={tab} to={routes[tab]} end={tab === "Início"}>{({ isActive }) => <><span className="dash-nav-copy"><span className="dash-nav-icon" aria-hidden="true">{icons[tab]}</span>{tab}</span>{isActive && <span aria-hidden="true">↗</span>}</>}</NavLink>
        : <span className="dash-tab-placeholder" key={tab}>{tab}</span>)}
    </nav>
    <div className="dash-account"><span className={`dash-avatar${premium ? " dash-avatar-premium" : ""}`}><FotoPerfil profile={profile} /></span><div className="dash-account-details"><div className="dash-account-name"><strong>{profile.nome}</strong><NavLink to="/perfil" className="dash-profile-link" aria-label="Abrir meu perfil" title="Meu perfil"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></NavLink></div><small>{profile.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</small><Link className="dash-account-plan" to="/planos" aria-label={`Seu plano é ${premium ? "Premium" : "Gratuito"}. Ver planos.`}><PlanoBadge premium={premium} /></Link></div></div>
    <button className="dash-signout" type="button" onClick={handleSair}><span aria-hidden="true">↪</span>Sair da conta</button>
  </aside></>;
}
