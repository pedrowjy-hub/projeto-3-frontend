import { useState } from "react";
import { Link } from "react-router";
import { solicitarRecuperacao } from "../../services/senha";
import "../Login/index.css";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await solicitarRecuperacao(email.trim());
      setEnviado(true);
    } catch (error) {
      setErro(error.message || "Não foi possível solicitar a recuperação agora.");
    } finally {
      setEnviando(false);
    }
  }

  return <main className="login-page">
    <header className="login-header"><Link className="login-brand" to="/"><span>n</span> nexo</Link><Link to="/login">← Voltar ao login</Link></header>
    <div className="login-layout">
      <section className="login-intro">
        <p className="login-badge">✦ &nbsp; Acesso seguro</p>
        <h1>Vamos<br />encontrar<br /><em>seu acesso.</em></h1>
        <p className="login-description">Informe o e-mail da sua conta para receber um link de redefinição de senha.</p>
        <div className="login-community"><span>✦</span><p>O link é individual, válido por 30 minutos e pode ser usado uma única vez.</p></div>
      </section>
      <section className="login-card" aria-labelledby="recovery-title">
        <p className="login-eyebrow">RECUPERAÇÃO DE CONTA</p>
        <h2 id="recovery-title">Esqueceu sua senha?</h2>
        <p className="login-card-description">Enviaremos instruções para o e-mail associado à conta.</p>
        {enviado ? <div className="password-feedback password-feedback-success" role="status">
          <strong>Confira seu e-mail</strong>
          <p>Se houver uma conta ativa com esse endereço, enviaremos o link de redefinição. Confira também a caixa de spam.</p>
          <Link to="/login">Voltar ao login</Link>
        </div> : <form onSubmit={handleSubmit}>
          <label htmlFor="recovery-email">E-mail da conta</label>
          <input id="recovery-email" name="email" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" value={email} onChange={event => setEmail(event.target.value)} required disabled={enviando} />
          {erro && <p role="alert">{erro}</p>}
          <button className="login-submit" type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviar link de recuperação"}<span aria-hidden="true">⟶</span></button>
        </form>}
        {!enviado && <p className="login-signup"><Link to="/login">Voltar ao login</Link></p>}
      </section>
    </div>
    <footer className="login-footer">© 2025 nexo · Feito para boas conexões.</footer>
  </main>;
}
