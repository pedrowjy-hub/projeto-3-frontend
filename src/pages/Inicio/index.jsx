import { useEffect } from "react";
import { useNavigate } from "react-router";
import "./index.css";

export default function Inicio() {
    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem("access_token")) {
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    function handleSair() {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
    }

    return (
        <main className="inicio-pagina">
            <section className="inicio-cartao" aria-labelledby="inicio-titulo">
                <span className="inicio-selo" aria-hidden="true">✦</span>
                <p className="inicio-legenda">ÁREA DO USUÁRIO</p>
                <h1 id="inicio-titulo">Login realizado<br /><em>com sucesso.</em></h1>
                <p>Esta será a página inicial dos usuários comuns. Você já pode desenvolver aqui os recursos da plataforma.</p>
                <button type="button" onClick={handleSair}>Sair</button>
            </section>
        </main>
    );
}
