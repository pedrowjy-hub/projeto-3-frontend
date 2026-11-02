import { useState } from "react";
import { Link } from "react-router";
import { alterarSenha } from "../../services/senha";

export default function AlterarSenha() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    if (novaSenha !== confirmacao) {
      setErro("As senhas novas não coincidem.");
      return;
    }
    const token = localStorage.getItem("access_token");
    setSalvando(true);
    try {
      await alterarSenha(token, senhaAtual, novaSenha);
      localStorage.removeItem("access_token");
      setSucesso(true);
    } catch (error) {
      if (error.status === 401 && error.message !== "Senha atual incorreta") {
        localStorage.removeItem("access_token");
        setErro("Sua sessão expirou. Entre novamente para alterar a senha.");
      } else {
        setErro(error.message || "Não foi possível alterar a senha.");
      }
    } finally {
      setSalvando(false);
    }
  }

  return <section className="settings-card settings-security-card" aria-labelledby="security-title">
    <div className="settings-card-heading"><span className="settings-icon" aria-hidden="true">⌑</span><div><h2 id="security-title">Segurança da conta</h2><p>Altere sua senha sempre que precisar.</p></div></div>
    {sucesso ? <div className="password-feedback password-feedback-success" role="status">
      <strong>Senha alterada</strong>
      <p>Por segurança, sua sessão foi encerrada. Entre novamente com a nova senha.</p>
      <Link to="/login">Ir para o login</Link>
    </div> : <form className="settings-password-form" onSubmit={handleSubmit}>
      <label htmlFor="current-password">Senha atual</label>
      <input id="current-password" type="password" autoComplete="current-password" value={senhaAtual} onChange={event => setSenhaAtual(event.target.value)} required disabled={salvando} />
      <div className="settings-password-grid">
        <div><label htmlFor="settings-new-password">Nova senha</label><input id="settings-new-password" type="password" autoComplete="new-password" value={novaSenha} onChange={event => setNovaSenha(event.target.value)} required disabled={salvando} /></div>
        <div><label htmlFor="settings-confirm-password">Confirmar nova senha</label><input id="settings-confirm-password" type="password" autoComplete="new-password" value={confirmacao} onChange={event => setConfirmacao(event.target.value)} required disabled={salvando} /></div>
      </div>
      {erro && <p className="settings-password-error" role="alert">{erro}</p>}
      <div className="settings-password-actions"><p>Você precisará entrar novamente após a alteração.</p><button type="submit" className="settings-button settings-password-submit" disabled={salvando}>{salvando ? "Salvando…" : "Alterar senha"}</button></div>
    </form>}
  </section>;
}
