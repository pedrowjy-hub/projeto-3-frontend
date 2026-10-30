import { useState } from "react";
import { Link } from "react-router";
import "../Login/index.css";
import "./index.css";

const campos = [
    { name: "nome", label: "Nome completo", autoComplete: "name", placeholder: "Como você se chama?" },
    { name: "username", label: "Nome de usuário", autoComplete: "username", placeholder: "Ex.: ana.creator" },
    { name: "email", label: "E-mail", type: "email", autoComplete: "email", placeholder: "seuemail@exemplo.com" },
    { name: "contato", label: "Contato", type: "tel", autoComplete: "tel", placeholder: "(11) 99999-9999" },
    { name: "nicho", label: "Nicho", placeholder: "Ex.: tecnologia, moda, gastronomia" },
    { name: "plataformas", label: "Plataformas", placeholder: "Instagram, YouTube" },
];

export default function Cadastro() {
    const [formulario, setFormulario] = useState({ nome: "", username: "", email: "", contato: "", tipo_perfil: "", nicho: "", plataformas: "", senha: "" });
    const [confirmacao, setConfirmacao] = useState("");
    const [senhaVisivel, setSenhaVisivel] = useState(false);
    const [confirmacaoVisivel, setConfirmacaoVisivel] = useState(false);
    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (enviando) return;
        setErro("");
        if (formulario.senha !== confirmacao) {
            setErro("As senhas precisam ser iguais.");
            return;
        }
        const novoUsuario = Object.fromEntries(Object.entries(formulario).map(([chave, valor]) => [chave, chave === "senha" ? valor : valor.trim()]));
        novoUsuario.plataformas = formulario.plataformas.split(",").map((valor) => valor.trim()).filter(Boolean);
        if (campos.some(({ name }) => name !== "plataformas" && !novoUsuario[name]) || !novoUsuario.plataformas.length) {
            setErro("Preencha todos os campos e informe pelo menos uma plataforma.");
            return;
        }
        setEnviando(true);
        try {
            const resposta = await fetch("http://127.0.0.1:5000/usuarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novoUsuario),
            });
            const dados = await resposta.json().catch(() => ({}));
            if (!resposta.ok) {
                setErro(dados.erro || "Não foi possível criar sua conta. Tente novamente.");
                return;
            }
            setFormulario((anterior) => ({ ...anterior, senha: "" }));
            setConfirmacao("");
            setSucesso(true);
        } catch {
            setErro("Não foi possível conectar à API. Confira se o backend está rodando e tente novamente.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main className="login-page cadastro-page">
            <div className="login-orbit login-orbit-one" aria-hidden="true" />
            <div className="login-orbit login-orbit-two" aria-hidden="true" />
            <nav className="login-nav" aria-label="Navegação do cadastro">
                <Link className="login-brand" to="/" aria-label="Nexo, página inicial"><span>n</span>nexo</Link>
                <Link className="back-link" to="/login">← Voltar para o login</Link>
            </nav>
            <div className="cadastro-layout">
                <section className="login-intro cadastro-intro">
                    <p className="login-eyebrow"><span>✦</span> Seu próximo encontro começa aqui</p>
                    <h1>Boas ideias.<br />Novas<br /><em>conexões.</em></h1>
                    <p>Crie seu perfil e aproxime sua marca de quem tem tudo a ver com ela.</p>
                    <div className="login-note"><span aria-hidden="true">✦</span><p>Um espaço para creators e empresas transformarem afinidade em boas parcerias.</p></div>
                </section>
                <section className="login-card cadastro-card" aria-labelledby="cadastro-title">
                    <p className="card-kicker">FAÇA PARTE DA NEXO</p>
                    <h2 id="cadastro-title">{sucesso ? "Sua conta está pronta!" : "Crie sua conta"}</h2>
                    {sucesso ? (
                        <div className="cadastro-sucesso" role="status">
                            <span aria-hidden="true">✓</span>
                            <p>Cadastro realizado com sucesso. Entre com seu usuário ou e-mail e sua senha para começar.</p>
                            <Link className="cadastro-entrar" to="/login">Entrar na minha conta →</Link>
                        </div>
                    ) : (
                        <>
                            <p className="card-description">Conte um pouco sobre você. Todos os campos são obrigatórios.</p>
                            <form onSubmit={handleSubmit} aria-busy={enviando}>
                                <fieldset disabled={enviando} className="cadastro-campos">
                                    {campos.map(({ name, label, ...atributos }) => (
                                        <div className="cadastro-campo" key={name}>
                                            <label htmlFor={`cadastro-${name}`}>{label}</label>
                                            <input {...atributos} id={`cadastro-${name}`} name={name} type={atributos.type || "text"} value={formulario[name]} onChange={handleChange} required aria-describedby={name === "plataformas" ? "cadastro-plataformas-ajuda" : undefined} />
                                            {name === "plataformas" && <small id="cadastro-plataformas-ajuda">Separe as plataformas por vírgula.</small>}
                                        </div>
                                    ))}
                                    <div className="cadastro-campo cadastro-campo-inteiro">
                                        <label htmlFor="cadastro-tipo-perfil">Tipo de perfil</label>
                                        <select id="cadastro-tipo-perfil" name="tipo_perfil" value={formulario.tipo_perfil} onChange={handleChange} required>
                                            <option value="">Selecione</option>
                                            <option value="influenciador">Influenciador</option>
                                            <option value="empresa">Empresa</option>
                                        </select>
                                    </div>
                                    <div className="cadastro-campo">
                                        <label htmlFor="cadastro-senha">Senha</label>
                                        <div className="password-input">
                                            <input id="cadastro-senha" name="senha" type={senhaVisivel ? "text" : "password"} autoComplete="new-password" value={formulario.senha} onChange={handleChange} required />
                                            <button className="password-toggle" type="button" onClick={() => setSenhaVisivel(!senhaVisivel)} aria-pressed={senhaVisivel} aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}>{senhaVisivel ? "Ocultar" : "Mostrar"}</button>
                                        </div>
                                    </div>
                                    <div className="cadastro-campo">
                                        <label htmlFor="cadastro-confirmacao">Confirme sua senha</label>
                                        <div className="password-input">
                                            <input id="cadastro-confirmacao" type={confirmacaoVisivel ? "text" : "password"} autoComplete="new-password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} required />
                                            <button className="password-toggle" type="button" onClick={() => setConfirmacaoVisivel((visivel) => !visivel)} aria-pressed={confirmacaoVisivel} aria-label={confirmacaoVisivel ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}>{confirmacaoVisivel ? "Ocultar" : "Mostrar"}</button>
                                        </div>
                                    </div>
                                </fieldset>
                                {erro && <p className="login-error" role="alert">{erro}</p>}
                                <button type="submit" disabled={enviando}>{enviando ? "Criando sua conta..." : "Criar minha conta"}<span aria-hidden="true">→</span></button>
                            </form>
                            <p className="signup-prompt">Já faz parte? <Link to="/login">Entre na sua conta</Link></p>
                        </>
                    )}
                </section>
            </div>
            <p className="login-footer cadastro-footer">nexo · Feito para boas conexões.</p>
        </main>
    );
}
