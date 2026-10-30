import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSession } from "../../services/session";
import { enviarDenuncia, statusDenuncia } from "../../services/denuncias";
import useDenuncias from "../../services/useDenuncias";
import Sidebar from "../Dashboard/Sidebar";
import "../Dashboard/index.css";
import "./index.css";

const motivos = ["Perfil falso ou falsa identidade", "Fraude ou tentativa de golpe", "Assédio ou comportamento ofensivo", "Conteúdo inadequado", "Spam", "Outro motivo"];

export default function Denuncias() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [sessionError, setSessionError] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(false);
  const [form, setForm] = useState({ username: "", motivo: "", descricao: "" });
  const history = useDenuncias(false, Boolean(profile));
  const [sending, setSending] = useState(false);
  const sendLock = useRef(false);
  const [sendError, setSendError] = useState("");
  const [success, setSuccess] = useState("");
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
    if (open && review) reviewHeading.current?.focus();
    else if (open) firstField.current?.focus();
  }, [open, review]);

  async function send() {
    if (sendLock.current) return;
    sendLock.current = true; setSending(true); setSendError(""); setSuccess("");
    try {
      const report = await enviarDenuncia(form);
      setSuccess(`Denúncia enviada. Protocolo: ${report.id}`);
      setForm({ username: "", motivo: "", descricao: "" });
      close(); history.reload();
    } catch (err) {
      if (err.status === 401 || err.status === 422) navigate("/login", { replace: true });
      setSendError(err.message);
    } finally { sendLock.current = false; setSending(false); }
  }

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
        <button ref={trigger} disabled={sending} className="reports-primary" aria-expanded={open} aria-controls="report-form" onClick={() => { setOpen(!open); setReview(false); setError(""); }}> {open ? "Fechar formulário" : "+ Nova denúncia"}</button>
      </header>

      <section className="reports-intro" aria-labelledby="reports-intro-title"><span className="reports-symbol" aria-hidden="true">◇</span><div><h2 id="reports-intro-title">Boas conexões começam com respeito.</h2><p>Encontrou um perfil suspeito ou passou por uma situação inadequada? Descreva o que aconteceu para que a administração possa avaliar.</p></div></section>
      {success && <p className="reports-notice" role="status">{success}</p>}

      {open && <section className="reports-card" id="report-form" aria-labelledby="report-form-title">
        <div className="reports-card-heading"><div><p className="dash-label">CONTE O QUE ACONTECEU</p><h2 id="report-form-title">Nova denúncia</h2></div><span className="reports-tag">Não enviada</span></div>
        {!review ? <form onSubmit={event => { event.preventDefault(); const username = form.username.trim().replace(/^@/, ""); if (!username || username === profile.username) { setError("Informe o username de outro perfil."); return; } setForm(previous => ({ ...previous, username })); if (form.descricao.trim().length < 20) { setError("Descreva o ocorrido com pelo menos 20 caracteres, sem contar espaços nas extremidades."); return; } setError(""); setReview(true); }}>
          {error && <p className="reports-error" role="alert">{error}</p>}
          <div className="reports-fields">
<label>Perfil denunciado<input ref={firstField} name="username" value={form.username} onChange={change} required maxLength={200} autoComplete="off" spellCheck={false} placeholder="Digite o username, ex.: @ana.creator" aria-describedby="report-username-help" /><small id="report-username-help">Informe o nome de usuário exato do perfil, com ou sem @.</small></label>
            <label>Motivo<select name="motivo" value={form.motivo} onChange={change} required><option value="">Selecione o motivo</option>{motivos.map(motivo => <option key={motivo}>{motivo}</option>)}</select></label>
            <label className="reports-wide">O que aconteceu?<textarea name="descricao" value={form.descricao} onChange={change} rows={6} minLength={20} maxLength={2000} required placeholder="Descreva a situação, quando aconteceu e os detalhes que ajudem a entender o problema." aria-describedby="report-description-help" /><small id="report-description-help">Mínimo de 20 caracteres. Não inclua senhas ou dados bancários. <span>{form.descricao.length}/2000</span></small></label>
          </div>
          <div className="reports-actions"><span>Revise as informações antes de enviar.</span><button type="button" onClick={close}>Fechar</button><button className="reports-primary" type="submit" disabled={!form.username.trim()}>Revisar relato →</button></div>
        </form> : <div>
          <h3 ref={reviewHeading} tabIndex={-1}>Revise seu relato</h3>
          <dl className="reports-details"><div><dt>Perfil denunciado</dt><dd>@{form.username}</dd></div><div><dt>Motivo</dt><dd>{form.motivo}</dd></div><div><dt>Descrição</dt><dd>{form.descricao.trim()}</dd></div></dl>
          {sendError && <p className="reports-error" role="alert">{sendError}</p>}
          <div className="reports-actions"><button type="button" disabled={sending} onClick={() => { setReview(false); setSendError(""); }}>Editar relato</button><button type="button" className="reports-primary" disabled={sending} onClick={send}>{sending ? "Enviando…" : "Enviar denúncia"}</button></div>
        </div>}
      </section>}

      <section className="reports-card" aria-labelledby="reports-history-title">
        <div className="reports-card-heading"><h2 id="reports-history-title">Minhas denúncias</h2><button type="button" onClick={history.reload} disabled={history.loading || sending}>Atualizar histórico</button></div>
        {history.loading ? <p role="status">Carregando denúncias…</p> : history.error ? <p className="reports-error" role="alert">{history.error}</p> : !history.records.length ? <div className="reports-empty"><span aria-hidden="true">◎</span><h3>Você ainda não enviou denúncias</h3><p>Se precisar relatar um problema, use o botão Nova denúncia.</p></div> : history.records.map(item => <details className="reports-history-item" key={item.id}><summary><strong>@{item.denunciado} · {item.motivo}</strong><span className="reports-tag">{statusDenuncia[item.status] || item.status}</span><small>{new Date(item.criada_em).toLocaleDateString("pt-BR")}</small></summary><dl className="reports-details"><div><dt>Protocolo</dt><dd>{item.id}</dd></div><div><dt>Seu relato</dt><dd>{item.descricao}</dd></div><div><dt>Resposta da administração</dt><dd>{item.resposta || "Ainda não há resposta da administração."}</dd></div></dl></details>)}
      </section>
    </div>
  </main>;
}
