import { Link, NavLink } from "react-router";
import PlanoBadge from "../../components/PlanoBadge";
import BoasVindasPremium from "../../components/BoasVindasPremium";
import usePremiumStatus from "../../hooks/usePremiumStatus";

const tabs = ["Início", "Configurações", "Explorar", "Postagens", "Mensagens", "Contratos", "Avaliações", "Planos", "Perfil", "Denúncias"];

const routes = { "Início": "/inicio", "Configurações": "/configuracoes", "Explorar": "/explorar", "Postagens": "/postagens", "Mensagens": "/mensagens", "Contratos": "/contratos", "Planos": "/planos", "Perfil": "/perfil" };

export default function Sidebar({ profile }) {
  const { premium } = usePremiumStatus(profile);
  return <><BoasVindasPremium username={profile.username} subscriptionId={profile.paddle_subscription_id} premium={premium} /><aside className="dash-sidebar">
    <p className="dash-sidebar-label">SEU ESPAÇO</p>
    <nav aria-label="Menu do dashboard">
      {tabs.map((tab) => routes[tab]
        ? <NavLink key={tab} to={routes[tab]} end={tab === "Início"}>{({ isActive }) => <>{tab}{isActive && <span aria-hidden="true">↗</span>}</>}</NavLink>
        : <span className="dash-tab-placeholder" key={tab}>{tab}</span>)}
    </nav>
    <div className="dash-account"><span className={`dash-avatar${premium ? " dash-avatar-premium" : ""}`}>{profile.nome?.[0] || "U"}</span><div><strong>{profile.nome}</strong><small>{profile.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</small><Link className="dash-account-plan" to="/planos" aria-label={`Seu plano é ${premium ? "Premium" : "Gratuito"}. Ver planos.`}><PlanoBadge premium={premium} /></Link></div></div>
  </aside></>;
}
