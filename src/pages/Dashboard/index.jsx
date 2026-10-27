import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getSession } from "../../services/session";
import Sidebar from "./Sidebar";
import "./index.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [creators, setCreators] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const token = localStorage.getItem("access_token");
      if (!token) { navigate("/login", { replace: true }); return; }
      try {
        const user = await getSession(token);
        if (!active) return;
        if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
        setProfile(user);
        if (user.tipo_perfil === "empresa") {
          const response = await fetch("/api/usuarios?tipo_perfil=influenciador");
          if (!response.ok) throw new Error("Não foi possível carregar os influenciadores.");
          const data = await response.json();
          if (active) setCreators(data);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [navigate]);

  if (!profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando seu espaço…"}</p>{error && <a href="/login">Voltar ao login</a>}</main>;
  const company = profile.tipo_perfil === "empresa";
  const filtered = creators.filter(c => [c.nome, c.username, c.nicho].some(value => String(value || "").toLowerCase().includes(search.toLowerCase())));

  return <main className="dash-page">
    <Sidebar profile={profile} />
    <div className="dash-content">
      <header className="dash-header"><div><p className="dash-label">INÍCIO</p><h1>Olá, {profile.nome?.split(" ")[0] || profile.username}<span> ✦</span></h1></div><span className="dash-role">{company ? "Empresa" : "Influenciador"}</span></header>
      <section className="dash-welcome">
        <div><p className="dash-label">BOAS PARCERIAS COMEÇAM AQUI</p><h2>{company ? <>Encontre quem dá vida<br />à sua <em>marca.</em></> : <>Sua próxima parceria<br />começa <em>aqui.</em></>}</h2><p>{company ? "Conecte sua marca a creators que compartilham dos seus objetivos." : "Descubra oportunidades publicadas por empresas e transforme boas ideias em parcerias."}</p><a href="#dash-results">{company ? "Encontrar influenciadores" : "Ver oportunidades"} <span>↓</span></a></div>
        <span className="dash-decoration" aria-hidden="true">✦</span>
      </section>
      <section id="dash-results" className="dash-results">
        <div className="dash-results-header"><div><p className="dash-label">{company ? "TALENTOS DA COMUNIDADE" : "NOVAS CONEXÕES"}</p><h2>{company ? "Influenciadores para conhecer" : "Oportunidades de parceria"}</h2></div>{company && <label className="dash-search"><span>Buscar influenciadores</span><input type="search" placeholder="Nome ou nicho" value={search} onChange={e => setSearch(e.target.value)} /></label>}</div>
        {error ? <p className="dash-empty" role="alert">{error}</p> : loading ? <p role="status">Carregando influenciadores…</p> : company ? <div className="dash-grid">{filtered.map((creator, i) => <article className="dash-card" key={creator.username}>
          <div className={`dash-card-cover dash-cover-${i % 3}`}><span>{(creator.nome || creator.username).slice(0, 2).toUpperCase()}</span><small>CREATOR</small></div>
          <div className="dash-card-body"><h3>{creator.nome || creator.username}</h3><p className="dash-handle">@{creator.username}</p><p className="dash-niche">{creator.nicho || "Nicho não informado"}</p><p className="dash-bio">{creator.descricao || "Conheça este creator e descubra novas possibilidades de parceria."}</p><div className="dash-platforms">{(creator.plataformas || []).map(platform => <span key={platform}>{platform}</span>)}</div></div>
        </article>)}{filtered.length === 0 && <div className="dash-empty"><h3>{search ? "Nenhum resultado encontrado" : "Novos talentos em breve"}</h3><p>{search ? "Tente buscar por outro nome ou nicho." : "Os influenciadores cadastrados aparecerão aqui."}</p></div>}</div> : <div className="dash-empty"><span aria-hidden="true">↗</span><h3>Boas oportunidades estão por vir.</h3><p>As campanhas publicadas pelas empresas aparecerão aqui quando estiverem disponíveis.</p></div>}
      </section>
    </div>
  </main>;
}
