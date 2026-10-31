import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import Sidebar from "../Dashboard/Sidebar";
import { getSession } from "../../services/session";
import usePremiumStatus from "../../hooks/usePremiumStatus";
import "../Dashboard/index.css";
import "./index.css";

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.erro || "Não foi possível concluir a solicitação.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export default function Avaliacoes() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [influencers, setInfluencers] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState(() => new URLSearchParams(window.location.search).get("username") || "");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState(null);
  const [summaryFor, setSummaryFor] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsFor, setReviewsFor] = useState("");
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [submittedFor, setSubmittedFor] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [ratingsAttempt, setRatingsAttempt] = useState(0);
  const [error, setError] = useState("");
  const [reviewsError, setReviewsError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const { premium } = usePremiumStatus(profile);
  const company = profile?.tipo_perfil === "empresa";
  const selected = influencers.find((item) => item.username === selectedUsername);
  const visibleSummary = summaryFor === selectedUsername ? summary : null;
  const visibleReviews = reviewsFor === selectedUsername ? reviews : [];
  const filteredInfluencers = useMemo(() => influencers.filter((item) =>
    `${item.nome || ""} ${item.username} ${item.nicho || ""}`.toLocaleLowerCase("pt-BR")
      .includes(search.trim().toLocaleLowerCase("pt-BR"))), [influencers, search]);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) { navigate("/login", { replace: true }); return; }
      try {
        const user = await getSession(token);
        if (!active) return;
        if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
        setProfile(user);
        if (user.tipo_perfil === "influenciador") {
          setSelectedUsername(user.username);
          return;
        }
        const response = await fetch("/api/usuarios?tipo_perfil=influenciador", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const creators = await readResponse(response);
        if (!active) return;
        if (!Array.isArray(creators)) throw new Error("A lista de influenciadores está indisponível.");
        const available = creators.filter((item) => item.tipo_perfil === "influenciador");
        setInfluencers(available);
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
    loadProfile();
    return () => { active = false; };
  }, [navigate, profileAttempt]);

  useEffect(() => {
    if (!profile || !selectedUsername) {
      return undefined;
    }
    let active = true;
    const token = localStorage.getItem("access_token");
    const canReadComments = company && premium;
    async function loadRatings() {
      setReviewsLoading(canReadComments);
      try {
        const summaryData = await readResponse(await fetch(
          `/api/usuarios/${encodeURIComponent(selectedUsername)}/avaliacoes`,
        ));
        if (!active) return;
        setSummary(summaryData);
        setSummaryFor(selectedUsername);
        if (canReadComments) {
          try {
            const commentsData = await readResponse(await fetch(
              `/api/usuarios/${encodeURIComponent(selectedUsername)}/avaliacoes/comentarios`,
              { headers: { Authorization: `Bearer ${token}` } },
            ));
            if (active) {
              setReviews(commentsData.avaliacoes || []);
              setReviewsFor(selectedUsername);
            }
          } catch (err) {
            if (!active) return;
            if (err.status === 401 || err.status === 422) {
              localStorage.removeItem("access_token");
              navigate("/login", { replace: true });
              return;
            }
            setReviewsError(err.message);
          }
        }
      } catch (err) {
        if (!active) return;
        if (err.status === 401 || err.status === 422) {
          localStorage.removeItem("access_token");
          navigate("/login", { replace: true });
          return;
        }
        setError(err.message);
      } finally { if (active) setReviewsLoading(false); }
    }
    loadRatings();
    return () => { active = false; };
  }, [profile, selectedUsername, company, premium, ratingsAttempt, navigate]);

  async function submitReview(event) {
    event.preventDefault();
    if (!selectedUsername || saving) return;
    setSaving(true);
    setFormError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("access_token");
      await readResponse(await fetch(`/api/usuarios/${encodeURIComponent(selectedUsername)}/avaliacoes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ nota: score, conteudo: comment.trim() }),
      }));
      setComment("");
      setSubmittedFor(selectedUsername);
      setSuccess("Sua avaliação foi registrada. Obrigado por compartilhar sua experiência.");
      setRatingsAttempt((value) => value + 1);
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }
      if (err.status === 409) setSubmittedFor(selectedUsername);
      setFormError(err.message);
    } finally { setSaving(false); }
  }

  function chooseInfluencer(username) {
    setSelectedUsername(username);
    setError("");
    setReviewsError("");
    setSuccess("");
    setFormError("");
  }

  function retryProfile() {
    setError("");
    setProfileAttempt((value) => value + 1);
  }

  function retryRatings() {
    setError("");
    setReviewsError("");
    setRatingsAttempt((value) => value + 1);
  }

  if (!profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando avaliações…"}</p>{error && <button type="button" onClick={retryProfile}>Tentar novamente</button>}</main>;
  const ownReview = visibleReviews.find((item) => item.avaliador_username === profile.username);
  const alreadyRated = Boolean(ownReview) || submittedFor === selectedUsername;

  return <main className="dash-page ratings-page">
    <Sidebar profile={profile} />
    <div className="dash-content ratings-content">
      <header className="dash-header"><div><p className="dash-label">CONFIANÇA QUE GERA PARCERIAS</p><h1>Avaliações<span> ✦</span></h1></div><span className="dash-role">{company ? "Visão da empresa" : "Seu perfil"}</span></header>
      <section className="ratings-intro"><div><p className="dash-label">EXPERIÊNCIAS REAIS</p><h2>{company ? "Escolha com quem sua marca vai crescer." : "Sua reputação cresce a cada parceria."}</h2><p>{company ? "Consulte as avaliações públicas dos influenciadores e conheça os comentários detalhados com o Premium." : "Acompanhe a nota média que as empresas deram ao seu perfil. Os comentários detalhados são reservados a empresas Premium."}</p></div><span className="ratings-intro-mark" aria-hidden="true">★</span></section>

      {company && <section className="ratings-picker ratings-panel" aria-labelledby="ratings-picker-title">
        <div className="ratings-panel-heading"><div><p className="dash-label">ENCONTRE UM PERFIL</p><h2 id="ratings-picker-title">Quem você quer avaliar?</h2></div><span aria-hidden="true">⌕</span></div>
        {error && <p className="ratings-error" role="alert">{error}</p>}
        {influencers.length > 0 ? <div className="ratings-picker-fields">
          <label htmlFor="ratings-search">Buscar por nome ou nicho<input id="ratings-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex.: moda, tecnologia, @username" /></label>
          <label htmlFor="ratings-creator">Influenciador<select id="ratings-creator" value={selectedUsername} onChange={(event) => chooseInfluencer(event.target.value)}><option value="">Selecione um perfil</option>{filteredInfluencers.map((item) => <option key={item.username} value={item.username}>{item.nome || item.username} · @{item.username}</option>)}</select></label>
        </div> : loading ? <p role="status">Carregando influenciadores…</p> : !error && <div className="ratings-empty"><h3>Nenhum influenciador disponível</h3><p>Os perfis cadastrados aparecerão aqui para consulta.</p></div>}
      </section>}

      {!company && <section className="ratings-self-note"><span aria-hidden="true">✦</span><p>Esta é a nota pública do seu perfil. As avaliações são enviadas por empresas após uma experiência de parceria.</p></section>}

      {selectedUsername && <>
        <section className="ratings-summary-panel ratings-panel" aria-label="Resumo das avaliações" aria-busy={!visibleSummary && !error}>
          <div className="ratings-profile-mark" aria-hidden="true">{((selected?.nome || profile.nome || selectedUsername).slice(0, 1)).toLocaleUpperCase("pt-BR")}</div>
          <div className="ratings-profile-info"><p className="dash-label">{company ? "PERFIL AVALIADO" : "SUA NOTA PÚBLICA"}</p><h2>{selected?.nome || profile.nome || selectedUsername}</h2><p>@{selectedUsername}{selected?.nicho ? ` · ${selected.nicho}` : ""}</p></div>
          <div className="ratings-score"><strong>{visibleSummary?.nota_media == null ? "—" : visibleSummary.nota_media.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</strong><span className="ratings-stars" aria-label={visibleSummary?.nota_media == null ? "Sem nota" : `Nota ${visibleSummary.nota_media} de 5`}>{visibleSummary?.nota_media == null ? "☆☆☆☆☆" : `${"★".repeat(Math.round(visibleSummary.nota_media))}${"☆".repeat(5 - Math.round(visibleSummary.nota_media))}`}</span><small>{visibleSummary?.quantidade_avaliacoes ?? "…"} {visibleSummary?.quantidade_avaliacoes === 1 ? "avaliação" : "avaliações"}</small></div>
        </section>

        {error && <p className="ratings-error" role="alert">{error} <button type="button" onClick={retryRatings}>Tentar novamente</button></p>}

        {company && <section className="ratings-panel ratings-write-panel" aria-labelledby="ratings-write-title">
          <div className="ratings-panel-heading"><div><p className="dash-label">CONTE COMO FOI</p><h2 id="ratings-write-title">Avalie sua experiência</h2></div><span aria-hidden="true">✎</span></div>
          {alreadyRated ? <div className="ratings-own-review"><span aria-hidden="true">✓</span><div><strong>Você já avaliou este perfil</strong><p>{ownReview ? `Sua nota: ${ownReview.nota} de 5 · ${ownReview.conteudo}` : "Sua avaliação foi registrada para este perfil."}</p></div></div> : <form onSubmit={submitReview}>
            <fieldset className="ratings-score-picker"><legend>Sua nota</legend>{[1, 2, 3, 4, 5].map((value) => <label key={value} className={score >= value ? "is-selected" : ""}><input type="radio" name="rating-score" value={value} checked={score === value} onChange={() => setScore(value)} /><span aria-hidden="true">★</span><span className="ratings-sr-only">{value} {value === 1 ? "estrela" : "estrelas"}</span></label>)}<small>{score} de 5</small></fieldset>
            <label className="ratings-comment-label" htmlFor="ratings-comment">Comentário<textarea id="ratings-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} rows={4} required placeholder="Conte como foi trabalhar com este influenciador…" /></label>
            <div className="ratings-form-footer"><small>{comment.length}/2000 caracteres</small><button className="ratings-primary" type="submit" disabled={saving || !comment.trim()}>{saving ? "Enviando…" : "Publicar avaliação ↗"}</button></div>
            {formError && <p className="ratings-error" role="alert">{formError}</p>}
            {success && <p className="ratings-success" role="status">{success}</p>}
          </form>}
          {alreadyRated && success && <p className="ratings-success" role="status">{success}</p>}
          {alreadyRated && formError && <p className="ratings-error" role="alert">{formError}</p>}
        </section>}

        {company && <section className="ratings-panel ratings-reviews-panel" aria-labelledby="ratings-comments-title" aria-busy={reviewsLoading}>
          <div className="ratings-panel-heading"><div><p className="dash-label">O QUE OUTRAS EMPRESAS DIZEM</p><h2 id="ratings-comments-title">Comentários de parcerias</h2></div><span className="ratings-premium-badge">{premium ? "PREMIUM" : "ACESSO PREMIUM"} ✦</span></div>
          {!premium ? <div className="ratings-locked"><span aria-hidden="true">✦</span><div><h3>Veja além da nota</h3><p>Empresas Premium consultam as notas individuais e os comentários detalhados deste perfil.</p><Link to="/planos">Conhecer o Premium ↗</Link></div></div> : reviewsLoading ? <p role="status">Carregando comentários…</p> : reviewsError ? <p className="ratings-error" role="alert">{reviewsError}</p> : visibleReviews.length ? <div className="ratings-review-list">{visibleReviews.map((review, index) => <article className="ratings-review" key={`${review.avaliador_username}-${review.criado_em || index}`}><div className="ratings-review-mark" aria-hidden="true">{(review.avaliador_username || "E").slice(0, 1).toLocaleUpperCase("pt-BR")}</div><div className="ratings-review-body"><div className="ratings-review-meta"><strong>@{review.avaliador_username || "empresa parceira"}</strong><span className="ratings-review-stars" aria-label={`${review.nota} de 5 estrelas`}>{"★".repeat(review.nota)}{"☆".repeat(5 - review.nota)}</span></div><p>{review.conteudo}</p><small>{review.criado_em ? new Date(review.criado_em).toLocaleDateString("pt-BR") : "Data indisponível"}</small></div></article>)}</div> : <div className="ratings-empty"><span aria-hidden="true">☆</span><h3>Ainda sem comentários</h3><p>As avaliações recebidas aparecerão aqui conforme as empresas compartilharem suas experiências.</p></div>}
        </section>}
      </>}
      {!company && selectedUsername && <section className="ratings-panel ratings-self-guidance"><span aria-hidden="true">🔒</span><div><h2>Comentários detalhados são privados</h2><p>Empresas com assinatura Premium podem consultar os comentários das parcerias. Você acompanha aqui sua média e o total de avaliações.</p></div></section>}
      {company && !selectedUsername && !loading && !error && <div className="ratings-empty ratings-first-empty"><span aria-hidden="true">✦</span><h2>Uma boa escolha começa com contexto.</h2><p>Selecione um influenciador acima para consultar sua nota pública, ver comentários e compartilhar uma avaliação.</p></div>}
    </div>
  </main>;
}
