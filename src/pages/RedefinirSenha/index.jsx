import { useState } from "react";
import { Link } from "react-router";
import { redefinirSenha } from "../../services/senha";
import "../Login/index.css";

export default function RedefinirSenha() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    if (novaSenha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }
    setEnviando(true);
    try {
      await redefinirSenha(token, novaSenha);
      localStorage.removeItem("access_token");
      setSucesso(true);
    } catch (error) {
      setErro(error.message || "Não foi possível redefinir a senha.");
    } finally {
      setEnviando(false);
    }
  }

  return <main className="login-page">
    <header className="login-header"><Link className="login-brand" to="/"><span>n</span> nexo</Link><Link to="/login">← Voltar ao login</Link></header>
    <div className="login-layout">
      <section className="login-intro">
        <p className="login-badge">✦ &nbsp; Proteção da sua conta</p>
        <h1>Uma nova<br />senha para<br /><em>recomeçar.</em></h1>
        <p className="login-description">Escolha uma senha nova para voltar às suas conexões e oportunidades.</p>
        <div className="login-community"><span>✦</span><p>Por segurança, o link de redefinição só pode ser utilizado uma vez.</p></div>
      </section>
      <section className="login-card" aria-labelledby="reset-title">
        <p className="login-eyebrow">NOVA SENHA</p>
        <h2 id="reset-title">Redefinir senha</h2>
        <p className="login-card-description">Digite e confirme a nova senha da sua conta.</p>
        {sucesso ? <div className="password-feedback password-feedback-success" role="status">
          <strong>Senha redefinida</strong>
          <p>Agora entre na sua conta com a nova senha.</p>
          <Link to="/login">Ir para o login</Link>
        </div> : !token ? <div className="password-feedback" role="alert">
          <strong>Link incompleto</strong>
          <p>Abra o link recebido por e-mail ou solicite uma nova recuperação.</p>
          <Link to="/recuperar-senha">Solicitar outro link</Link>
        </div> : <form onSubmit={handleSubmit}>
          <label htmlFor="new-password">Nova senha</label>
          <input id="new-password" name="nova_senha" type="password" autoComplete="new-password" value={novaSenha} onChange={event => setNovaSenha(event.target.value)} required disabled={enviando} />
          <label htmlFor="confirm-password">Confirmar nova senha</label>
          <input id="confirm-password" name="confirmar_senha" type="password" autoComplete="new-password" value={confirmacao} onChange={event => setConfirmacao(event.target.value)} required disabled={enviando} />
          {erro && <p role="alert">{erro}</p>}
          <button className="login-submit" type="submit" disabled={enviando}>{enviando ? "Salvando…" : "Salvar nova senha"}<span aria-hidden="true">⟶</span></button>
        </form>}
      </section>
    </div>
    <footer className="login-footer">© 2025 nexo · Feito para boas conexões.</footer>
  </main>;
}
