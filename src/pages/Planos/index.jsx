import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSession } from "../../services/session";
import { hasActivePremium, subscriptionDate } from "../../services/assinatura";
import { createCheckout, openSandboxCheckout } from "../../services/pagamentos";
import Sidebar from "../Dashboard/Sidebar";
import "../Dashboard/index.css";
import "./index.css";

function PlanDetails({ onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} id="premium-details" className="plans-dialog plans-details-dialog" aria-labelledby="premium-details-title" aria-describedby="premium-details-intro" onCancel={onClose}>
    <header className="plans-details-header">
      <div><p className="dash-label">CONHEÇA CADA BENEFÍCIO</p><h2 id="premium-details-title">Mais sobre o Premium</h2></div>
      <button className="plans-details-close" type="button" aria-label="Fechar informações do Premium" onClick={onClose} autoFocus>×</button>
    </header>
    <p id="premium-details-intro">Um plano para empresas e influenciadores que querem construir novas parcerias.</p>
    <div className="plans-details-sections">
      <section aria-labelledby="premium-details-connections">
        <h3 id="premium-details-connections">Chat e contratos</h3>
        <p>O chat e o fechamento de contratos são exclusivos para usuários com Premium ativo. Cada empresa ou influenciador precisa da própria assinatura para usar esses recursos.</p>
        <p>O chat permitirá conversar diretamente com possíveis parceiros e trocar mensagens e arquivos. O fluxo de contratos permitirá formalizar os acordos entre empresas e influenciadores.</p>
        <span className="plans-coming-soon">Interface de chat e contratos em construção</span>
      </section>
      <section aria-labelledby="premium-details-creators">
        <h3 id="premium-details-creators">Mais visibilidade para influenciadores</h3>
        <p>Perfis de influenciadores Premium terão maior destaque nos resultados de busca e nos filtros por área. A proposta é facilitar que empresas e outros influenciadores encontrem seu perfil e conheçam seu trabalho.</p>
        <span className="plans-coming-soon">Em construção</span>
      </section>
      <section aria-labelledby="premium-details-companies">
        <h3 id="premium-details-companies">Mais informações para empresas</h3>
        <p>Empresas Premium poderão consultar análises de influenciadores para conhecer melhor os perfis antes de propor uma parceria.</p>
        <p>Também poderão ler comentários de outras empresas que já fecharam acordos com o influenciador, reunindo informações sobre experiências anteriores para ajudar na escolha.</p>
        <span className="plans-coming-soon">Análises e consulta de comentários em construção</span>
      </section>
      <section aria-labelledby="premium-details-billing">
        <h3 id="premium-details-billing">Valor, renovação e cancelamento</h3>
        <p>O valor do plano é <strong>R$ 29,90 por mês</strong>, com renovação automática mensal prevista. Com a integração de pagamentos, você poderá cancelar as próximas renovações e manter o acesso até o fim do período pago.</p>
        <p className="plans-details-demo"><strong>Na demonstração atual:</strong> o botão abre o checkout do Paddle em sandbox, sem movimentar dinheiro real. A confirmação automática do Premium e o cancelamento da renovação ainda não estão conectados. Você pode consultar o status e a validade na aba Planos.</p>
      </section>
    </div>
    <div className="plans-dialog-actions"><button className="plans-button" type="button" onClick={onClose}>Entendi</button></div>
  </dialog>;
}

function ConfirmPlan({ saving, error, onClose, onConfirm }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} className="plans-dialog" aria-labelledby="plan-confirm-title" aria-describedby="plan-confirm-description" onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}>
    <p className="dash-label">SUA ASSINATURA</p>
    <h2 id="plan-confirm-title">Abrir checkout de teste?</h2>
    <p id="plan-confirm-description">Você abrirá o checkout do Paddle em sandbox para o Premium de R$ 29,90/mês. Use somente cartões fictícios. A confirmação automática do Premium e o cancelamento da renovação ainda estão em construção.</p>
    {error && <p className="plans-error" role="alert">{error}</p>}
    <div className="plans-dialog-actions"><button className="plans-button plans-button-light" type="button" disabled={saving} onClick={onClose}>Voltar</button><button className="plans-button" type="button" disabled={saving} onClick={onConfirm}>{saving ? "Preparando checkout…" : "Ir para checkout de teste"}</button></div>
  </dialog>;
}

export default function Planos() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const checkoutCleanup = useRef(null);
  const checkoutBusy = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; checkoutCleanup.current?.(); };
  }, []);

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
    if (checkoutBusy.current) return;
    checkoutBusy.current = true;
    setSaving(true); setError(""); setMessage("");
    const token = localStorage.getItem("access_token");
    try {
      if (!token) { navigate("/login", { replace: true }); return; }
      const checkout = await createCheckout(token);
      if (!mounted.current || localStorage.getItem("access_token") !== token) return;
      let completed = false;
      const cleanup = await openSandboxCheckout(checkout, event => {
        if (!mounted.current) return;
        if (event.name === "checkout.completed") {
          completed = true;
          setMessage("Checkout de teste concluído. Nenhum dinheiro real foi movimentado. O Premium ainda não será liberado: a confirmação automática por webhook está em construção.");
        } else if (event.name === "checkout.closed" && !completed) {
          setMessage("Checkout fechado. Seu plano não foi alterado. Você pode retomar o teste pelo botão Ativar Premium.");
        } else if (["checkout.error", "checkout.payment-error"].includes(event.name)) {
          setError("O checkout encontrou um problema. Feche-o e tente novamente.");
        }
      });
      if (!mounted.current) { cleanup(); return; }
      checkoutCleanup.current = cleanup;
      setConfirm(null);
      if (!completed) setMessage("Checkout de sandbox aberto. Use somente um cartão de teste; seu plano permanece inalterado nesta etapa.");
    } catch (err) {
      if (!mounted.current) return;
      if ([401, 422].includes(err.status)) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true }); return;
      }
      setError(err.message);
    } finally {
      checkoutBusy.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  function openConfirmation(action) { setError(""); setMessage(""); setConfirm(action); }

  if (!profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando seus planos…"}</p>{error && <><button className="plans-button" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Tentar novamente</button><Link to="/login">Voltar ao login</Link></>}</main>;

  return <main className="dash-page plans-page">
    <Sidebar profile={profile} />
    <div className="dash-content">
      <header className="dash-header"><div><p className="dash-label">ESPAÇO PARA CRESCER</p><h1>Planos<span> ✦</span></h1></div><span className="dash-role">{profile.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</span></header>
      <section className="plans-intro"><div><p className="dash-label">SEU PRÓXIMO PASSO</p><h2>Boas conexões.<br />Novas <em>possibilidades.</em></h2><p>Conheça os planos e gerencie sua assinatura em um só lugar.</p></div><span className="plans-spark" aria-hidden="true">✦</span></section>
      <section className="plans-current" aria-labelledby="current-plan-title"><div><p className="dash-label">SEU PLANO ATUAL</p><h2 id="current-plan-title">{premium ? "Premium" : "Gratuito"} <span className="plans-status">{premium ? "Assinatura ativa" : "Sem assinatura ativa"}</span></h2><p>{premium ? <>Válido até <time dateTime={`${expiration.getFullYear()}-${String(expiration.getMonth() + 1).padStart(2, "0")}-${String(expiration.getDate()).padStart(2, "0")}`}>{expiration.toLocaleDateString("pt-BR")}</time>. Período de demonstração, sem cobrança.</> : profile.assinatura && expiration && expiration.getTime() < now ? "Sua assinatura expirou. Ative novamente para iniciar um novo período." : "Comece a criar conexões e explore a comunidade no seu ritmo."}</p></div>{premium && <button className="plans-cancel" type="button" disabled title="O cancelamento pelo Paddle será implementado na próxima etapa.">Cancelamento em construção</button>}</section>
      <div className="plans-feedback" role="status">{message}</div>{error && !confirm && <p className="plans-error" role="alert">{error}</p>}
      <section className="plans-grid" aria-label="Planos disponíveis">
        <article className="plans-card"><p className="dash-label">PARA COMEÇAR</p><h2>Gratuito</h2><p className="plans-description">O primeiro passo para encontrar boas parcerias.</p><p className="plans-price">R$ 0 <span>/ sem prazo</span></p><ul><li>Perfil na comunidade</li><li>Exploração de empresas e influenciadores</li><li>Acesso às postagens da plataforma</li><li>Chat e fechamento de contratos disponíveis somente no Premium</li></ul>{premium ? <button className="plans-button plans-button-light" disabled title="O cancelamento pelo Paddle será implementado na próxima etapa.">Mudar para Gratuito <span aria-hidden="true">→</span></button> : <p className="plans-current-label">✓ Seu plano atual</p>}</article>
        <article className="plans-card plans-card-premium">
          <div className="plans-card-top"><p className="dash-label">UM NOVO CICLO</p><span className="plans-badge">PREMIUM ✦</span></div>
          <h2>Premium</h2>
          <p className="plans-description">Mais conexões para transformar seu próximo encontro em uma boa parceria.</p>
          <p className="plans-price">R$ 29,90 <span>/ mês</span></p>
          <p className="plans-billing">Renovação automática mensal.<br />Cancele quando quiser.</p>
          <ul>
            <li>Tudo do plano Gratuito</li>
            <li>Chat exclusivo para assinantes <span className="plans-coming-soon">Interface em construção</span></li>
            <li>Fechamento de contratos <span className="plans-coming-soon">Em construção</span></li>
            <li>Consulta de status e validade</li>
          </ul>
          <div className="plans-benefits" aria-label="Benefícios por tipo de perfil">
            <p className="plans-benefits-label">EM CONSTRUÇÃO PARA O SEU PERFIL</p>
            <section><h3>Para influenciadores</h3><p>Mais visibilidade nas buscas e nos filtros por área.</p></section>
            <section><h3>Para empresas</h3><p>Análises de influenciadores e comentários de empresas que já trabalharam com eles.</p></section>
          </div>
          <button className="plans-more-info" type="button" aria-haspopup="dialog" aria-controls="premium-details" onClick={() => setShowDetails(true)}>Mais informações sobre o plano <span aria-hidden="true">↗</span></button>
          {premium ? <p className="plans-current-label">✓ Seu plano atual</p> : <button className="plans-button" disabled={saving} onClick={() => openConfirmation("activate")}>Ativar Premium <span aria-hidden="true">↗</span></button>}</article>
      </section>
      <p className="plans-note">Sandbox Paddle: Premium de teste por R$ 29,90/mês, sem movimentar dinheiro real. O checkout já está conectado. A liberação automática do Premium, as renovações na plataforma e o cancelamento ainda dependem das próximas etapas da integração.</p>
      <section className="plans-faq" aria-labelledby="plans-faq-title"><p className="dash-label">TUDO ÀS CLARAS</p><h2 id="plans-faq-title">Dúvidas sobre os planos</h2><details><summary>Preciso de Premium para conversar e fechar contratos?</summary><p>Sim. Empresas e influenciadores precisam de uma assinatura Premium ativa para utilizar o chat e fechar contratos. No plano Gratuito, você pode explorar perfis e acompanhar postagens. A interface de mensagens e o fluxo de contratos ainda estão em construção.</p></details><details><summary>Quais benefícios estão em construção?</summary><p>Para influenciadores, estamos preparando maior visibilidade nas buscas e nos filtros por área. Para empresas, estão previstos análises de influenciadores e acesso aos comentários de outras empresas que já fecharam acordos com eles. Esses benefícios ainda não estão disponíveis.</p></details><details><summary>Como funciona a ativação?</summary><p>O botão Ativar Premium abre o checkout de sandbox do Paddle para uma assinatura mensal de R$ 29,90. Use apenas cartões de teste. Nesta etapa, concluir o checkout ainda não libera o Premium: falta conectar a confirmação por webhook.</p></details><details><summary>Posso cancelar quando quiser?</summary><p>Sim. Com a integração de pagamentos, o cancelamento interromperá as próximas renovações e manterá o Premium até o fim do período pago. Nesta etapa, o botão de cancelamento está indisponível. Para encerrar uma assinatura criada nos testes, use o painel de sandbox do Paddle.</p></details><details><summary>Como funciona a renovação automática?</summary><p>Com a integração de pagamentos, uma nova cobrança de R$ 29,90 será feita a cada mês para manter o Premium ativo, até você cancelar. No sandbox, o Paddle pode simular a renovação da assinatura criada no checkout; a plataforma só atualizará o acesso depois que a integração dos webhooks estiver pronta. Não há movimentação de dinheiro real.</p></details></section>
    </div>
    {confirm && <ConfirmPlan saving={saving} error={error} onClose={() => { setConfirm(null); setError(""); }} onConfirm={changePlan} />}
    {showDetails && <PlanDetails onClose={() => setShowDetails(false)} />}
  </main>;
}
