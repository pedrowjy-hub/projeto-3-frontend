import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getSession } from "../../services/session";
import Sidebar from "../Dashboard/Sidebar";
import "./index.css";

const numberFormat = new Intl.NumberFormat("pt-BR");
const compactFormat = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const chartColors = ["#158466", "#df704f", "#626bd1"];
const metricOptions = [
  { key: "seguidores", label: "Inscritos", shortLabel: "Inscritos" },
  { key: "visualizacoes_totais", label: "Visualizações totais", shortLabel: "Visualizações" },
];

function formatDate(value) {
  if (!value) return "Data indisponível";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function metricValue(value) {
  return value == null ? "—" : numberFormat.format(value);
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.erro || data.msg || "Não foi possível concluir a solicitação.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function filterHistory(history, period, endDate) {
  if (period === "all" || !endDate) return history;
  const end = new Date(`${endDate}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() - Number(period));
  const start = end.toISOString().slice(0, 10);
  return history.filter((item) => item.data_referencia >= start && item.data_referencia <= endDate);
}

function metricChange(history, metric, period, endDate) {
  const points = filterHistory(history, period, endDate)
    .map((item) => item.metricas?.[metric])
    .filter(Number.isFinite);
  if (points.length < 2) return null;
  const start = points[0];
  const end = points[points.length - 1];
  if (start === 0) return end === 0 ? "0%" : "Novo crescimento";
  const percent = ((end - start) / start) * 100;
  return `${percent > 0 ? "+" : ""}${percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function averageRecentViews(snapshot) {
  const values = (snapshot?.videos_recentes || [])
    .map((video) => video.visualizacoes)
    .filter(Number.isFinite);
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function HistoryChart({ profiles, metric, period, comparison, onMetricChange, onPeriodChange }) {
  const endDate = profiles.flatMap((item) => item.history)
    .map((item) => item.data_referencia)
    .filter(Boolean)
    .sort()
    .at(-1);
  const series = profiles.map((profile, profileIndex) => {
    const snapshots = filterHistory(profile.history, period, endDate);
    const points = snapshots
      .map((item) => ({ date: item.data_referencia, value: item.metricas?.[metric] }))
      .filter((point) => Number.isFinite(point.value));
    const baseline = points[0]?.value;
    return {
      ...profile,
      color: chartColors[profileIndex],
      points: comparison && baseline > 0
        ? points.map((point) => ({ ...point, plottedValue: (point.value / baseline) * 100 }))
        : comparison ? [] : points.map((point) => ({ ...point, plottedValue: point.value })),
    };
  });
  const plotted = series.flatMap((item) => item.points.map((point) => ({ ...point, color: item.color, username: item.username })));
  const hasSingleBase = comparison && series.length < 2;
  const width = 760;
  const height = 280;
  const pad = { top: 20, right: 24, bottom: 42, left: 64 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const dates = plotted.map((point) => Date.parse(`${point.date}T00:00:00Z`)).filter(Number.isFinite);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const values = plotted.map((point) => point.plottedValue);
  let minValue = Math.min(...values);
  let maxValue = Math.max(...values);
  if (!Number.isFinite(minValue)) { minValue = 0; maxValue = 1; }
  if (minValue === maxValue) {
    const margin = Math.abs(maxValue) * 0.05 || 1;
    minValue -= margin;
    maxValue += margin;
  } else {
    const margin = (maxValue - minValue) * 0.08;
    minValue -= margin;
    maxValue += margin;
  }
  const dateSpread = maxDate - minDate || 1;
  const valueSpread = maxValue - minValue || 1;
  const mapped = series.map((item) => ({
    ...item,
    coords: item.points.map((point) => ({
      ...point,
      x: minDate === maxDate ? pad.left + plotWidth / 2 : pad.left + ((Date.parse(`${point.date}T00:00:00Z`) - minDate) / dateSpread) * plotWidth,
      y: pad.top + (1 - (point.plottedValue - minValue) / valueSpread) * plotHeight,
    })),
  }));
  const noData = plotted.length === 0;

  return <section className="analytics-panel analytics-chart-panel">
    <div className="analytics-panel-heading">
      <div><p className="analytics-eyebrow">EVOLUÇÃO DO CANAL</p><h2>{comparison ? "Compare o crescimento" : "Histórico de métricas"}</h2></div>
      <div className="analytics-chart-controls">
        <label><span>Métrica</span><select value={metric} onChange={(event) => onMetricChange(event.target.value)} aria-label="Métrica do gráfico">
          {metricOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select></label>
        <label><span>Período</span><select value={period} onChange={(event) => onPeriodChange(event.target.value)} aria-label="Período do gráfico">
          <option value="30">30 dias</option><option value="90">90 dias</option><option value="all">Todas as capturas disponíveis</option>
        </select></label>
      </div>
    </div>
    {noData ? <p className="analytics-chart-empty">Ainda não há capturas suficientes para mostrar essa métrica no período escolhido.</p> : hasSingleBase ? <p className="analytics-chart-empty">Adicione outro perfil para comparar a evolução.</p> : <>
      <div className="analytics-chart-wrap">
        <svg className="analytics-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${comparison ? "Comparação relativa de" : "Gráfico de"} ${metricOptions.find((item) => item.key === metric)?.label.toLowerCase()} ao longo do tempo`}>
          {[0, 1, 2, 3].map((line) => {
            const fraction = line / 3;
            const y = pad.top + fraction * plotHeight;
            const value = maxValue - fraction * valueSpread;
            const label = comparison ? `${Math.round(value)}` : compactFormat.format(value);
            return <g key={line}><line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="analytics-grid-line" /><text x={pad.left - 10} y={y + 4} textAnchor="end" className="analytics-axis-label">{label}</text></g>;
          })}
          {mapped.map((item) => {
            const path = item.coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
            return <g key={item.username} style={{ "--series-color": item.color }}>
              {item.coords.length > 1 && <path d={path} className="analytics-line" />}
              {item.coords.map((point, index) => <circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r="4.5" className="analytics-point"><title>{item.name} · {formatDate(point.date)}: {metricValue(point.value)}</title></circle>)}
            </g>;
          })}
          {minDate === maxDate ? <text x={width / 2} y={height - 12} textAnchor="middle" className="analytics-axis-label">{formatDate(new Date(minDate).toISOString())}</text> : <>
            <text x={pad.left} y={height - 12} className="analytics-axis-label">{formatDate(new Date(minDate).toISOString())}</text>
            <text x={width - pad.right} y={height - 12} textAnchor="end" className="analytics-axis-label">{formatDate(new Date(maxDate).toISOString())}</text>
          </>}
        </svg>
      </div>
      <div className="analytics-legend">{mapped.map((item) => <span key={item.username} style={{ "--series-color": item.color }}><i aria-hidden="true" />{item.name}</span>)}</div>
      <p className="analytics-chart-note">{comparison ? "Cada série parte de 100 na primeira captura do período. Os valores reais aparecem ao passar o cursor." : `${series[0]?.points.length || 0} capturas no período`}</p>
    </>}
  </section>;
}

function MetricCard({ title, value, detail, change }) {
  return <article className="analytics-metric-card">
    <span>{title}</span><strong>{value}</strong>
    <small>{change ? <b className={`analytics-delta${change.startsWith("-") ? " analytics-delta-down" : ""}`}>{change}</b> : detail}</small>
    {change && <small>{detail}</small>}
  </article>;
}

export default function Analises() {
  const navigate = useNavigate();
  const { username: targetUsername } = useParams();
  const viewingCreator = Boolean(targetUsername);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [url, setUrl] = useState("");
  const [metric, setMetric] = useState("seguidores");
  const [period, setPeriod] = useState("90");
  const [videoSort, setVideoSort] = useState("visualizacoes");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [influencers, setInfluencers] = useState([]);
  const [selectedCompare, setSelectedCompare] = useState("");
  const [comparisonSearch, setComparisonSearch] = useState("");
  const [comparisons, setComparisons] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setProfile(null);
      setHistory([]);
      setError("");
      setComparisons([]);
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) { navigate("/login", { replace: true }); return; }
      try {
        const user = await getSession(token);
        if (!active) return;
        if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
        if (viewingCreator) {
          if (user.tipo_perfil !== "empresa" && !(user.tipo_perfil === "influenciador" && user.username === targetUsername)) {
            navigate("/explorar", { replace: true });
            return;
          }
        } else if (user.tipo_perfil !== "influenciador") { navigate("/inicio", { replace: true }); return; }
        setProfile(user);
        const endpoint = viewingCreator
          ? `/api/analises/youtube/${encodeURIComponent(targetUsername)}`
          : "/api/analises/youtube";
        const data = await readResponse(await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        }));
        if (!active) return;
        const snapshots = data.historico || [];
        setHistory(snapshots);
        if (snapshots.length && !viewingCreator) setUrl(snapshots[snapshots.length - 1].perfil?.url || "");

        if (user.tipo_perfil === "empresa" && viewingCreator) {
          try {
            const response = await fetch("/api/usuarios?tipo_perfil=influenciador", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const creators = await readResponse(response);
            if (active && Array.isArray(creators)) {
              setInfluencers(creators.filter((creator) => creator.tipo_perfil === "influenciador" && creator.username !== targetUsername));
            }
          } catch { if (active) setComparisonError("Não foi possível carregar a lista para comparar."); }
        }
      } catch (err) {
        if (!active) return;
        if (err.status === 401 || err.status === 422) {
          localStorage.removeItem("access_token");
          navigate("/login", { replace: true });
          return;
        }
        setError(err.message);
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [navigate, targetUsername, viewingCreator]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/login", { replace: true }); return; }
    setSaving(true);
    try {
      const data = await readResponse(await fetch("/api/analises/youtube", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      }));
      const snapshot = data.analise;
      setHistory((current) => {
        const updated = current.filter((item) => !(item.perfil?.id === snapshot.perfil?.id && item.data_referencia === snapshot.data_referencia));
        return [...updated, snapshot].sort((a, b) => a.data_referencia.localeCompare(b.data_referencia)).slice(-90);
      });
      setUrl(snapshot.perfil?.url || url.trim());
      setNotice("Análise atualizada. A captura de hoje foi salva no seu histórico.");
    } catch (err) {
      if (err.status === 401 || err.status === 422) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }
      setError(err.message);
    } finally { setSaving(false); }
  }

  async function addComparison(event) {
    event.preventDefault();
    if (!selectedCompare || comparisons.length >= 2 || comparisons.some((item) => item.username === selectedCompare)) return;
    const token = localStorage.getItem("access_token");
    setComparisonError("");
    setComparisonLoading(true);
    try {
      const data = await readResponse(await fetch(`/api/analises/youtube/${encodeURIComponent(selectedCompare)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }));
      const creator = influencers.find((item) => item.username === selectedCompare);
      const creatorSnapshot = data.historico?.at(-1);
      setComparisons((current) => [...current, {
        username: selectedCompare,
        name: creatorSnapshot?.perfil?.nome || creator?.nome || selectedCompare,
        history: data.historico || [],
      }]);
      setSelectedCompare("");
      setComparisonSearch("");
    } catch (err) {
      if (err.status === 401 || err.status === 422) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }
      setComparisonError(err.message);
    } finally { setComparisonLoading(false); }
  }

  const latest = history[history.length - 1];
  const metrics = latest?.metricas || {};
  const comparisonProfiles = [
    ...(latest ? [{ username: targetUsername || profile?.username || "meu-perfil", name: latest.perfil?.nome || profile?.nome || targetUsername || "Meu perfil", history }] : []),
    ...comparisons,
  ];
  const recentVideos = [...(latest?.videos_recentes || [])].sort((a, b) => {
    if (videoSort === "publicado_em") return String(b.publicado_em || "").localeCompare(String(a.publicado_em || ""));
    return (b[videoSort] ?? -1) - (a[videoSort] ?? -1);
  });
  const metricCards = [
    { key: "seguidores", title: "Inscritos", value: metrics.seguidores_ocultos ? "Ocultos" : metricValue(metrics.seguidores), detail: metrics.seguidores_ocultos ? "Número não divulgado pelo canal" : "Total público no canal" },
    { key: "visualizacoes_totais", title: "Visualizações totais", value: metricValue(metrics.visualizacoes_totais), detail: "Acumuladas no canal" },
    { key: "total_publicacoes", title: "Vídeos publicados", value: metricValue(metrics.total_publicacoes), detail: `Na captura de ${formatDate(latest?.data_referencia)}` },
  ];
  const recentAverage = averageRecentViews(latest);
  const compareOptions = influencers.filter((creator) =>
    !comparisons.some((item) => item.username === creator.username) &&
    `${creator.nome || ""} ${creator.username || ""}`.toLocaleLowerCase("pt-BR").includes(comparisonSearch.toLocaleLowerCase("pt-BR"))
  );

  if (loading || !profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando sua análise…"}</p>{error && <a href="/inicio">Voltar ao início</a>}</main>;

  return <main className="dash-page analytics-page">
    <Sidebar profile={profile} />
    <div className="dash-content analytics-content">
      <header className="dash-header"><div><p className="dash-label">{viewingCreator ? "PERFIL EM AVALIAÇÃO" : "SEU CANAL"}</p><h1>{viewingCreator ? latest?.perfil?.nome || `@${targetUsername}` : "Análise de influenciador"}<span> ✦</span></h1></div><div className="analytics-header-meta"><span className="dash-role">{viewingCreator ? "Consulta da empresa" : "YouTube"}</span><span className="analytics-updated">{latest ? `Atualizado em ${formatDate(latest.data_referencia)}` : "Sem capturas"}</span></div></header>
      {viewingCreator && <Link className="analytics-back-link" to="/explorar">← Voltar para Explorar</Link>}

      <section className="analytics-intro">
        <div><p className="analytics-eyebrow">DADOS PÚBLICOS DO YOUTUBE</p><h2>{viewingCreator ? "Avalie os dados e compare este canal." : "Entenda como seu canal está crescendo."}</h2><p>{viewingCreator ? "Veja os indicadores públicos, acompanhe as capturas e compare este perfil com outros influenciadores." : "Consulte inscritos, visualizações e publicações do seu canal. As capturas ficam salvas para você acompanhar a evolução."}</p></div>
        <span aria-hidden="true" className="analytics-intro-mark">↗</span>
      </section>

      {!viewingCreator && <section className="analytics-panel analytics-connect">
        <div className="analytics-panel-heading"><div><p className="analytics-eyebrow">CONECTAR CANAL</p><h2>Atualize seus dados</h2></div><span className="analytics-youtube-mark" aria-hidden="true">▶</span></div>
        <form onSubmit={submit} className="analytics-form">
          <label htmlFor="youtube-channel-url">Link do canal do YouTube</label>
          <div className="analytics-form-row"><input id="youtube-channel-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/@seucanal" aria-describedby="youtube-url-help" /><button className="analytics-primary" type="submit" disabled={saving}>{saving ? "Buscando dados…" : "Buscar análise"}</button></div>
          <small id="youtube-url-help">Aceita links de canal no formato @handle, /channel/ID ou /user/usuário.</small>
        </form>
        {error && <p className="analytics-message analytics-message-error" role="alert">{error}</p>}
        {notice && <p className="analytics-message analytics-message-success" role="status">{notice}</p>}
      </section>}

      {viewingCreator && error && <p className="analytics-message analytics-message-error" role="alert">{error}</p>}
      {latest ? <>
        <section className="analytics-summary-heading"><div><p className="analytics-eyebrow">RESUMO DO CANAL</p><h2>Indicadores principais</h2></div>{latest.perfil?.url && <a className="analytics-channel-link" href={latest.perfil.url} target="_blank" rel="noreferrer">Abrir canal ↗</a>}</section>
        <section className="analytics-metrics" aria-label="Métricas atuais do canal">
          {metricCards.map((item) => <MetricCard key={item.key} title={item.title} value={item.value} detail={item.detail} change={item.key !== "total_publicacoes" && !(item.key === "seguidores" && metrics.seguidores_ocultos) ? metricChange(history, item.key, period, latest?.data_referencia) : null} />)}
          <MetricCard title="Média de views" value={metricValue(recentAverage)} detail={`${latest.videos_recentes?.filter((video) => Number.isFinite(video.visualizacoes)).length || 0} vídeos recentes analisados`} />
        </section>

        {viewingCreator && <section className="analytics-panel analytics-compare-panel">
          <div className="analytics-panel-heading"><div><p className="analytics-eyebrow">ANÁLISE COMPARATIVA</p><h2>Compare com outros perfis</h2></div><span className="analytics-compare-count">{comparisonProfiles.length}/3 perfis</span></div>
          <form className="analytics-compare-form" onSubmit={addComparison}>
            <label htmlFor="compare-search">Buscar influenciador</label>
            <input id="compare-search" type="search" value={comparisonSearch} onChange={(event) => setComparisonSearch(event.target.value)} placeholder="Nome ou username" disabled={comparisonLoading || comparisons.length >= 2} />
            <label htmlFor="compare-influencer">Adicionar ao comparativo</label>
            <div><select id="compare-influencer" value={selectedCompare} onChange={(event) => setSelectedCompare(event.target.value)} disabled={comparisonLoading || comparisons.length >= 2}>
              <option value="">Selecione um perfil</option>
              {compareOptions.map((creator) => <option key={creator.username} value={creator.username}>{creator.nome || creator.username} · @{creator.username}</option>)}
              {compareOptions.length === 0 && <option value="" disabled>Nenhum perfil corresponde à busca</option>}
            </select><button className="analytics-primary" type="submit" disabled={!selectedCompare || comparisonLoading || comparisons.length >= 2}>{comparisonLoading ? "Carregando…" : "Adicionar à comparação"}</button></div>
            <small>Compare até três perfis. Cada um precisa ter capturas salvas para aparecer no gráfico.</small>
          </form>
          {comparisonError && <p className="analytics-message analytics-message-error" role="alert">{comparisonError}</p>}
          {comparisons.length > 0 && <div className="analytics-compare-chips">{comparisons.map((item, index) => <span key={item.username} style={{ "--series-color": chartColors[index + 1] }}>{item.name}<button type="button" onClick={() => setComparisons((current) => current.filter((entry) => entry.username !== item.username))} aria-label={`Remover ${item.name} da comparação`}>×</button></span>)}</div>}
        </section>}

        <HistoryChart profiles={comparisonProfiles} metric={metric} period={period} comparison={viewingCreator && comparisons.length > 0} onMetricChange={setMetric} onPeriodChange={setPeriod} />

        {viewingCreator && comparisons.length > 0 && <section className="analytics-panel analytics-table-panel">
          <div className="analytics-panel-heading"><div><p className="analytics-eyebrow">VALORES MAIS RECENTES</p><h2>Comparação lado a lado</h2></div></div>
          <div className="analytics-table-wrap"><table className="analytics-table"><thead><tr><th>Perfil</th><th>Inscritos</th><th>Visualizações totais</th><th>Vídeos</th><th>Última captura</th><th>Amostras</th></tr></thead><tbody>{comparisonProfiles.map((item) => {
            const snapshot = item.history[item.history.length - 1];
            const values = snapshot?.metricas || {};
            return <tr key={item.username}><th scope="row"><strong>{item.name}</strong><small>@{item.username}</small></th><td>{values.seguidores_ocultos ? "Ocultos" : metricValue(values.seguidores)}</td><td>{metricValue(values.visualizacoes_totais)}</td><td>{metricValue(values.total_publicacoes)}</td><td>{formatDate(snapshot?.data_referencia)}</td><td>{item.history.length}</td></tr>;
          })}</tbody></table></div>
        </section>}

        <section className="analytics-panel analytics-videos">
          <div className="analytics-panel-heading"><div><p className="analytics-eyebrow">CONTEÚDO RECENTE</p><h2>Vídeos do canal</h2></div><label className="analytics-sort-videos"><span>Ordenar por</span><select value={videoSort} onChange={(event) => setVideoSort(event.target.value)}><option value="visualizacoes">Visualizações</option><option value="curtidas">Curtidas</option><option value="comentarios">Comentários</option><option value="publicado_em">Mais recentes</option></select></label></div>
          {recentVideos.length ? <div className="analytics-video-list">{recentVideos.map((video) => <article className="analytics-video" key={video.id}>
            <div className="analytics-video-icon" aria-hidden="true">▶</div><div className="analytics-video-title"><a href={video.url} target="_blank" rel="noreferrer">{video.titulo || "Vídeo sem título"}</a><small>{video.publicado_em ? `Publicado em ${formatDate(video.publicado_em)}` : "Data de publicação indisponível"}</small></div><div className="analytics-video-stats"><span>{metricValue(video.visualizacoes)} views</span><span>{metricValue(video.curtidas)} curtidas</span><span>{metricValue(video.comentarios)} comentários</span></div>
          </article>)}</div> : <p className="analytics-chart-empty">Nenhum vídeo recente disponível para este canal.</p>}
        </section>
      </> : <section className="analytics-panel analytics-empty"><span aria-hidden="true">↗</span><h2>{viewingCreator ? "Este influenciador ainda não tem uma análise salva" : "Sua análise começa com o link do canal"}</h2><p>{viewingCreator ? "Quando o influenciador consultar o canal do YouTube, os dados públicos ficarão disponíveis aqui." : "Quando você buscar os dados pela primeira vez, as métricas públicas e os vídeos recentes aparecerão aqui."}</p></section>}
      <p className="analytics-footnote">Os dados são públicos e refletem as capturas salvas no sistema. A variação usa a primeira e a última captura disponíveis no período; períodos sem capturas podem ter lacunas. Alcance e impressões privadas não são disponibilizados por esta consulta. {viewingCreator ? "O histórico é exibido conforme as capturas salvas pelo influenciador." : "Uma nova captura é registrada quando você atualiza a análise, no máximo uma vez por dia."}</p>
    </div>
  </main>;
}
