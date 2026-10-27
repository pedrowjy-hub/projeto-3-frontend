import { NavLink } from "react-router";

const tabs = ["Início", "Configurações", "Explorar", "Mensagens", "Avaliações", "Assinatura", "Perfil", "Denúncias"];

export default function Sidebar({ profile }) {
  return <aside className="dash-sidebar">
    <p className="dash-sidebar-label">SEU ESPAÇO</p>
    <nav aria-label="Menu do dashboard">
      {tabs.map((tab, index) => index < 2
        ? <NavLink key={tab} to={index === 0 ? "/inicio" : "/configuracoes"}>{tab}<span aria-hidden="true">↗</span></NavLink>
        : <span className="dash-tab-placeholder" key={tab}>{tab}</span>)}
    </nav>
    <div className="dash-account"><span className="dash-avatar">{profile.nome?.[0] || "U"}</span><div><strong>{profile.nome}</strong><small>{profile.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</small></div></div>
  </aside>;
}
