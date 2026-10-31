import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getSession } from "../../services/session";
import Sidebar from "../Dashboard/Sidebar";
import "./index.css";

const numberFormat = new Intl.NumberFormat("pt-BR");

function formatDate(value) {
  if (!value) return "Data indisponível";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function metricValue(value) {
  return value == null ? "Indisponível" : numberFormat.format(value);
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

function HistoryChart({ history, metric, onMetricChange }) {
  const points = useMemo(() => history
    .map((item) => ({ date: item.data_referencia, value: item.metricas?.[metric] }))
    .filter((point) => Number.isFinite(point.value)), [history, metric]);
  const width = 720;
  const height = 240;
  const pad = { top: 16, right: 18, bottom: 38, left: 18 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const values = points.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const spread = max - min || 1;
  const coords = points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? width / 2 : pad.left + (index / (points.length - 1)) * plotWidth,
    y: pad.top + (1 - (point.value - min) / spread) * plotHeight,
  }));
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return <section className="analytics-panel analytics-chart-panel">
    <div className="analytics-panel-heading">
      <div><p className="analytics-eyebrow">EVOLUÇÃO DO CANAL</p><h2>Histórico de métricas</h2></div>
      <div className="analytics-toggle" role="group" aria-label="Métrica do gráfico">
        <button type="button" aria-pressed={metric === "seguidores"} onClick={() => onMetricChange("seguidores")}>Inscritos</button>
        <button type="button" aria-pressed={metric === "visualizacoes_totais"} onClick={() => onMetricChange("visualizacoes_totais")}>Visualizações</button>
      </div>
    </div>
    {coords.length === 0 ? <p className="analytics-chart-empty">Ainda não há dados públicos dessa métrica para desenhar.</p> : <>
      <div className="analytics-chart-wrap">
        <svg className="analytics-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Gráfico de ${metric === "seguidores" ? "inscritos" : "visualizações totais"} ao longo do tempo`}>
          {[0, 1, 2, 3].map((line) => {
            const y = pad.top + (line / 3) * plotHeight;
            return <line key={line} x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="analytics-grid-line" />;
          })}
          {coords.length > 1 && <path d={path} className="analytics-line" />}
          {coords.map((point, index) => <circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r="5" className="analytics-point"><title>{formatDate(point.date)}: {metricValue(point.value)}</title></circle>)}
          {coords.length < 7 ? coords.map((point, index) => <text key={`${point.date}-label-${index}`} x={point.x} y={height - 10} textAnchor="middle" className="analytics-axis-label">{formatDate(point.date)}</text>) : <>
            <text x={pad.left} y={height - 10} className="analytics-axis-label">{formatDate(coords[0].date)}</text>
            <text x={width - pad.right} y={height - 10} textAnchor="end" className="analytics-axis-label">{formatDate(coords[coords.length - 1].date)}</text>
          </>}
        </svg>
      </div>
      <p className="analytics-chart-note">{points.length} {points.length === 1 ? "captura" : "capturas"} no histórico</p>
    </>}
  </section>;
}

export default function Analises() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [url, setUrl] = useState("");
  const [metric, setMetric] = useState("seguidores");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const token = localStorage.getItem("access_token");
      if (!token) { navigate("/login", { replace: true }); return; }
      try {
        const user = await getSession(token);
        if (!active) return;
        if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
        if (user.tipo_perfil !== "influenciador") { navigate("/inicio", { replace: true }); return; }
        setProfile(user);
        const data = await readResponse(await fetch("/api/analises/youtube", {
          headers: { Authorization: `Bearer ${token}` },
        }));
        if (!active) return;
        const snapshots = data.historico || [];
        setHistory(snapshots);
        if (snapshots.length) setUrl(snapshots[snapshots.length - 1].perfil?.url || "");
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
  }, [navigate]);

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

  const latest = history[history.length - 1];
  const metrics = latest?.metricas || {};
  const channelHistory = latest
    ? history.filter((item) => item.perfil?.id === latest.perfil?.id)
    : [];

  if (loading || !profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando sua análise…"}</p>{error && <a href="/inicio">Voltar ao início</a>}</main>;

  return <main className="dash-page analytics-page">
    <Sidebar profile={profile} />
    <div className="dash-content analytics-content">
      <header className="dash-header"><div><p className="dash-label">SEU CANAL</p><h1>Análise de influenciador<span> ✦</span></h1></div><span className="dash-role">YouTube</span></header>
      <section className="analytics-intro">
        <div><p className="analytics-eyebrow">DADOS PÚBLICOS DO YOUTUBE</p><h2>Entenda como seu canal está crescendo.</h2><p>Consulte inscritos, visualizações e publicações do seu canal. As capturas ficam salvas para você acompanhar a evolução.</p></div>
        <span aria-hidden="true" className="analytics-intro-mark">↗</span>
      </section>

      <section className="analytics-panel analytics-connect">
        <div className="analytics-panel-heading"><div><p className="analytics-eyebrow">CONECTAR CANAL</p><h2>Atualize seus dados</h2></div><span className="analytics-youtube-mark" aria-hidden="true">▶</span></div>
        <form onSubmit={submit} className="analytics-form">
          <label htmlFor="youtube-channel-url">Link do canal do YouTube</label>
          <div className="analytics-form-row"><input id="youtube-channel-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/@seucanal" aria-describedby="youtube-url-help" /><button className="analytics-primary" type="submit" disabled={saving}>{saving ? "Buscando dados…" : "Buscar análise"}</button></div>
          <small id="youtube-url-help">Aceita links de canal no formato @handle, /channel/ID ou /user/usuário.</small>
        </form>
        {error && <p className="analytics-message analytics-message-error" role="alert">{error}</p>}
        {notice && <p className="analytics-message analytics-message-success" role="status">{notice}</p>}
      </section>

      {latest ? <>
        <section className="analytics-metrics" aria-label="Métricas atuais do canal">
          <article className="analytics-metric-card"><span>Inscritos</span><strong>{metrics.seguidores_ocultos ? "Ocultos pelo canal" : metricValue(metrics.seguidores)}</strong><small>{metrics.seguidores_ocultos ? "O YouTube não disponibiliza esse número publicamente." : "Total público de inscritos"}</small></article>
          <article className="analytics-metric-card"><span>Visualizações totais</span><strong>{metricValue(metrics.visualizacoes_totais)}</strong><small>Visualizações acumuladas no canal</small></article>
          <article className="analytics-metric-card"><span>Vídeos publicados</span><strong>{metricValue(metrics.total_publicacoes)}</strong><small>Captura de {formatDate(latest.data_referencia)}</small></article>
        </section>
        <HistoryChart history={channelHistory} metric={metric} onMetricChange={setMetric} />
        <section className="analytics-panel analytics-videos">
          <div className="analytics-panel-heading"><div><p className="analytics-eyebrow">CONTEÚDO RECENTE</p><h2>Vídeos do canal</h2></div><span className="analytics-video-count">{latest.videos_recentes?.length || 0} vídeos</span></div>
          {latest.videos_recentes?.length ? <div className="analytics-video-list">{latest.videos_recentes.map((video) => <article className="analytics-video" key={video.id}>
            <div className="analytics-video-icon" aria-hidden="true">▶</div><div className="analytics-video-title"><a href={video.url} target="_blank" rel="noreferrer">{video.titulo || "Vídeo sem título"}</a><small>{video.publicado_em ? `Publicado em ${formatDate(video.publicado_em)}` : "Data de publicação indisponível"}</small></div><div className="analytics-video-stats"><span>{metricValue(video.visualizacoes)} visualizações</span><span>{metricValue(video.curtidas)} curtidas</span></div>
          </article>)}</div> : <p className="analytics-chart-empty">Nenhum vídeo recente disponível para este canal.</p>}
        </section>
      </> : <section className="analytics-panel analytics-empty"><span aria-hidden="true">↗</span><h2>Sua análise começa com o link do canal</h2><p>Quando você buscar os dados pela primeira vez, as métricas públicas e os vídeos recentes aparecerão aqui.</p></section>}
      <p className="analytics-footnote">Os dados vêm das informações públicas do YouTube. Alcance e impressões privadas não são disponibilizados por esta consulta. O histórico é atualizado quando você busca a análise; uma nova captura é registrada por dia.</p>
    </div>
  </main>;
}
