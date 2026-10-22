import { use, useState } from "react";

export default function FormularioUsuario({ onUsuarioCadastrado }) {
    const [formulario, setFormulario] = useState({
        nome: "",
        username: "",
        email: "",
        contato: "",
        tipo: "",
        nicho: "",
        plataformas: "",
        senha: "",
    });
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [salvando, setSalvando] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    }

    async function handleCadastrar(event) {
        event.preventDefault();

        setErro("");
        setSucesso("");
        setSalvando(true);

        const novoUsuario = {
            ...formulario,
            plataformas: formulario.plataformas
                .split(",")
                .map((plataforma) => plataforma.trim())
                .filter((plataforma) => plataforma !== ""),
            assinatura: false,
        };

        try {
            const resposta = await fetch("http://127.0.0.1:5000/usuarios", {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(novoUsuario),
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro || "Não foi possível cadastrar o usuário.");
                return;
            }

            setSucesso("Usuário cadastrado com sucesso!");
            onUsuarioCadastrado();
        } catch {
            setErro("Não foi possível comunicar com a API.")
        } finally {
            setSalvando(false);
        }

        console.log("Campos preenchidos:", {
            nome: formulario.nome,
            username: formulario.username,
            email: formulario.email,
        });
    }

    return (
        <form onSubmit={handleCadastrar}>
            <h2>Adicionar usuário</h2>

            <label htmlFor="nome">Nome</label>
            <input
                id="nome"
                name="nome"
                type="text"
                value={formulario.nome}
                onChange={handleChange}
                required
            />

            <label htmlFor="username">Username</label>
            <input
                id="username"
                name="username"
                type="text"
                value={formulario.username}
                onChange={handleChange}
                required
            />

            <label htmlFor="email">Email</label>
            <input
                id="email"
                name="email"
                type="email"
                value={formulario.email}
                onChange={handleChange}
                required
            />

            <label htmlFor="contato">Contato</label>
            <input
                id="contato"
                name="contato"
                type="tel"
                value={formulario.contato}
                onChange={handleChange}
                required
            />

            <label htmlFor="tipo">Tipo</label>
            <input
                id="tipo"
                name="tipo"
                type="text"
                value={formulario.tipo}
                onChange={handleChange}
                required
            />

            <label htmlFor="nicho">Nicho</label>
            <input
                id="nicho"
                name="nicho"
                type="text"
                value={formulario.nicho}
                onChange={handleChange}
                required
            />

            <label htmlFor="plataforma">Plataformas separadas por vírgulas</label>
            <input
                id="plataforma"
                name="plataforma"
                type="text"
                value={formulario.plataforma}
                onChange={handleChange}
                required
            />

            <label htmlFor="senha">Senha</label>
            <input
                id="senha"
                name="senha"
                type="password"
                value={formulario.senha}
                onChange={handleChange}
                required
            />

            {erro && <p role="alert">{erro}</p>}
            {sucesso && <p role="status">{sucesso}</p>}
            <button type="submit" disabled={salvando}>
                {salvando ? "Cadastrando..." : "Casdastrar"}
            </button>
        </form>
    );
}