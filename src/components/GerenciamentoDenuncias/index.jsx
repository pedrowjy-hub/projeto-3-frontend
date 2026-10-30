import { useState } from "react";
import "./index.css";

const statusLabels = { pendente: "Pendente", em_analise: "Em análise", concluida: "Concluída" };
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const dateLabel = value => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("pt-BR") : "—";
};

// Dados devem vir de uma rota administrativa autorizada. null significa serviço indisponível.
export default function GerenciamentoDenuncias({ denuncias = null }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const available = Array.isArray(denuncias);
  const records = available ? denuncias : [];
  const filtered = records.filter(item => (!status || item.status === status) &&
    [item.id, item.denunciante, item.denunciado, item.motivo].some(value => normalize(value).includes(normalize(busca.trim()))));

  return <section className="admin-reports" aria-labelledby="admin-reports-title">
    <header className="admin-reports-heading"><div><p className="admin-reports-eyebrow">MODERAÇÃO DA COMUNIDADE</p><h2 id="admin-reports-title">Gerenciamento de denúncias</h2><p>Consulte os relatos, acompanhe a análise e prepare o retorno ao usuário.</p></div><span className="admin-reports-badge">Administração</span></header>
    <div className="admin-reports-counts">{Object.entries(statusLabels).map(([value, label]) => <div key={value}><span>{label}</span><strong>{available ? records.filter(item => item.status === value).length : "—"}</strong></div>)}</div>
    {!available && <p className="admin-reports-notice" role="status"><strong>Serviço de denúncias ainda indisponível.</strong> A consulta dos relatos e o salvamento das análises dependem da integração com o backend. Nenhuma denúncia está sendo carregada nesta tela.</p>}
    <div className="admin-reports-filters"><label>Buscar denúncia<input type="search" placeholder="Perfil, motivo ou protocolo" value={busca} onChange={event => setBusca(event.target.value)} disabled={!available} /></label><label>Status<select value={status} onChange={event => setStatus(event.target.value)} disabled={!available}><option value="">Todos os status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="button" className="admin-botao admin-botao-secundario" disabled={!busca && !status} onClick={() => { setBusca(""); setStatus(""); }}>Limpar filtros</button></div>
    {filtered.length ? <div className="admin-tabela-container"><table className="admin-tabela"><caption className="admin-sr-only">Denúncias recebidas</caption><thead><tr><th scope="col">Protocolo / data</th><th scope="col">Denunciante</th><th scope="col">Perfil denunciado</th><th scope="col">Motivo</th><th scope="col">Status</th><th scope="col">Ação</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td>{item.id}<br />{dateLabel(item.criada_em)}</td><td>@{item.denunciante}</td><td>@{item.denunciado}</td><td>{item.motivo}</td><td>{statusLabels[item.status] || "Não informado"}</td><td><button type="button" className="admin-botao admin-botao-secundario" onClick={() => setSelected(item)}>Analisar</button></td></tr>)}</tbody></table></div> : <div className="admin-reports-empty"><span aria-hidden="true">◇</span><h3>{!available ? "Aguardando conexão com o serviço" : records.length ? "Nenhuma denúncia encontrada" : "Nenhuma denúncia recebida"}</h3><p>{!available ? "Os relatos recebidos aparecerão aqui com o perfil, motivo, data e andamento." : records.length ? "Ajuste a busca ou o filtro de status." : "Quando um usuário enviar uma denúncia, ela aparecerá nesta lista."}</p></div>}
    <details className="admin-reports-guide"><summary>Como funciona a análise?</summary><ol><li><strong>Pendente:</strong> relato recebido, aguardando avaliação.</li><li><strong>Em análise:</strong> confira o perfil denunciado e o contexto descrito.</li><li><strong>Concluída:</strong> registre a conclusão e a resposta destinada ao denunciante.</li></ol><p>Uma denúncia, por si só, não exclui nem bloqueia uma conta.</p></details>
    {selected && <Analise key={selected.id} denuncia={selected} onClose={() => setSelected(null)} />}
  </section>;
}

function Analise({ denuncia, onClose }) {
  const [status, setStatus] = useState(denuncia.status);
  const [resposta, setResposta] = useState(denuncia.resposta || "");
  return <section className="admin-reports-analysis" aria-label="Análise da denúncia"><div className="admin-reports-heading"><h3>Denúncia {denuncia.id}</h3><button className="admin-botao admin-botao-secundario" type="button" onClick={onClose}>Fechar análise</button></div><dl><dt>Denunciante</dt><dd>@{denuncia.denunciante}</dd><dt>Perfil denunciado</dt><dd>@{denuncia.denunciado}</dd><dt>Motivo</dt><dd>{denuncia.motivo}</dd><dt>Relato</dt><dd>{denuncia.descricao}</dd></dl><label>Status da análise<select value={status} onChange={event => setStatus(event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Resposta ao denunciante<textarea rows={5} maxLength={2000} value={resposta} onChange={event => setResposta(event.target.value)} placeholder="Descreva o resultado da análise e as providências tomadas." /></label><p id="admin-report-save-unavailable" className="admin-reports-notice">As alterações não serão salvas enquanto a integração estiver indisponível.</p><button className="admin-botao admin-botao-primario" type="button" disabled aria-describedby="admin-report-save-unavailable">Salvar análise</button></section>;
}
