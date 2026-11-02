import { useEffect, useRef, useState } from "react";
import { criarContrato, listarContratos } from "../../services/contratos";
import ContratoCard from "./ContratoCard";

export default function ContratosDaConversa({ chat, profile }) {
  const [contracts, setContracts] = useState([]), [error, setError] = useState(""), [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(""), [file, setFile] = useState(null), [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false), [attempt, setAttempt] = useState(0);
  const input = useRef(null), alive = useRef(false), pending = useRef(false), revision = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true, fetching = false;
    async function load() {
      if (fetching || pending.current) return;
      fetching = true;
      const version = revision.current;
      try {
        const data = await listarContratos(localStorage.getItem("access_token"), controller.signal, chat.id);
        if (active && !pending.current && version === revision.current) { setContracts(data); setError(""); }
      } catch (err) { if (active) setError(err.message); }
      finally { fetching = false; if (active) setLoading(false); }
    }
    load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 7000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, [chat.id, attempt]);

  async function create(event) {
    event.preventDefault();
    if (pending.current) return;
    if (!file || file.size > 5 * 1024 * 1024) { setError("Selecione um PDF de até 5 MB."); return; }
    pending.current = true; revision.current++; setCreating(true); setError("");
    try {
      const contract = await criarContrato(localStorage.getItem("access_token"), { titulo: title.trim(), chatId: chat.id, documento: file });
      if (!alive.current) return;
      setContracts(previous => [contract, ...previous.filter(item => item.id !== contract.id)]);
      setTitle(""); setFile(null); setFormOpen(false); if (input.current) input.current.value = "";
    } catch (err) { if (alive.current) setError(err.message); }
    finally { pending.current = false; if (alive.current) setCreating(false); }
  }
  return <section className="conversation-contracts" aria-labelledby="conversation-contracts-title">
    <div className="contracts-list-heading"><div><h3 id="conversation-contracts-title">Contratos desta negociação</h3><p>Os participantes são os mesmos desta conversa. Cada PDF é uma versão preservada.</p></div><button className="contracts-button contracts-primary" onClick={() => setFormOpen(value => !value)} disabled={creating}>{formOpen ? "Fechar formulário" : "Novo contrato"}</button></div>
    {formOpen && <form className="contracts-card" onSubmit={create}><h3>Proposta para {chat.parceiro.nome}</h3><fieldset disabled={creating}><label>Título<input required minLength={3} maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Campanha de lançamento" /></label><label>PDF acordado<input ref={input} type="file" accept="application/pdf,.pdf" required onChange={event => setFile(event.target.files?.[0] || null)} /><small>Até 5 MB. Ambos precisarão revisar e aprovar esta versão.</small></label></fieldset><button type="submit" disabled={creating} className="contracts-button contracts-primary">{creating ? "Salvando…" : "Publicar para revisão"}</button></form>}
    {error && <div role="alert" className="contracts-error">{error} <button className="contracts-button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div>}
    {loading ? <p role="status">Carregando contratos…</p> : contracts.length ? contracts.map(contract => <ContratoCard key={contract.id} contrato={contract} profile={profile} interativo onUpdate={updated => { revision.current++; setContracts(previous => previous.map(item => item.id === updated.id ? updated : item)); }} />) : <div className="messages-empty"><h3>Primeiro, alinhem os detalhes.</h3><p>Quando o documento estiver pronto, use Novo contrato para iniciar a revisão.</p></div>}
  </section>;
}
