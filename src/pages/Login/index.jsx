import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSession } from "../../services/session";
import "./index.css"


export default function Login() {
    const navigate = useNavigate();
    const [enviando, setEnviando] = useState(false);
    const [identificador, setIdentificador] = useState("");
    const [senha,setSenha] = useState("");
    const [erro,setErro] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setErro("");
        setEnviando(true);
        try {
        const resposta = await fetch("/api/login",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                identificador,
                senha,
            }),
        });
        
        const dados = await resposta.json().catch(() => null);
        if (!dados || typeof dados !== "object") {
            setErro(resposta.status >= 500
                ? "O backend está indisponível. Confira se ele iniciou corretamente na porta 5000."
                : "O servidor retornou uma resposta inválida. Tente novamente.");
            return;
        }

        if (!resposta.ok) {
            setErro(dados.erro || "Não foi possível entrar.");
            return;
        }

        if (!dados.access_token || typeof dados.access_token !== "string") {
            localStorage.removeItem("access_token");
            setErro("O servidor confirmou o login, mas não retornou o token necessário para acessar o painel administrativo. O backend precisa oferecer autenticação com access_token e a rota /admin.");
            return;
        }
        localStorage.setItem("access_token", dados.access_token);
        const session = await getSession(dados.access_token);
        navigate(session.papel === "admin" ? "/admin" : "/inicio");
        } catch (error) {
            setErro(error instanceof TypeError ? "Não foi possível conectar ao servidor. Confira se o backend está rodando em http://127.0.0.1:5000." : error.message);
        } finally {
            setEnviando(false);
        }
    }

    return(
        <main className="login-page">
            <header className="login-header"><a className="login-brand" href="/"><span>n</span> nexo</a><a href="/">← Voltar ao início</a></header>
            <div className="login-layout">
            <section className="login-intro">
                <p className="login-badge">✦ &nbsp; Boas parcerias começam aqui</p>
                <h1>Entre e<br />faça<br /><em>acontecer.</em></h1>
                <p className="login-description">Encontre oportunidades, conecte-se às pessoas<br /> certas e transforme ideias em resultado.</p>
                <div className="login-community"><span>✦</span><p>Uma comunidade para creators e marcas que querem criar conexões de verdade.</p></div>
            </section>
            <section className="login-card">
                <p className="login-eyebrow">BEM-VINDO DE VOLTA</p>
                <h2>Entrar na sua conta</h2>
                <p className="login-card-description">Use seus dados para continuar sua jornada.</p>

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

                    <div className="login-password-label"><label htmlFor="senha">Senha</label><a href="#recuperar-senha">Esqueci minha senha</a></div>
                    <div className="login-password">
                    <input 
                        id="senha"
                        name="senha"
                        type={mostrarSenha ? "text" : "password"}
                        placeholder="••••••••"
                        value={senha}
                        onChange={(event) => setSenha(event.target.value)}
                        required
                    />

                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>{mostrarSenha ? "Ocultar" : "Mostrar"}</button>
                    </div>
                    {erro && <p role="alert">{erro}</p>}

                    <button className="login-submit" type="submit" disabled={enviando}>{enviando ? "Entrando..." : "Entrar"} <span>⟶</span></button>
                </form>
                <p className="login-signup">Ainda não faz parte? <Link to="/cadastro">Crie sua conta</Link></p>
            </section>
            </div>
            <footer className="login-footer">© 2025 nexo · Feito para boas conexões.</footer>
        </main>
    );
}
