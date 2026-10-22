import { useState, useEffect } from "react";
import FormularioUsuario from "../../components/FormularioUsuario";

export default function PainelAdmin() {
    const [usuarios, setUsuarios] = useState([]);
    const [busca, setBusca] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    async function carregarUsuarios() {
        try {
            const resposta = await fetch("http://127.0.0.1:5000/usuarios");

            if (!resposta.ok) {
                throw new Error("Não foi possível carregar os usuários");
            }

            const dados = await resposta.json();
            setUsuarios(dados);
        } catch (erro) {
            console.error("Erro ao buscar usuários:", erro);
        }
    }

    useEffect(() => {
        carregarUsuarios();
    }, []);

    const usuariosFiltrados = usuarios.filter((usuario) => {
        const termo = busca.trim().toLowerCase();

        return (
            usuario.nome.toLowerCase().includes(termo) ||
            usuario.username.toLowerCase().includes(termo)
        );
    });

    function handleUsuarioCadastrado() {
        carregarUsuarios();
        setMostrarFormulario(false);
    }


    return (
        <main>
            <h3>Painel administrativo</h3>

            <button
                type="button"
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
                {mostrarFormulario ? "Cancelar" : "Adicionar usuário"}
            </button>

            {mostrarFormulario && <FormularioUsuario onUsuarioCadastrado={handleUsuarioCadastrado}/>}

            <label htmlFor="busca">Buscar usuário</label>
            <input
                id="busca"
                type="search"
                placeholder="Digite um nome ou username"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
            />

            <ul>
                {usuariosFiltrados.map((usuario) => (
                    <li key={usuario.username}>
                        {usuario.nome} - {usuario.username}
                    </li>
                ))}
            </ul>
            {busca.trim() !== "" && usuariosFiltrados.length === 0 && (
                <p>Nenhum usuário encontrado.</p>
            )}
        </main>
    );
}