import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import Sidebar from "../Dashboard/Sidebar";
import ContratosDaConversa from "../../components/ContratosDaConversa";
import { getSession } from "../../services/session";
import { hasActivePremium } from "../../services/assinatura";
import usePremiumStatus from "../../hooks/usePremiumStatus";
import { listarConversas, iniciarConversa, lerMensagens, enviarMensagem } from "../../services/conversas";
import "../Dashboard/index.css";
import "../Contratos/index.css";
import "./index.css";

function Conversa({ chat, profile }) {
  const [messages, setMessages] = useState([]), [text, setText] = useState("");
  const [error, setError] = useState(""), [sending, setSending] = useState(false), [older, setOlder] = useState(false);
  const [tab, setTab] = useState("conversa"), [loaded, setLoaded] = useState(false);
  const alive = useRef(false), pending = useRef(false), viewport = useRef(null), shouldScroll = useRef(true), revision = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let active = true, fetching = false;
    const controller = new AbortController();
    async function load() {
      if (fetching || pending.current) return;
      fetching = true;
      const version = revision.current;
      try {
        const data = await lerMensagens(localStorage.getItem("access_token"), chat.id, controller.signal);
        if (!active || pending.current || version !== revision.current) return;
        const element = viewport.current;
        shouldScroll.current = !element || element.scrollHeight - element.scrollTop - element.clientHeight < 90;
        setMessages(data.mensagens); setOlder(data.tem_anteriores === true); setError(""); setLoaded(true);
      } catch (err) { if (active) setError(err.message); }
      finally { fetching = false; }
    }
    load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 5000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, [chat.id]);
  useEffect(() => { if (shouldScroll.current && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight; }, [messages, tab]);

  async function send(event) {
    event.preventDefault();
    if (pending.current || !text.trim()) return;
    pending.current = true; revision.current++; setSending(true); setError("");
    try {
      const message = await enviarMensagem(localStorage.getItem("access_token"), chat.id, text.trim());
      if (!alive.current) return;
      shouldScroll.current = true; setMessages(previous => [...previous.filter(item => item.id !== message.id), message].slice(-200)); setText("");
    } catch (err) { if (alive.current) setError(err.message); }
    finally { pending.current = false; if (alive.current) setSending(false); }
  }
  return <section className="messages-conversation" aria-label={`Negociação com ${chat.parceiro.nome}`}>
    <header className="messages-conversation-header"><div className="messages-peer"><span className="messages-peer-avatar" aria-hidden="true">{(chat.parceiro.nome || chat.parceiro.username).slice(0, 1).toLocaleUpperCase("pt-BR")}</span><div><h2>{chat.parceiro.nome}</h2><p>@{chat.parceiro.username} · {chat.parceiro.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</p></div></div><button className="contracts-button contracts-primary" onClick={() => setTab("contratos")}>Contratos da conversa ↗</button></header>
    <div className="messages-tabs" role="tablist" aria-label="Conteúdo da negociação"><button id="conversation-tab" type="button" role="tab" aria-selected={tab === "conversa"} aria-controls="conversation-messages" onClick={() => setTab("conversa")}>Conversa</button><button id="contracts-tab" type="button" role="tab" aria-selected={tab === "contratos"} aria-controls="conversation-contracts" onClick={() => setTab("contratos")}>Contratos e assinaturas</button></div>
    <div id="conversation-messages" role="tabpanel" aria-labelledby="conversation-tab" hidden={tab !== "conversa"}>
      <div ref={viewport} className="messages-history" role="log" aria-label="Mensagens da negociação" aria-live="polite">
        {older && <p className="messages-notice">Exibindo as 200 mensagens mais recentes. O histórico anterior permanece salvo.</p>}
        {!loaded && !error ? <p role="status">Carregando mensagens…</p> : messages.length ? messages.map((message, index) => <div className={`messages-bubble${message.remetente_id === profile.username ? " messages-mine" : ""}`} key={message.id || `${index}-${message.remetente_id}`}><strong>{message.remetente_id === profile.username ? "Você" : chat.parceiro.nome}</strong><p>{message.mensagem}</p>{message.criado_em && <time dateTime={message.criado_em}>{new Date(message.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>}</div>) : <div className="messages-empty"><h3>Boas parcerias começam com uma conversa.</h3><p>Alinhem entregas, valores e prazos antes de preparar o contrato.</p></div>}
      </div>
      {error && <p className="contracts-error" role="alert">{error}</p>}
      <form className="messages-compose" onSubmit={send}><label htmlFor="negotiation-message">Sua mensagem</label><textarea id="negotiation-message" rows={3} maxLength={4000} value={text} onChange={event => setText(event.target.value)} disabled={sending} placeholder="Converse sobre a parceria…" onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }} /><div><small>Enter envia · Shift + Enter quebra a linha</small><button className="contracts-button contracts-primary" disabled={sending || !text.trim()}>{sending ? "Enviando…" : "Enviar mensagem ↗"}</button></div></form>
    </div>
    <div id="conversation-contracts" role="tabpanel" aria-labelledby="contracts-tab" hidden={tab !== "contratos"}><ContratosDaConversa chat={chat} profile={profile} /></div>
  </section>;
}

export default function Mensagens() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [profile, setProfile] = useState(null), [chats, setChats] = useState([]), [partners, setPartners] = useState([]);
  const [partner, setPartner] = useState(() => params.get("parceiro") || ""), [error, setError] = useState("");
  const [loading, setLoading] = useState(true), [creating, setCreating] = useState(false), [attempt, setAttempt] = useState(0);
  const busy = useRef(false), alive = useRef(false);
  const { premium } = usePremiumStatus(profile);
  const selected = chats.find(item => item.id === params.get("conversa")) || null;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      setLoading(true); setError("");
      const token = localStorage.getItem("access_token");
      if (!token) { navigate("/login", { replace: true }); return; }
      try {
        const user = await getSession(token);
        if (!active) return;
        if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
        setProfile(user);
        if (!hasActivePremium(user, Date.now())) return;
        const data = await listarConversas(token, controller.signal);
        const response = await fetch(`/api/usuarios?tipo_perfil=${user.tipo_perfil === "empresa" ? "influenciador" : "empresa"}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Não foi possível carregar os perfis para conversar.");
        const candidates = await response.json();
        if (active) { setChats(data); setPartners(Array.isArray(candidates) ? candidates : []); }
      } catch (err) { if (active) { if ([401, 422].includes(err.status)) navigate("/login", { replace: true }); else setError(err.message); } }
      finally { if (active) setLoading(false); }
    }
    load(); return () => { active = false; controller.abort(); };
  }, [navigate, attempt]);

  async function start(event) {
    event.preventDefault();
    if (busy.current || !partner) return;
    busy.current = true; setCreating(true); setError("");
    try {
      const chat = await iniciarConversa(localStorage.getItem("access_token"), partner);
      if (!alive.current) return;
      setChats(previous => [chat, ...previous.filter(item => item.id !== chat.id)]); setParams({ conversa: chat.id });
    } catch (err) { if (alive.current) setError(err.message); }
    finally { busy.current = false; if (alive.current) setCreating(false); }
  }
  if (!profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando mensagens…"}</p>{error && <button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}</main>;
  return <main className="dash-page messages-page"><Sidebar profile={profile} /><div className="dash-content messages-content"><header className="dash-header"><div><p className="dash-label">CONVERSE. NEGOCIE. COMBINE.</p><h1>Mensagens<span> ✦</span></h1></div><Link to="/contratos" className="contracts-button">Ver todos os contratos</Link></header>
    {!premium ? <section className="contracts-card"><h2>Converse e negocie com o Premium.</h2><p>Empresas e influenciadores precisam de Premium ativo para usar o chat e preparar contratos.</p><Link className="contracts-button contracts-primary" to="/planos">Conhecer o Premium ↗</Link></section> : <>
      <form className="messages-start" onSubmit={start}><label htmlFor="conversation-partner">Nova negociação<select id="conversation-partner" required value={partner} onChange={event => setPartner(event.target.value)} disabled={loading || creating}><option value="">Escolha um perfil</option>{partners.map(item => <option key={item.username} value={item.username}>{item.nome || item.username} (@{item.username})</option>)}</select></label><button className="contracts-button contracts-primary" disabled={loading || creating || !partner}>{creating ? "Abrindo…" : "Iniciar conversa ↗"}</button><button type="button" className="contracts-button" disabled={creating || loading} onClick={() => setAttempt(value => value + 1)}>Atualizar lista</button></form>
      {error && <p className="contracts-error" role="alert">{error}</p>}
      {loading ? <p role="status">Carregando conversas…</p> : <div className="messages-workspace"><nav className="messages-chat-list" aria-label="Suas negociações">{chats.length ? chats.map(chat => <button type="button" key={chat.id} aria-current={selected?.id === chat.id ? "true" : undefined} onClick={() => setParams({ conversa: chat.id })}><span className="messages-chat-avatar" aria-hidden="true">{(chat.parceiro.nome || chat.parceiro.username).slice(0, 1).toLocaleUpperCase("pt-BR")}</span><span className="messages-chat-copy"><strong>{chat.parceiro.nome}</strong><small>@{chat.parceiro.username}</small></span><span className="messages-chat-arrow" aria-hidden="true">↗</span></button>) : <p>Nenhuma conversa por enquanto.</p>}</nav>{selected ? <Conversa key={selected.id} chat={selected} profile={profile} /> : <div className="messages-empty"><span aria-hidden="true">↗</span><h2>Uma boa conversa abre possibilidades.</h2><p>Escolha uma negociação ou inicie uma nova. O contrato ficará vinculado ao chat de vocês.</p></div>}</div>}
    </>}
  </div></main>;
}
