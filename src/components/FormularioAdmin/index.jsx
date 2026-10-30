import { useState } from "react";
import { useNavigate } from "react-router";
import "../FormularioUsuario/index.css";

export default function FormularioAdmin({ onAdminCadastrado, onCancelar, onSalvandoChange }) {
    const [formulario, setFormulario] = useState({
        nome: "",
        username: "",
        email: "",
        senha: "",
        confirmarSenha: "",
    });
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);
    const navigate = useNavigate();

    function handleChange(event) {
        const { name, value } = event.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
        setErro("");
    }

    async function handleCadastrar(event) {
        event.preventDefault();
        if (salvando) return;
        setErro("");

        const novoAdmin = {
            nome: formulario.nome.trim(),
            username: formulario.username.trim(),
            email: formulario.email.trim(),
            senha: formulario.senha,
        };

        if (Object.values(novoAdmin).some((valor) => !valor.trim())) {
            setErro("Preencha todos os campos obrigatórios.");
            return;
        }

        if (formulario.senha !== formulario.confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setSalvando(true);
        onSalvandoChange(true);

        try {
            const resposta = await fetch("http://127.0.0.1:5000/admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(novoAdmin),
            });

            if (resposta.status === 401 || resposta.status === 422) {
                localStorage.removeItem("access_token");
                navigate("/login", { replace: true });
                return;
            }

            if (resposta.status === 403 || resposta.status === 404) {
                setErro("Sua conta não tem permissão para cadastrar administradores.");
                return;
            }

            if (!resposta.ok) {
                const dados = await resposta.json().catch(() => ({}));
                setErro(dados.erro || "Não foi possível cadastrar o administrador. Tente novamente.");
                return;
            }

            onAdminCadastrado();
        } catch {
            setErro("Não foi possível comunicar com a API. Confira a conexão e tente novamente.");
        } finally {
            setSalvando(false);
            onSalvandoChange(false);
        }
    }

    return (
        <form className="usuario-form" id="cadastro-admin" onSubmit={handleCadastrar} aria-labelledby="titulo-cadastro-admin" aria-busy={salvando}>
            <div className="usuario-form-cabecalho">
                <div>
                    <h2 id="titulo-cadastro-admin">Adicionar administrador</h2>
                    <p>Crie uma conta com acesso ao painel administrativo.</p>
                </div>
                <span className="usuario-form-selo" aria-hidden="true">＋</span>
            </div>

            <div className="usuario-form-campos">
                <div className="usuario-form-campo">
                    <label htmlFor="admin-nome">Nome completo</label>
                    <input id="admin-nome" name="nome" type="text" autoComplete="name"
                        placeholder="Nome completo" value={formulario.nome} onChange={handleChange} disabled={salvando} required />
                </div>
                <div className="usuario-form-campo">
                    <label htmlFor="admin-username">Username</label>
                    <input id="admin-username" name="username" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false}
                        placeholder="Ex.: ana.admin" value={formulario.username} onChange={handleChange} disabled={salvando} required />
                </div>
                <div className="usuario-form-campo">
                    <label htmlFor="admin-email">E-mail</label>
                    <input id="admin-email" name="email" type="email" autoComplete="email"
                        placeholder="nome@exemplo.com" value={formulario.email} onChange={handleChange} disabled={salvando} required />
                </div>
                <div className="usuario-form-campo">
                    <label htmlFor="admin-senha">Senha inicial</label>
                    <input id="admin-senha" name="senha" type="password" autoComplete="new-password"
                        placeholder="Defina uma senha" value={formulario.senha} onChange={handleChange} disabled={salvando} required />
                </div>
                <div className="usuario-form-campo">
                    <label htmlFor="admin-confirmar-senha">Confirmar senha</label>
                    <input id="admin-confirmar-senha" name="confirmarSenha" type="password" autoComplete="new-password"
                        placeholder="Repita a senha" value={formulario.confirmarSenha} onChange={handleChange} disabled={salvando} required />
                </div>
            </div>

            {erro && <p className="admin-aviso admin-aviso-erro" role="alert">{erro}</p>}
            <div className="usuario-form-rodape">
                <p>Esta conta poderá gerenciar usuários e criar outros administradores.</p>
                <div className="usuario-form-acoes">
                    <button className="admin-botao admin-botao-secundario" type="button" onClick={onCancelar} disabled={salvando}>Cancelar</button>
                    <button className="admin-botao admin-botao-primario" type="submit" disabled={salvando}>
                        {salvando ? "Cadastrando..." : "Cadastrar administrador"}
                    </button>
                </div>
            </div>
        </form>
    );
}
