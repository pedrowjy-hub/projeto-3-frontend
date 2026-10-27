import { NavLink } from "react-router";

const tabs = ["Início", "Configurações", "Explorar", "Postagens", "Mensagens", "Avaliações", "Assinatura", "Perfil", "Denúncias"];

const routes = { "Início": "/inicio", "Configurações": "/configuracoes", "Explorar": "/explorar", "Postagens": "/postagens" };

export default function Sidebar({ profile }) {
  return <aside className="dash-sidebar">
    <p className="dash-sidebar-label">SEU ESPAÇO</p>
    <nav aria-label="Menu do dashboard">
      {tabs.map((tab) => routes[tab]
        ? <NavLink key={tab} to={routes[tab]}>{({ isActive }) => <>{tab}{isActive && <span aria-hidden="true">↗</span>}</>}</NavLink>
        : <span className="dash-tab-placeholder" key={tab}>{tab}</span>)}
    </nav>
    <div className="dash-account"><span className="dash-avatar">{profile.nome?.[0] || "U"}</span><div><strong>{profile.nome}</strong><small>{profile.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</small></div></div>
  </aside>;
}
