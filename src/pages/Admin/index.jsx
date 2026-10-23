import { useState, useEffect } from "react";
import FormularioUsuario from "../../components/FormularioUsuario";
import { useNavigate } from "react-router";
import FormularioAssinatura from "../../components/FormularioAssinatura";
import DetalhesUsuario from "../../components/DetalhesUsuario";
import ConfirmarExclusao from "../../components/ConfirmarExclusao";
import "./index.css";

export default function PainelAdmin() {
    const [usuarios, setUsuarios] = useState([]);
    const [busca, setBusca] = useState("");
    const [pagina, setPagina] = useState(1);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const navigate = useNavigate();
    const [acesso, setAcesso] = useState("verificando");
    const [usuarioAssinatura, setUsuarioAssinatura] = useState(null);
    const [usuarioExcluindo, setUsuarioExcluindo] = useState(null);
    const [usuarioDetalhes, setUsuarioDetalhes] = useState(null);
    const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);
    const [erroExclusao, setErroExclusao] = useState(null);

    async function carregarUsuarios() {
        try {
            const resposta = await fetch("/api/admin/usuarios", { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } });
            if (!resposta.ok) {
                throw new Error("Não foi possível carregar os usuários.");
            }
            const dados = await resposta.json();
            setUsuarios(dados);
        } catch {
            setErro("Não foi possível carregar os usuários. Confira se a API está rodando e tente novamente.");
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        async function verificarAcesso() {
            const token = localStorage.getItem("access_token");

            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            try {
                const resposta = await fetch("/api/admin", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (resposta.status === 401 || resposta.status == 422) {
                    localStorage.removeItem("access_token");
                    navigate("/login", { replace: true });
                    return;
                }

                if (resposta.status === 403 || resposta.status === 404) {
                    setAcesso("negado");
                    return;
                }

                if (!resposta.ok) {
                    throw new Error("Não foi possível verificar o acesso.");
                }

                setAcesso("permitido");
                carregarUsuarios();
            } catch {
                setAcesso("erro");
            }
        }

        verificarAcesso()
    }, [navigate]);

    const termo = busca.trim().toLowerCase();
    const usuariosFiltrados = usuarios.filter((usuario) =>
        [usuario.nome, usuario.username, usuario.email].some((valor) =>
            String(valor || "").toLowerCase().includes(termo)
        )
    );

    const usuariosPorPagina = 5;
    const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / usuariosPorPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * usuariosPorPagina;
    const usuariosDaPagina = usuariosFiltrados.slice(inicio, inicio + usuariosPorPagina);

    function atualizarUsuarios() {
        setCarregando(true);
        setErro("");
        carregarUsuarios();
    }

    function handleUsuarioCadastrado() {
        atualizarUsuarios();
        setMostrarFormulario(false);
        setMensagem("Usuário cadastrado com sucesso!");
    }

    function handleSair() {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
    }

    if (acesso === "verificando") {
        return (
            <main className="admin-pagina admin-vazio">
                <p role="status">Verificando acesso...</p>
            </main>
        );
    }

    async function handleExcluirUsuario(usuario) {
        setUsuarioExcluindo(usuario.username);
        setErro("");
        setMensagem("");
        setErroExclusao("");

        try {
            const token = localStorage.getItem("access_token");

            const resposta = await fetch(`/api/usuarios/${encodeURIComponent(usuario.username)}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (resposta.status === 401 || resposta.status === 422) {
                localStorage.removeItem("access_token");
                navigate("/login", { replace: true });
                return;
            }

            if (!resposta.ok) {
                const dados = await resposta.json();

                throw new Error(dados.erro || "Não foi possível excluir o usuário.");
            }

            setMensagem(`Usuário @${usuario.username} excluído.`);

            if (usuarioAssinatura?.username === usuario.username) {
                setUsuarioAssinatura(null);
            }

            setUsuarioParaExcluir(null);
            atualizarUsuarios();
        } catch (error) {
            setErroExclusao(error.message || "Não foi possível excluir o usuário.");
        } finally {
            setUsuarioExcluindo(null);
        }

        console.log("Exclusão confirmada para:", usuario.username);
    }

    if (acesso === "negado") {
        return (
            <main className="admin-pagina admin-vazio">
                <h1>Acesso negado</h1>
                <p>Este painel é exclusivo para administradores.</p>

                <button
                    className="admin-botao admin-botao-primario"
                    type="button"
                    onClick={() => navigate("/login")}
                >
                    Ir para o login
                </button>
            </main>
        );
    }

    if (acesso === "erro") {
        return (
            <main className="admin-pagina admin-vazio">
                <p role="alert">
                    Não foi possível verificar o acesso. Confira se a API está rodando.
                </p>

                <button
                    className="admin-botao admin-botao-primario"
                    type="button"
                    onClick={() => window.location.reload()}
                >
                    Tentar novamente
                </button>
            </main>
        );
    }

    return (
        <div className="admin-pagina">
            {usuarioDetalhes && (
                <DetalhesUsuario
                    key={usuarioDetalhes.username}
                    usuario={usuarioDetalhes}
                    onFechar={() => setUsuarioDetalhes(null)}
                />
            )}
            {usuarioParaExcluir && (
                <ConfirmarExclusao
                    usuario={usuarioParaExcluir}
                    excluindo={usuarioExcluindo !== null}
                    erro={erroExclusao}
                    onCancelar={() => {
                        setUsuarioParaExcluir(null);
                        setErroExclusao("");
                    }}
                    onConfirmar={() => handleExcluirUsuario(usuarioParaExcluir)}
                />
            )}
            <header className="admin-topo">
                <div className="admin-topo-conteudo">
                    <a className="admin-marca" href="/admin" aria-label="Nexo — painel administrativo">
                        <span className="admin-marca-simbolo" aria-hidden="true">✳</span> nexo<span className="admin-marca-ponto">.</span>
                    </a>
                    <span className="admin-area">Administração</span>
                    <span className="admin-perfil"><span aria-hidden="true">A</span> Painel de gestão</span>
                    <button
                        className="admin-botao admin-botao-secundario"
                        type="button"
                        onClick={handleSair}
                    >Sair</button>
                </div>
            </header>

            <main className="admin-conteudo">
                <div className="admin-introducao">
                    <div className="admin-titulo-linha">
                        <div>
                            <h1>Painel administrativo</h1>
                        </div>
                        <button className="admin-botao admin-botao-primario" type="button"
                            aria-expanded={mostrarFormulario} aria-controls="cadastro-usuario"
                            onClick={() => setMostrarFormulario(!mostrarFormulario)}>
                            <span aria-hidden="true">{mostrarFormulario ? "−" : "+"}</span>
                            {mostrarFormulario ? "Fechar formulário" : "Adicionar usuário"}
                        </button>
                    </div>
                </div>

                {mensagem && <p className="admin-aviso" role="status">{mensagem}</p>}
                {mostrarFormulario && <FormularioUsuario onUsuarioCadastrado={handleUsuarioCadastrado} onCancelar={() => setMostrarFormulario(false)} />}
                {usuarioAssinatura && (
                        <FormularioAssinatura
                            key={usuarioAssinatura.username}
                            usuario={usuarioAssinatura}
                            onCancelar={() => setUsuarioAssinatura(null)}
                        />
                    )}

                <section className="admin-usuarios" aria-labelledby="titulo-usuarios">
                    <div className="admin-lista-cabecalho">
                        <div>
                            <div className="admin-lista-titulo"><h2 id="titulo-usuarios">Usuários</h2><span className="admin-contagem">{carregando ? "…" : erro ? "—" : usuarios.length}</span></div>
                        </div>
                        <div className="admin-busca">
                            <label className="admin-sr-only" htmlFor="busca">Buscar usuário</label>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
                            <input id="busca" type="search" placeholder="Buscar nome, username ou e-mail..." value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1); }} />
                        </div>
                    </div>

                    {carregando ? <div className="admin-vazio" role="status">Carregando usuários...</div>
                    : erro ? <div className="admin-vazio"><p role="alert">{erro}</p><button className="admin-botao admin-botao-secundario" type="button" onClick={atualizarUsuarios}>Tentar novamente</button></div>
                    : usuariosFiltrados.length === 0 ? <div className="admin-vazio"><span aria-hidden="true">◎</span><h3>{termo ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}</h3><p>{termo ? "Tente outro nome, username ou e-mail." : "Clique em “Adicionar usuário” para cadastrar."}</p></div>
                    : <div className="admin-tabela-container">
                        <table className="admin-tabela">
                            <caption className="admin-sr-only">Usuários cadastrados</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Usuário</th>
                                    <th scope="col">E-mail</th>
                                    <th scope="col">Tipo</th>
                                    <th scope="col">Assinatura</th>
                                    <th scope="col">Ações</th>
                                </tr>
                            </thead>
                            <tbody>{usuariosDaPagina.map((usuario) => (
                                <tr key={usuario.username}>
                                    <td><div className="admin-usuario"><span className="admin-avatar" aria-hidden="true">{(usuario.nome || usuario.username || "?").trim().slice(0, 2).toUpperCase()}</span><div><button className="admin-usuario-link" type="button" onClick={() => setUsuarioDetalhes(usuario)}>{usuario.nome || "Sem nome"}</button><span>@{usuario.username}</span></div></div></td>
                                    <td>{usuario.email || "—"}</td>
                                    <td><span className="admin-tipo">{usuario.tipo_perfil || "Não informado"}</span></td>
                                    <td>
                                        <div className="admin-assinatura-acoes">
                                            <span className={`admin-assinatura ${usuario.assinatura === true ? "admin-assinatura-ativa" : ""}`}><span aria-hidden="true">●</span>{usuario.assinatura === true ? "Ativa" : "Sem assinatura"}</span>
                                            <button
                                                className="admin-botao admin-botao-secundario"
                                                type="button"
                                                onClick={() => setUsuarioAssinatura(usuario)}
                                            >Alterar</button>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className="admin-botao admin-botao-secundario"
                                            type="button"
                                            disabled={usuarioExcluindo !== null}
                                            onClick={() => setUsuarioParaExcluir(usuario)}
                                        >
                                            {usuarioExcluindo === usuario.username
                                                ? "Excluindo..."
                                                : "Excluir"}
                                        </button>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>}
                    <div className="admin-lista-rodape">
                        <p role="status">{carregando ? "Consultando usuários" : erro ? "Lista indisponível" : usuariosFiltrados.length === 0 ? "0 usuários" : `${inicio + 1}–${inicio + usuariosDaPagina.length} de ${usuariosFiltrados.length} usuários`}</p>
                        {!carregando && !erro && usuariosFiltrados.length > 0 && (
                            <nav className="admin-paginacao" aria-label="Paginação de usuários">
                                <button type="button" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</button>
                                <span aria-live="polite">Página {paginaAtual} de {totalPaginas}</span>
                                <button type="button" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</button>
                            </nav>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
