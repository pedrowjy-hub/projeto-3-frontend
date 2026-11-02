import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import Sidebar from "../Dashboard/Sidebar";
import { getSession } from "../../services/session";
import "../Dashboard/index.css";
import "./index.css";
import { getProfileLocation } from "./location";

const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function ProfileDetails({ profile, isCompany, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return <dialog ref={dialog} className="explore-dialog" aria-labelledby="explore-profile-title" onCancel={onClose}>
    <header><p className="dash-label">CONHEÇA ESTE PERFIL</p><button type="button" onClick={onClose} aria-label="Fechar detalhes">×</button></header>
    <h2 id="explore-profile-title">{profile.nome || profile.username}</h2>
    <p className="dash-handle">@{profile.username}</p>
    <p className="explore-location">{getProfileLocation(profile) || "Localização não informada"}</p>
    <dl><div><dt>Tipo de perfil</dt><dd>{profile.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</dd></div><div><dt>Nicho</dt><dd>{profile.nicho || "Não informado"}</dd></div><div><dt>Sobre</dt><dd>{profile.descricao || "Este perfil ainda não adicionou uma descrição."}</dd></div><div><dt>Plataformas</dt><dd>{profile.plataformas?.join(", ") || "Não informadas"}</dd></div></dl>
    <div className="explore-dialog-actions">
      {isCompany && profile.tipo_perfil === "influenciador" && <Link className="explore-dialog-action explore-dialog-action-primary" to={`/analises/${encodeURIComponent(profile.username)}`}>Ver análise do YouTube <span aria-hidden="true">↗</span></Link>}
      {isCompany && profile.tipo_perfil === "influenciador" && <Link className="explore-dialog-action" to={`/avaliacoes?username=${encodeURIComponent(profile.username)}`}>Ver avaliações <span aria-hidden="true">★</span></Link>}
      <Link className="explore-dialog-action" to={`/mensagens?parceiro=${encodeURIComponent(profile.username)}`}>Conversar e negociar ↗</Link>
      <button className="explore-dialog-action explore-dialog-action-secondary" type="button" onClick={onClose}>Voltar à exploração</button>
    </div>
  </dialog>;
}

export default function Explorar() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("asc");
  const [selected, setSelected] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) { navigate("/login", { replace: true }); return; }
      try {
        const user = await getSession(token);
        if (!active) return;
        if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
        setProfile(user);
        const target = user.tipo_perfil === "empresa" ? "influenciador" : "empresa";
        const response = await fetch(`/api/usuarios?tipo_perfil=${target}`);
        if (!response.ok) throw new Error("Não foi possível carregar os perfis. Tente novamente.");
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Não foi possível carregar os perfis.");
        if (active) setProfiles(data.filter(item => item.tipo_perfil === target && item.username !== user.username));
      } catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [navigate, attempt]);

  const company = profile?.tipo_perfil === "empresa";
  const hasLocations = profiles.some(item => getProfileLocation(item));
  const niches = [...new Set(profiles.map(item => item.nicho).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const platforms = [...new Set(profiles.flatMap(item => item.plataformas || []))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const filtered = profiles.filter(item =>
    (!niche || item.nicho === niche) && (!platform || item.plataformas?.includes(platform)) &&
    (!location.trim() || normalize(getProfileLocation(item)).includes(normalize(location))) &&
    normalize([item.nome, item.username, item.nicho, item.descricao, ...(item.plataformas || [])].join(" ")).includes(normalize(search))
  ).sort((a, b) => (sort === "asc" ? 1 : -1) * (a.nome || a.username).localeCompare(b.nome || b.username, "pt-BR"));
  function clearFilters() { setSearch(""); setNiche(""); setPlatform(""); setLocation(""); setSort("asc"); }
  if (!profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando seu espaço…"}</p>{error && <a href="/login">Voltar ao login</a>}</main>;

  return <main className="dash-page explore-page">
    <Sidebar profile={profile} active="Explorar" />
    <div className="dash-content">
      <header className="dash-header"><div><p className="dash-label">DESCUBRA NOVAS CONEXÕES</p><h1>Explorar<span> ✦</span></h1></div><span className="dash-role">{company ? "Empresa" : "Influenciador"}</span></header>
      <section className="explore-intro"><p className="dash-label">{company ? "TALENTOS PARA SUA MARCA" : "MARCAS PARA CONHECER"}</p><h2>{company ? "Encontre seu próximo parceiro criativo." : "Conheça empresas que combinam com você."}</h2><p>{company ? "Explore influenciadores por nicho e plataforma e descubra novas possibilidades de colaboração." : "Explore perfis de empresas por nicho e plataforma para descobrir possíveis conexões."}</p></section>
      <section className="explore-filters" aria-label="Filtros de perfis">
        <label className="explore-search">Buscar<input type="search" placeholder="Nome, nicho ou palavra-chave" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <label>Nicho<select value={niche} onChange={e => setNiche(e.target.value)}><option value="">Todos os nichos</option>{niches.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Plataforma<select value={platform} onChange={e => setPlatform(e.target.value)}><option value="">Todas as plataformas</option>{platforms.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="explore-location-filter">Localização<input type="search" placeholder="Cidade ou estado" value={location} onChange={e => setLocation(e.target.value)} aria-describedby={!loading && !error && !hasLocations ? "explore-location-help" : undefined} /></label>
        <button className="explore-clear" type="button" onClick={clearFilters}>Limpar filtros</button>
        {!loading && !error && !hasLocations && <p className="explore-location-help" id="explore-location-help">Os perfis disponíveis ainda não possuem localização informada.</p>}
      </section>
      <section aria-labelledby="explore-results-title" aria-busy={loading}>
        <div className="explore-results-header"><div><h2 id="explore-results-title">{company ? "Influenciadores" : "Empresas"}</h2><p role="status">{loading ? "Buscando perfis…" : error ? "Perfis indisponíveis" : `${filtered.length} ${filtered.length === 1 ? "perfil encontrado" : "perfis encontrados"}`}</p></div><label>Ordenar por<select value={sort} onChange={e => setSort(e.target.value)}><option value="asc">Nome: A–Z</option><option value="desc">Nome: Z–A</option></select></label></div>
        {loading ? <div className="dash-empty" role="status">Carregando perfis…</div> : error ? <div className="dash-empty"><p role="alert">{error}</p><button className="explore-primary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div> : filtered.length === 0 ? <div className="dash-empty"><span aria-hidden="true">⌕</span><h3>{profiles.length ? "Nenhum perfil encontrado" : "Novas conexões em breve"}</h3><p>{profiles.length ? "Tente outra busca ou remova os filtros." : "Os perfis cadastrados aparecerão aqui."}</p>{profiles.length > 0 && <button className="explore-clear" onClick={clearFilters}>Limpar filtros</button>}</div> : <div className="dash-grid">{filtered.map((item, index) => <article className="dash-card" key={item.username}><div className={`dash-card-cover dash-cover-${index % 3}`}><span>{(item.nome || item.username).slice(0, 2).toUpperCase()}</span><small>{company ? "CREATOR" : "EMPRESA"}</small></div><div className="dash-card-body"><h3>{item.nome || item.username}</h3><p className="dash-handle">@{item.username}</p><p className="dash-niche">{item.nicho || "Nicho não informado"}</p><p className="dash-bio">{item.descricao || "Conheça este perfil e descubra novas possibilidades de parceria."}</p><div className="dash-platforms">{(item.plataformas || []).map(value => <span key={value}>{value}</span>)}</div><button className="explore-card-button" type="button" onClick={() => setSelected(item)}>Conhecer perfil <span>↗</span></button></div></article>)}</div>}
      </section>
    </div>
    {selected && <ProfileDetails profile={selected} isCompany={company} onClose={() => setSelected(null)} />}
  </main>;
}
