import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { aprovarContrato, enviarContrato, sincronizarContrato, baixarContrato, acessoAssinatura } from "../../services/contratos";
import { abrirAssinatura } from "../../services/assinaturaIncorporada";
import "../../pages/Contratos/index.css";

const STATUS = { rascunho: "Em revisão", enviando: "Preparando assinatura", revisao_necessaria: "Conferência necessária",
  aguardando_assinaturas: "Aguardando assinaturas", parcialmente_assinado: "Uma assinatura concluída", assinado: "Assinado", recusado: "Recusado", falha: "Falha no provedor" };

function Confirmacao({ tipo, contrato, busy, error, close, confirm, download }) {
  const dialog = useRef(null);
  const [revisado, setRevisado] = useState(false);
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close(); }, []);
  return <dialog ref={dialog} className="contracts-dialog" aria-labelledby={`contract-confirm-${contrato.id}`} onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <p className="dash-label">A MESMA VERSÃO PARA OS DOIS</p><h2 id={`contract-confirm-${contrato.id}`}>{tipo === "revisar" ? "Revise antes de aprovar" : "Preparar assinatura de teste?"}</h2>
    <p><strong>{contrato.titulo}</strong></p><p>Documento: {contrato.nome_arquivo}. Identificador da versão: <code>{contrato.sha256.slice(0, 12)}</code>.</p>
    <ul>{contrato.signatarios.map(pessoa => <li key={pessoa.username}><strong>{pessoa.nome}</strong><span>{pessoa.email}</span></li>)}</ul>
    {tipo === "revisar" ? <><p>Baixe e confira o PDF. Sua aprovação registra esta versão da negociação; ela não substitui a assinatura eletrônica.</p><button className="contracts-button" disabled={busy} onClick={download}>Baixar PDF para revisar</button><label className="contracts-review-check"><input type="checkbox" checked={revisado} onChange={event => setRevisado(event.target.checked)} disabled={busy} />Revisei o documento e aprovo esta versão.</label></> : <p>Os dois participantes já aprovaram este PDF. O documento e os nomes/e-mails serão compartilhados com o Dropbox Sign para a assinatura dentro da plataforma, exclusivamente em modo de teste.</p>}
    {error && <p role="alert" className="contracts-error">{error}</p>}
    <div className="contracts-actions"><button className="contracts-button" disabled={busy} onClick={close}>Voltar</button><button className="contracts-button contracts-primary" disabled={busy || (tipo === "revisar" && !revisado)} onClick={confirm}>{busy ? "Processando…" : tipo === "revisar" ? "Aprovar esta versão" : "Preparar assinatura"}</button></div>
  </dialog>;
}

export default function ContratoCard({ contrato, profile, interativo = false, onUpdate }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(null);
  const pending = useRef(false), alive = useRef(false), signingCleanup = useRef(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; signingCleanup.current?.(); }; }, []);
  const role = contrato.conversa?.id_empresa === profile.username ? "empresa" : "influenciador";
  const approved = !!contrato.aprovacoes?.[role];
  const bothApproved = !!contrato.aprovacoes?.empresa && !!contrato.aprovacoes?.influenciador;
  const signed = contrato.signatarios.find(item => item.username === profile.username)?.assinado;

  async function run(action) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(""); setMessage("");
    try { await action(localStorage.getItem("access_token")); }
    catch (err) { if (alive.current) setError(err.message); }
    finally { pending.current = false; if (alive.current) setBusy(false); }
  }
  async function download(token, tipo = "original") {
    const blob = await baixarContrato(token, contrato.id, tipo);
    if (!alive.current) return;
    const url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = `contrato-${contrato.id}-${tipo}.pdf`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function sync(token) {
    const updated = await sincronizarContrato(token, contrato.id);
    if (alive.current) onUpdate?.(updated);
  }
  function approveOrPrepare() {
    run(async token => {
      const updated = confirm === "revisar" ? await aprovarContrato(token, contrato.id, contrato.sha256) : await enviarContrato(token, contrato.id);
      if (!alive.current) return;
      onUpdate?.(updated); setConfirm(null);
      setMessage(confirm === "revisar" ? "Aprovação registrada para esta versão." : "Documento preparado. Cada participante pode usar Assinar aqui.");
    });
  }
  function sign() {
    if (signingCleanup.current) return;
    run(async token => {
      const data = await acessoAssinatura(token, contrato.id);
      if (!alive.current) return;
      const cleanup = await abrirAssinatura(data, {
        isActive: () => alive.current,
        onSign: () => setMessage("Assinatura enviada. Aguardando a confirmação do provedor."),
        onError: err => setError(err.message),
        onClose: () => { signingCleanup.current = null; if (alive.current) run(sync); },
      });
      if (!alive.current) cleanup(); else signingCleanup.current = cleanup;
    });
  }

  return <article className="contracts-card">
    <div className="contracts-list-heading"><h3>{contrato.titulo}</h3><span className="contracts-status">{STATUS[contrato.status] || "Em conferência"}</span></div>
    <p className="contracts-date">{new Date(contrato.criado_em).toLocaleString("pt-BR")} · Versão {contrato.sha256.slice(0, 8)} · Teste</p>
    <ul className="contracts-people">{contrato.signatarios.map(pessoa => { const papel = contrato.conversa?.id_empresa === pessoa.username ? "empresa" : "influenciador"; return <li key={pessoa.username}><div><strong>{pessoa.nome}</strong><span>{pessoa.email}</span></div><span>{pessoa.assinado ? "✓ Assinou" : contrato.aprovacoes?.[papel] ? "✓ Revisou e aprovou" : "Aguardando revisão"}</span></li>; })}</ul>
    {contrato.status === "rascunho" && <p>{bothApproved ? "Os dois aprovaram a mesma versão. A assinatura pode ser preparada." : "Os dois participantes precisam conferir e aprovar o PDF antes de assinar."}</p>}
    {["enviando", "revisao_necessaria"].includes(contrato.status) && <p className="contracts-warning">A preparação precisa ser conferida no provedor. Não prepare outra cópia antes dessa conferência.</p>}
    {error && <p className="contracts-error" role="alert">{error}</p>}{message && <p className="contracts-message" role="status">{message}</p>}
    <div className="contracts-actions"><button className="contracts-button" disabled={busy} onClick={() => run(token => download(token))}>Baixar original</button>
      {!interativo && contrato.chat_id && <Link className="contracts-button contracts-primary" to={`/mensagens?conversa=${encodeURIComponent(contrato.chat_id)}`}>Abrir negociação ↗</Link>}
      {interativo && contrato.status === "rascunho" && !approved && <button className="contracts-button contracts-primary" disabled={busy} onClick={() => { setError(""); setConfirm("revisar"); }}>Revisar e aprovar</button>}
      {interativo && contrato.status === "rascunho" && bothApproved && <button className="contracts-button contracts-primary" disabled={busy} onClick={() => { setError(""); setConfirm("preparar"); }}>Preparar assinatura</button>}
      {interativo && ["aguardando_assinaturas", "parcialmente_assinado"].includes(contrato.status) && !signed && <button className="contracts-button contracts-primary" disabled={busy} onClick={sign}>Assinar aqui ↗</button>}
      {contrato.status !== "rascunho" && <button className="contracts-button" disabled={busy} onClick={() => run(sync)}>Atualizar status</button>}
      {contrato.status === "assinado" && <button className="contracts-button contracts-primary" disabled={busy} onClick={() => run(token => download(token, "assinado"))}>Baixar PDF assinado</button>}
    </div>
    {!contrato.chat_id && <p>Esta versão é anterior ao vínculo com o chat. Prepare uma nova versão dentro da conversa para assinar na plataforma.</p>}
    {confirm && <Confirmacao tipo={confirm} contrato={contrato} busy={busy} error={error} close={() => setConfirm(null)} confirm={approveOrPrepare} download={() => run(token => download(token))} />}
  </article>;
}
