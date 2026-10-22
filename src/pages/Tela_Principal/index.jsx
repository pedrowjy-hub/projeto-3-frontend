import "./index.css";

const creators = [
  {
    name: "Camila Nunes",
    handle: "@camilanunes",
    place: "São Paulo, SP",
    category: "Fashion  Lifestyle",
    followers: "482 mil",
    engagement: "5,8%",
    projects: "32",
    rating: "4,9",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=85",
    featured: true,
  },
  {
    name: "Maya Ferreira",
    handle: "@mayacomcamera",
    place: "Rio de Janeiro, RJ",
    category: "Travel  Fotografia",
    followers: "238 mil",
    engagement: "7,2%",
    projects: "19",
    rating: "5,0",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Lucas Meilhac",
    handle: "@lucasemdia",
    place: "Belo Horizonte, MG",
    category: "Fitness  Wellness",
    followers: "615 mil",
    engagement: "4,9%",
    projects: "44",
    rating: "4,8",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85",
  },
];

const steps = [
  ["01", "Crie seu perfil", "Conte sua história, mostre seu trabalho e defina seus objetivos."],
  ["02", "Encontre seu match", "Filtros inteligentes conectam você às parcerias mais relevantes."],
  ["03", "Feche com segurança", "Propostas claras, contratos organizados e pagamentos protegidos."],
  ["04", "Construa reputação", "Avaliações dos dois lados criam uma comunidade de confiança."],
];

const campaigns = [
  ["AURA BELEZA", "Campanha de verão — skincare", "R$ 4.500 – 7.000", "Até 12 jun"],
  ["VIVA MODA", "Lançamento coleção Move", "R$ 3.000 – 5.500", "Até 18 jun"],
  ["nativa BEM-ESTAR", "Rotina saudável de verdade", "R$ 2.800 – 4.200", "Até 21 jun"],
];

export default function TelaPrincipal() {
  return (
    <main className="nexo-page">
      <section className="nexo-hero">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <nav className="nexo-nav" aria-label="Navegação principal">
          <div className="nav-links">
            <a href="#creators">Creators</a><a href="#como-funciona">Como funciona</a><a href="#oportunidades">Oportunidades</a>
          </div>
          <a className="nav-login" href="/login">Entrar <span>↗</span></a>
          <button className="nav-menu" aria-label="Abrir menu">☰</button>
        </nav>

        <div className="hero-content" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow"><span>✦</span> Onde boas parcerias começam</p>
            <h1>Encontre.<br />Conecte.<br /><em>Crie.</em></h1>
            <p className="hero-description">A plataforma que aproxima marcas e creators para transformar boas ideias em parcerias que geram resultado.</p>
            <div className="audience-switch">
              <button className="selected">Sou uma empresa</button>
              <button>Sou creator</button>
            </div>
            <label className="hero-search"><span>⌕</span><input placeholder="Busque por nicho, nome ou cidade" /><button aria-label="Buscar">→</button></label>
            <a className="text-link" href="#creators">Explorar agora <span>↘</span></a>
          </div>

          <div className="hero-visual">
            <div className="visual-topline"><span>COMUNIDADE CRIATIVA</span><i /></div>
            <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=90" alt="Creator fotografando conteúdo para uma campanha" />
            <div className="creator-bubble"><small>CREATOR EM DESTAQUE</small><strong>Maya Ferreira <b>✓</b></strong><span>Fotografia · Lifestyle</span></div>
            <div className="match-badge"><b>98%</b><span>match</span></div>
            <div className="stat-card closed"><small>PROJETOS FECHADOS</small><b>12.8 mil</b></div>
            <div className="stat-card rating"><small>NOTA MÉDIA</small><b>4,9 <em>/ 5</em></b></div>
          </div>
        </div>
      </section>

      <section className="nexo-numbers" aria-label="Números da plataforma">
        {[["2.4k+", "creators verificados"], ["680+", "marcas ativas"], ["12.8k", "parcerias realizadas"], ["R$ 18mi", "gerados em negócios"]].map(([number, text]) => <div key={number}><b>{number}</b><span>{text}</span></div>)}
      </section>

      <section className="creators-section" id="creators">
        <div className="section-heading">
          <div><p className="section-label">TALENTOS EM DESTAQUE</p><h2>Creators que fazem<br /><em>acontecer.</em></h2></div>
          <a className="outline-link" href="#oportunidades">Ver todos os creators <span>→</span></a>
        </div>
        <div className="filters"><button className="active">Todos</button><button>Moda</button><button>Viagem</button><button>Esporte</button></div>
        <div className="creator-grid">
          {creators.map((creator) => <article className="creator-card" key={creator.name}>
            <div className="creator-image"><img src={creator.image} alt={creator.name} /><button aria-label={`Adicionar ${creator.name} aos favoritos`}>♡</button>{creator.featured && <span className="featured">EM DESTAQUE</span>}</div>
            <div className="creator-details"><div className="creator-title"><div><h3>{creator.name} <b>✓</b></h3><p>{creator.handle} &nbsp;·&nbsp; {creator.place}</p></div><span className="score">★ {creator.rating}</span></div><p className="category">{creator.category}</p><div className="creator-stats"><span><b>{creator.followers}</b><small>SEGUIDORES</small></span><span><b>{creator.engagement}</b><small>ENGAJAMENTO</small></span><span><b>{creator.projects}</b><small>TRABALHOS</small></span></div></div>
          </article>)}
        </div>
      </section>

      <section className="how-section" id="como-funciona">
        <div className="how-intro"><p className="section-label">SIMPLES E SEGURO</p><h2>Da conexão ao<br /><em>resultado.</em></h2><p>Tudo o que marcas e creators precisam para construir relações transparentes e profissionais.</p><a className="dark-button" href="#oportunidades">Começar agora <span>→</span></a></div>
        <div className="steps">{steps.map(([number, title, description]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div>
      </section>

      <section className="opportunities-section" id="oportunidades"><p className="section-label">OPORTUNIDADES ABERTAS</p><h2>Seu próximo job pode<br />estar <em>aqui.</em></h2><p className="opportunities-copy">Campanhas verificadas, com briefing claro e orçamento transparente.</p><div className="campaign-list">{campaigns.map(([brand, title, value, deadline]) => <article key={brand}><div className="campaign-logo">{brand}</div><div className="campaign-info"><h3>{title}</h3><p><span>INVESTIMENTO</span> {value} <i /> {deadline}</p></div><button aria-label={`Ver ${title}`}>↗</button></article>)}</div></section>

      <section className="nexo-cta"><div className="cta-orbit" /><p className="section-label">VAMOS COMEÇAR?</p><h2>Boas parcerias não<br />acontecem <em>por acaso.</em></h2><p>Elas começam aqui. Entre para uma comunidade onde talento encontra oportunidade e confiança vira resultado.</p><div><a className="dark-button" href="/login">Quero encontrar creators <span>→</span></a><a className="light-button" href="/login">Quero encontrar trabalhos <span>→</span></a></div><small>Comece grátis &nbsp;·&nbsp; Cancele quando quiser &nbsp;·&nbsp; Suporte humano</small></section>

      <footer className="nexo-footer"><div><a href="#inicio">Sobre</a><a href="#como-funciona">Segurança</a><a href="#oportunidades">Planos</a><a href="#inicio">Central de ajuda</a></div><p>© 2025. Feito para boas conexões.</p><span>Brasil · Português</span></footer>
    </main>
  );
}
