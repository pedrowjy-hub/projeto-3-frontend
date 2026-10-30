import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSession } from "../../services/session";
import Sidebar from "../Dashboard/Sidebar";
import "../Dashboard/index.css";
import "./index.css";

const motivos = ["Perfil falso ou falsa identidade", "Fraude ou tentativa de golpe", "Assédio ou comportamento ofensivo", "Conteúdo inadequado", "Spam", "Outro motivo"];

export default function Denuncias() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [sessionError, setSessionError] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(false);
  const [form, setForm] = useState({ username: "", motivo: "", descricao: "" });
  const firstField = useRef(null);
  const trigger = useRef(null);
  const reviewHeading = useRef(null);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/login", { replace: true }); return; }
    getSession(token).then(user => {
      if (!active) return;
      if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
      setProfile(user);
    }).catch(err => {
      if (!active) return;
      if (err.status === 401 || err.status === 422) navigate("/login", { replace: true });
      else setSessionError(err.message);
    });
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    if (!profile || !open) return;
    const controller = new AbortController();
    fetch("/api/usuarios", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Não foi possível carregar os perfis. Tente novamente.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Não foi possível carregar os perfis.");
      if (!controller.signal.aborted) setProfiles(data.filter(item => item.username && item.username !== profile.username && ["empresa", "influenciador"].includes(item.tipo_perfil)));
    }).catch(err => {
      if (!controller.signal.aborted) setError(err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [profile, open, attempt]);

  useEffect(() => {
    if (open && review) reviewHeading.current?.focus();
    else if (open && !loading) firstField.current?.focus();
  }, [open, review, loading]);

  function close() {
    setOpen(false); setReview(false);
    trigger.current?.focus();
  }

  function change(event) {
    setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
  }

  if (!profile) return <main className="dash-page dash-status"><p role={sessionError ? "alert" : "status"}>{sessionError || "Carregando seu espaço…"}</p>{sessionError && <Link to="/login">Voltar ao login</Link>}</main>;

  return <main className="dash-page reports-page">
    <Sidebar profile={profile} />
    <div className="dash-content">
      <header className="dash-header reports-header">
        <div><p className="dash-label">CUIDADO COM A COMUNIDADE</p><h1>Denúncias<span> ✦</span></h1><p>Um espaço para relatar problemas e cuidar das suas conexões.</p></div>
        <button ref={trigger} className="reports-primary" aria-expanded={open} aria-controls="report-form" onClick={() => { setOpen(!open); setReview(false); setLoading(true); setError(""); }}> {open ? "Fechar formulário" : "+ Nova denúncia"}</button>
      </header>

      <section className="reports-intro" aria-labelledby="reports-intro-title"><span className="reports-symbol" aria-hidden="true">◇</span><div><h2 id="reports-intro-title">Boas conexões começam com respeito.</h2><p>Encontrou um perfil suspeito ou passou por uma situação inadequada? Descreva o que aconteceu para que a administração possa avaliar.</p></div></section>
      <p className="reports-notice" role="status"><strong>Envio ainda indisponível.</strong> Você pode preencher e revisar o formulário, mas as denúncias ainda não podem ser enviadas nem consultadas. O relato permanece apenas nesta página e será perdido ao sair ou atualizar.</p>

      {open && <section className="reports-card" id="report-form" aria-labelledby="report-form-title">
        <div className="reports-card-heading"><div><p className="dash-label">CONTE O QUE ACONTECEU</p><h2 id="report-form-title">Nova denúncia</h2></div><span className="reports-tag">Não enviada</span></div>
        {!review ? <form onSubmit={event => { event.preventDefault(); if (form.descricao.trim().length < 20) { setError("Descreva o ocorrido com pelo menos 20 caracteres, sem contar espaços nas extremidades."); return; } setError(""); setReview(true); }}>
          {loading && <p role="status">Carregando perfis…</p>}
          {error && <div className="reports-error" role="alert">{error} <button type="button" onClick={() => { setLoading(true); setError(""); setAttempt(value => value + 1); }}>Tentar novamente</button></div>}
          {!loading && !error && !profiles.length && <p>Nenhum outro perfil disponível para selecionar.</p>}
          <div className="reports-fields">
            <label>Perfil denunciado<select ref={firstField} name="username" value={form.username} onChange={change} required disabled={loading || !profiles.length}><option value="">Selecione o perfil</option>{profiles.map(item => <option key={item.username} value={item.username}>{item.nome || item.username} (@{item.username})</option>)}</select></label>
            <label>Motivo<select name="motivo" value={form.motivo} onChange={change} required><option value="">Selecione o motivo</option>{motivos.map(motivo => <option key={motivo}>{motivo}</option>)}</select></label>
            <label className="reports-wide">O que aconteceu?<textarea name="descricao" value={form.descricao} onChange={change} rows={6} minLength={20} maxLength={2000} required placeholder="Descreva a situação, quando aconteceu e os detalhes que ajudem a entender o problema." aria-describedby="report-description-help" /><small id="report-description-help">Mínimo de 20 caracteres. Não inclua senhas ou dados bancários. <span>{form.descricao.length}/2000</span></small></label>
          </div>
          <div className="reports-actions"><span>Revise as informações antes de enviar.</span><button type="button" onClick={close}>Fechar</button><button className="reports-primary" type="submit" disabled={loading || !profiles.some(item => item.username === form.username)}>Revisar relato →</button></div>
        </form> : <div>
          <h3 ref={reviewHeading} tabIndex={-1}>Revise seu relato</h3>
          <dl className="reports-details"><div><dt>Perfil denunciado</dt><dd>@{form.username}</dd></div><div><dt>Motivo</dt><dd>{form.motivo}</dd></div><div><dt>Descrição</dt><dd>{form.descricao.trim()}</dd></div></dl>
          <p id="report-unavailable" className="reports-notice">Este relato não foi enviado. O envio ficará disponível quando o serviço de denúncias estiver conectado.</p>
          <div className="reports-actions"><button type="button" onClick={() => setReview(false)}>Editar relato</button><button className="reports-primary" disabled aria-describedby="report-unavailable">Enviar denúncia</button></div>
        </div>}
      </section>}

      <section className="reports-card" aria-labelledby="reports-history-title"><div className="reports-card-heading"><h2 id="reports-history-title">Minhas denúncias</h2><span className="reports-tag">Acompanhamento</span></div><div className="reports-empty"><span aria-hidden="true">◎</span><h3>Histórico ainda indisponível</h3><p>Quando o serviço estiver disponível, você poderá consultar aqui suas denúncias, o andamento da análise e a resposta da administração.</p></div></section>
      <section className="reports-steps" aria-label="Etapas de uma denúncia"><div><span>01</span><h3>Pendente</h3><p>Denúncia recebida, aguardando avaliação.</p></div><div><span>02</span><h3>Em análise</h3><p>A administração está avaliando o relato.</p></div><div><span>03</span><h3>Concluída</h3><p>Análise finalizada, com retorno disponível.</p></div></section>
    </div>
  </main>;
}
