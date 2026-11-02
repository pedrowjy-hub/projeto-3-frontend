import { useState, useEffect, useCallback } from "react";
import FormularioUsuario from "../../components/FormularioUsuario";
import { useNavigate } from "react-router";
import FormularioAssinatura from "../../components/FormularioAssinatura";
import DetalhesUsuario from "../../components/DetalhesUsuario";
import ConfirmarExclusao from "../../components/ConfirmarExclusao";
import GerenciamentoDenuncias from "../../components/GerenciamentoDenuncias";
import "./index.css";

export default function PainelAdmin() {
    const [usuarios, setUsuarios] = useState([]);
    const [statusConta, setStatusConta] = useState("ativos");
    const [busca, setBusca] = useState("");
    const [pagina, setPagina] = useState(1);
    const [formularioAtivo, setFormularioAtivo] = useState(null);
    const [salvandoCadastro, setSalvandoCadastro] = useState(false);
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

    const carregarUsuarios = useCallback(async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                navigate("/login", { replace: true });
                return;
            }
            const resposta = await fetch("/api/admin/usuarios", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resposta.status === 401 || resposta.status === 422) {
                localStorage.removeItem("access_token");
                navigate("/login", { replace: true });
                return;
            }
            if (resposta.status === 403 || resposta.status === 404) {
                setAcesso("negado");
                return;
            }
            if (!resposta.ok) {
                throw new Error("Não foi possível carregar os usuários.");
            }
            const dados = await resposta.json();
            const payloadBase64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(new TextDecoder().decode(
                Uint8Array.from(atob(payloadBase64), (caractere) => caractere.charCodeAt(0))
            ));
            setUsuarios(dados.filter((usuario) => usuario.username !== payload.sub));
        } catch {
            setErro("Não foi possível carregar os usuários. Confira se a API está rodando e tente novamente.");
        } finally {
            setCarregando(false);
        }
    }, [navigate]);

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
    }, [navigate, carregarUsuarios]);

    const termo = busca.trim().toLowerCase();
    const usuariosFiltrados = usuarios.filter((usuario) =>
        (statusConta === "todos" || (statusConta === "ativos" ? usuario.ativo !== false : usuario.ativo === false)) &&
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

    function handleUsuarioCadastrado(administrador) {
        atualizarUsuarios();
        setFormularioAtivo(null);
        setMensagem(administrador ? "Administrador cadastrado com sucesso!" : "Usuário cadastrado com sucesso!");
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

    async function handleExcluirUsuario(usuario, senha) {
        if (usuarioExcluindo !== null) return;
        setUsuarioExcluindo(usuario.username);
        setErro("");
        setMensagem("");
        setErroExclusao("");

        try {
            const token = localStorage.getItem("access_token");

            const resposta = await fetch(`/api/admin/usuarios/${encodeURIComponent(usuario.username)}/status`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ senha, ativo: usuario.ativo === false }),
            });

            if (resposta.status === 401 || resposta.status === 422) {
                localStorage.removeItem("access_token");
                navigate("/login", { replace: true });
                return;
            }

            if (!resposta.ok) {
                const dados = await resposta.json().catch(() => ({}));

                throw new Error(dados.erro || "Não foi possível alterar o status da conta.");
            }

            setMensagem(`Conta @${usuario.username} ${usuario.ativo === false ? "reativada" : "desativada"}.`);

            if (usuarioAssinatura?.username === usuario.username) {
                setUsuarioAssinatura(null);
            }

            setUsuarioParaExcluir(null);
            atualizarUsuarios();
        } catch (error) {
            setErroExclusao(error.message || "Não foi possível alterar o status da conta.");
        } finally {
            setUsuarioExcluindo(null);
        }

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
                    reativar={usuarioParaExcluir.ativo === false}
                    usuario={usuarioParaExcluir}
                    excluindo={usuarioExcluindo !== null}
                    erro={erroExclusao}
                    onCancelar={() => {
                        setUsuarioParaExcluir(null);
                        setErroExclusao("");
                    }}
                    onConfirmar={(senha) => handleExcluirUsuario(usuarioParaExcluir, senha)}
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
                    >Sair da conta</button>
                </div>
            </header>

            <main className="admin-conteudo">
                <div className="admin-introducao">
                    <div className="admin-titulo-linha">
                        <div>
                            <h1>Painel administrativo</h1>
                        </div>
                        <div className="admin-cadastro-acoes">
                            <button className="admin-botao admin-botao-primario" type="button"
                                disabled={salvandoCadastro}
                                aria-expanded={formularioAtivo === "usuario"} aria-controls="cadastro-usuario"
                                onClick={() => { setMensagem(""); setFormularioAtivo(formularioAtivo === "usuario" ? null : "usuario"); }}>
                                <span aria-hidden="true">{formularioAtivo === "usuario" ? "−" : "+"}</span>
                                {formularioAtivo === "usuario" ? "Fechar formulário" : "Adicionar usuário"}
                            </button>
                        </div>
                    </div>
                </div>

                {mensagem && <p className="admin-aviso" role="status">{mensagem}</p>}
                {formularioAtivo === "usuario" && <FormularioUsuario onUsuarioCadastrado={handleUsuarioCadastrado} onCancelar={() => setFormularioAtivo(null)} onSalvandoChange={setSalvandoCadastro} />}
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
                        <label className="admin-status-filtro">Status da conta<select value={statusConta} onChange={event => { setStatusConta(event.target.value); setPagina(1); }}><option value="ativos">Ativos</option><option value="desativados">Desativados</option><option value="todos">Todos</option></select></label>
                        <div className="admin-busca">
                            <label className="admin-sr-only" htmlFor="busca">Buscar usuário</label>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
                            <input id="busca" type="search" placeholder="Buscar nome, username ou e-mail..." value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1); }} />
                        </div>
                    </div>

                    {carregando ? <div className="admin-vazio" role="status">Carregando usuários...</div>
                    : erro ? <div className="admin-vazio"><p role="alert">{erro}</p><button className="admin-botao admin-botao-secundario" type="button" onClick={atualizarUsuarios}>Tentar novamente</button></div>
                    : usuariosFiltrados.length === 0 ? <div className="admin-vazio"><span aria-hidden="true">◎</span><h3>{termo ? "Nenhum usuário encontrado" : "Nenhum usuário neste filtro"}</h3><p>{termo ? "Tente outro nome, username ou e-mail." : "Selecione outro status ou adicione um usuário."}</p></div>
                    : <div className="admin-tabela-container">
                        <table className="admin-tabela">
                            <caption className="admin-sr-only">Usuários cadastrados</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Usuário</th>
                                    <th scope="col">E-mail</th>
                                    <th scope="col">Tipo</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Assinatura</th>
                                    <th scope="col">Ações</th>
                                </tr>
                            </thead>
                            <tbody>{usuariosDaPagina.map((usuario) => (
                                <tr key={usuario.username}>
                                    <td><div className="admin-usuario"><span className="admin-avatar" aria-hidden="true">{(usuario.nome || usuario.username || "?").trim().slice(0, 2).toUpperCase()}</span><div><button className="admin-usuario-link" type="button" onClick={() => setUsuarioDetalhes(usuario)}>{usuario.nome || "Sem nome"}</button><span>@{usuario.username}</span></div></div></td>
                                    <td>{usuario.email || "—"}</td>
                                    <td><span className="admin-tipo">{usuario.papel === "admin" ? "Administrador" : usuario.tipo_perfil || "Não informado"}</span></td>
                                    <td><span className="admin-tipo">{usuario.ativo === false ? "Desativado" : "Ativo"}</span></td>
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
                                                ? "Salvando..."
                                                : usuario.ativo === false ? "Reativar" : "Desativar"}
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
                <GerenciamentoDenuncias />
            </main>
        </div>
    );
}
