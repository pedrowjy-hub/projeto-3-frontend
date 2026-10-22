import { useState } from "react";
import "./index.css"


export default function Login() {
    const [identificador, setIdentificador] = useState("");
    const [senha,setSenha] = useState("");
    const [erro,setErro] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setErro("");

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
            setErro(dados.erro);
            return;
        }

        localStorage.setItem("access_token", dados.access_token);
        console.log("Login realizado!");
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
                        <input
                            id="senha"
                            name="senha"
                            type="password"
                            placeholder="••••••••"
                            value={senha}
                            onChange={(event) => setSenha(event.target.value)}
                            required
                        />

                        {erro && <p className="login-error" role="alert">{erro}</p>}

                        <button type="submit">Entrar <span>→</span></button>
                    </form>

                    <p className="signup-prompt">Ainda não faz parte? <a href="#cadastro">Crie sua conta</a></p>
                </section>
            </section>

            <p className="login-footer">© 2025 nexo &nbsp;·&nbsp; Feito para boas conexões.</p>
        </main>
    );
}
