import { useState } from "react";
import { Link, useNavigate } from "react-router";
import "./index.css"


export default function Login() {
    const [identificador, setIdentificador] = useState("");
    const [senha,setSenha] = useState("");
    const [erro,setErro] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [senhaVisivel, setSenhaVisivel] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        setErro("");

        setEnviando(true);

        try {
            const resposta = await fetch("http://127.0.0.1:5000/login",{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    identificador,
                    senha,
                }),
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro || "Não foi possível entrar. Tente novamente.");
                return;
            }

            localStorage.setItem("access_token", dados.access_token);

            const verificacaoAdmin = await fetch("http://127.0.0.1:5000/admin", {
                headers: {
                    Authorization: `Bearer ${dados.access_token}`,
                },
            });

            if (verificacaoAdmin.ok) {
                navigate("/admin", { replace: true });
                return;
            }

            if (verificacaoAdmin.status === 403 || verificacaoAdmin.status === 404) {
                navigate("/inicio", { replace: true });
                return;
            }

            localStorage.removeItem("access_token");
            setErro("Não foi possível verificar seu acesso. Tente novamente.");
        } catch {
            setErro("Não foi possível conectar à API. Confira se ela está rodando.");
        } finally {
            setEnviando(false);
        }
    }

    return(
        <main className="login-page">
            <div className="login-orbit login-orbit-one" />
            <div className="login-orbit login-orbit-two" />

            <nav className="login-nav" aria-label="Navegação do login">
                <a className="login-brand" href="/" aria-label="Voltar para a página inicial">
                    <span>n</span>nexo
                </a>
                <a className="back-link" href="/">← Voltar ao início</a>
            </nav>

            <section className="login-layout">
                <div className="login-intro">
                    <p className="login-eyebrow"><span>✦</span> Boas parcerias começam aqui</p>
                    <h1>Entre e<br />faça <em>acontecer.</em></h1>
                    <p>Encontre oportunidades, conecte-se às pessoas certas e transforme ideias em resultado.</p>
                    <div className="login-note">
                        <span>✦</span>
                        <p>Uma comunidade para creators e marcas que querem criar conexões de verdade.</p>
                    </div>
                </div>

                <section className="login-card" aria-labelledby="login-title">
                    <p className="card-kicker">BEM-VINDO DE VOLTA</p>
                    <h2 id="login-title">Entrar na sua conta</h2>
                    <p className="card-description">Use seus dados para continuar sua jornada.</p>

                    <form onSubmit={handleSubmit}>
                        <label htmlFor="identificador">Usuário ou e-mail</label>
                        <input
                            id="identificador"
                            name="identificador"
                            type="text"
                            placeholder="seuemail@exemplo.com"
                            value={identificador}
                            onChange={(event) => setIdentificador(event.target.value)}
                            required
                        />

                        <div className="password-label"><label htmlFor="senha">Senha</label><a href="#recuperar">Esqueci minha senha</a></div>
                        <div className="password-input">
                            <input
                                id="senha"
                                name="senha"
                                type={senhaVisivel ? "text" : "password"}
                                placeholder="••••••••"
                                value={senha}
                                onChange={(event) => setSenha(event.target.value)}
                                required
                            />
                            <button
                                className="password-toggle"
                                type="button"
                                onClick={() => setSenhaVisivel(!senhaVisivel)}
                                aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                                aria-pressed={senhaVisivel}
                            >
                                {senhaVisivel ? "Ocultar" : "Mostrar"}
                            </button>
                        </div>

                        {erro && <p className="login-error" role="alert">{erro}</p>}

                        <button type="submit" disabled={enviando}>
                            {enviando ? "Entrando..." : "Entrar"} <span>→</span>
                        </button>
                    </form>

                    <p className="signup-prompt">Ainda não faz parte? <Link to="/cadastro">Crie sua conta</Link></p>
                </section>
            </section>

            <p className="login-footer">© 2025 nexo &nbsp;·&nbsp; Feito para boas conexões.</p>
        </main>
    );
}
