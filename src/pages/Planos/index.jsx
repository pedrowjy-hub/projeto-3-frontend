import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSession } from "../../services/session";
import { hasActivePremium, subscriptionDate } from "../../services/assinatura";
import Sidebar from "../Dashboard/Sidebar";
import "../Dashboard/index.css";
import "./index.css";

function ConfirmPlan({ cancel, saving, error, onClose, onConfirm }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} className="plans-dialog" aria-labelledby="plan-confirm-title" aria-describedby="plan-confirm-description" onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}>
    <p className="dash-label">SUA ASSINATURA</p>
    <h2 id="plan-confirm-title">{cancel ? "Voltar ao plano gratuito?" : "Ativar o Premium?"}</h2>
    <p id="plan-confirm-description">{cancel ? "Sua assinatura será encerrada imediatamente. Você continuará com acesso ao plano gratuito." : "O Premium custa R$ 29,90 por mês, com renovação automática mensal até o cancelamento. Nesta demonstração, a ativação libera 30 dias de acesso, sem realizar cobranças ou renovações."}</p>
    {error && <p className="plans-error" role="alert">{error}</p>}
    <div className="plans-dialog-actions"><button className="plans-button plans-button-light" type="button" disabled={saving} onClick={onClose}>Voltar</button><button className="plans-button" type="button" disabled={saving} onClick={onConfirm}>{saving ? "Salvando…" : cancel ? "Confirmar cancelamento" : "Confirmar ativação"}</button></div>
  </dialog>;
}

export default function Planos() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/login", { replace: true }); return; }
    async function load() {
      try {
        const user = await getSession(token);
        if (!active) return;
        if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
        const response = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Não foi possível carregar sua assinatura. Tente novamente.");
        const account = await response.json();
        if (active) { setProfile({ ...user, ...account }); setNow(Date.now()); }
      } catch (err) { if (active) setError(err.message); }
    }
    load();
    return () => { active = false; };
  }, [navigate, attempt]);

  const expiration = subscriptionDate(profile?.expiracao_assinatura);
  const premium = hasActivePremium(profile, now);

  async function changePlan() {
    if (saving) return;
    setSaving(true); setError(""); setMessage("");
    const activate = confirm === "activate";
    const data = { assinatura: activate };
    if (activate) {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      data.expiracao_assinatura = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
    }
    try {
      const response = await fetch(`/api/usuarios/${encodeURIComponent(profile.username)}/assinatura`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify(data),
      });
      if (response.status === 401 || response.status === 422) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true }); return;
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.erro || "Não foi possível alterar sua assinatura. Tente novamente.");
      setProfile(previous => ({ ...previous, ...data, expiracao_assinatura: data.expiracao_assinatura || null }));
      setNow(Date.now());
      setConfirm(null);
      setMessage(activate ? "Premium ativado em modo demonstração por 30 dias. Nenhuma cobrança foi realizada." : "Assinatura cancelada. Seu plano agora é o Gratuito.");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function openConfirmation(action) { setError(""); setMessage(""); setConfirm(action); }

  if (!profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando seus planos…"}</p>{error && <><button className="plans-button" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Tentar novamente</button><Link to="/login">Voltar ao login</Link></>}</main>;

  return <main className="dash-page plans-page">
    <Sidebar profile={profile} />
    <div className="dash-content">
      <header className="dash-header"><div><p className="dash-label">ESPAÇO PARA CRESCER</p><h1>Planos<span> ✦</span></h1></div><span className="dash-role">{profile.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</span></header>
      <section className="plans-intro"><div><p className="dash-label">SEU PRÓXIMO PASSO</p><h2>Boas conexões.<br />Novas <em>possibilidades.</em></h2><p>Conheça os planos e gerencie sua assinatura em um só lugar.</p></div><span className="plans-spark" aria-hidden="true">✦</span></section>
      <section className="plans-current" aria-labelledby="current-plan-title"><div><p className="dash-label">SEU PLANO ATUAL</p><h2 id="current-plan-title">{premium ? "Premium" : "Gratuito"} <span className="plans-status">{premium ? "Assinatura ativa" : "Sem assinatura ativa"}</span></h2><p>{premium ? <>Válido até <time dateTime={`${expiration.getFullYear()}-${String(expiration.getMonth() + 1).padStart(2, "0")}-${String(expiration.getDate()).padStart(2, "0")}`}>{expiration.toLocaleDateString("pt-BR")}</time>. Período de demonstração, sem cobrança.</> : profile.assinatura && expiration && expiration.getTime() < now ? "Sua assinatura expirou. Ative novamente para iniciar um novo período." : "Comece a criar conexões e explore a comunidade no seu ritmo."}</p></div>{premium && <button className="plans-cancel" type="button" onClick={() => openConfirmation("cancel")}>Cancelar assinatura</button>}</section>
      <div className="plans-feedback" role="status">{message}</div>
      <section className="plans-grid" aria-label="Planos disponíveis">
        <article className="plans-card"><p className="dash-label">PARA COMEÇAR</p><h2>Gratuito</h2><p className="plans-description">O primeiro passo para encontrar boas parcerias.</p><p className="plans-price">R$ 0 <span>/ sem prazo</span></p><ul><li>Perfil na comunidade</li><li>Exploração de empresas e influenciadores</li><li>Acesso às postagens da plataforma</li><li>Chat e fechamento de contratos disponíveis somente no Premium</li></ul>{premium ? <button className="plans-button plans-button-light" onClick={() => openConfirmation("cancel")}>Mudar para Gratuito <span aria-hidden="true">→</span></button> : <p className="plans-current-label">✓ Seu plano atual</p>}</article>
        <article className="plans-card plans-card-premium"><div className="plans-card-top"><p className="dash-label">UM NOVO CICLO</p><span className="plans-badge">PREMIUM ✦</span></div><h2>Premium</h2><p className="plans-description">Chat e fechamento de contratos exclusivos para assinantes. Para influenciadores, maior visibilidade nas buscas e filtros por área. Para empresas, acesso a análises de influenciadores e comentários de empresas que já fecharam acordos com eles. Esses benefícios estão em construção. R$ 29,90/mês, com renovação automática e cancelamento a qualquer momento.</p><p className="plans-price">R$ 29,90 <span>/ mês</span></p><ul><li>Tudo do plano Gratuito</li><li>Chat exclusivo para assinantes Premium</li><li>Fechamento de contratos exclusivo para assinantes <span className="plans-coming-soon">Em construção</span></li><li>Renovação automática mensal</li><li>Consulta de status e validade</li><li>Cancelamento a qualquer momento</li></ul>
          <div className="plans-benefits" aria-label="Benefícios por tipo de perfil">
            <section><h3>Para influenciadores <span className="plans-coming-soon">Em construção</span></h3><p>Maior visibilidade do seu perfil nas buscas e nos filtros por área, para ser encontrado por empresas e outros influenciadores.</p></section>
            <section><h3>Para empresas <span className="plans-coming-soon">Em construção</span></h3><p>Acesso às análises de influenciadores e aos comentários de empresas que já fecharam acordos com eles, para ajudar na escolha de novas parcerias.</p></section>
          </div>{premium ? <p className="plans-current-label">✓ Seu plano atual</p> : <button className="plans-button" onClick={() => openConfirmation("activate")}>Ativar Premium <span aria-hidden="true">↗</span></button>}</article>
      </section>
      <p className="plans-note">Modo demonstração: Premium por R$ 29,90/mês, com renovação automática prevista para a integração de pagamentos. Por enquanto, a ativação libera 30 dias de acesso, sem cobranças ou renovações efetivas.</p>
      <section className="plans-faq" aria-labelledby="plans-faq-title"><p className="dash-label">TUDO ÀS CLARAS</p><h2 id="plans-faq-title">Dúvidas sobre os planos</h2><details><summary>Preciso de Premium para conversar e fechar contratos?</summary><p>Sim. Empresas e influenciadores precisam de uma assinatura Premium ativa para utilizar o chat e fechar contratos. No plano Gratuito, você pode explorar perfis e acompanhar postagens. A interface de mensagens e o fluxo de contratos ainda estão em construção.</p></details><details><summary>Quais benefícios estão em construção?</summary><p>Para influenciadores, estamos preparando maior visibilidade nas buscas e nos filtros por área. Para empresas, estão previstos análises de influenciadores e acesso aos comentários de outras empresas que já fecharam acordos com eles. Esses benefícios ainda não estão disponíveis.</p></details><details><summary>Como funciona a ativação?</summary><p>O Premium tem valor de R$ 29,90 por mês e prevê renovação automática mensal até o cancelamento. Nesta demonstração, a ativação registra apenas 30 dias de acesso, sem solicitar pagamento ou executar renovações.</p></details><details><summary>Posso cancelar quando quiser?</summary><p>Sim. Com a integração de pagamentos, o cancelamento interromperá as próximas renovações e manterá o Premium até o fim do período pago. Nesta demonstração, o cancelamento encerra o acesso Premium imediatamente.</p></details><details><summary>Como funciona a renovação automática?</summary><p>Com a integração de pagamentos, uma nova cobrança de R$ 29,90 será feita a cada mês para manter o Premium ativo, até você cancelar. Na demonstração atual, não há cobrança ou renovação efetiva: ao fim dos 30 dias, o perfil volta ao plano Gratuito.</p></details></section>
    </div>
    {confirm && <ConfirmPlan cancel={confirm === "cancel"} saving={saving} error={error} onClose={() => { setConfirm(null); setError(""); }} onConfirm={changePlan} />}
  </main>;
}
