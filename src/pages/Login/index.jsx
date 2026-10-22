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
        <main className="login-pagina">
            <section>
                <h1>Entrar</h1>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="identificador">Usuário ou e-mail</label>
                    <input
                        id="identificador"
                        name="identificador"
                        type="text"
                        value={identificador}
                        onChange={(event) => setIdentificador(event.target.value)}
                        required 
                    />

                    <label htmlFor="senha">Senha</label>
                    <input 
                        id="senha"
                        name="senha"
                        type="password"
                        value={senha}
                        onChange={(event) => setSenha(event.target.value)}
                        required
                    />

                    {erro && <p>{erro}</p>}

                    <button type="submit">Entrar</button>
                </form>
            </section>
        </main>
    );
}