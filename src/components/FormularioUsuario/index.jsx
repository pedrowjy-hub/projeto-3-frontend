import { useState } from "react";
import { useNavigate } from "react-router";

import "./index.css";

export default function FormularioUsuario({ onUsuarioCadastrado, onCancelar, onSalvandoChange = () => {} }) {
    const [administrador, setAdministrador] = useState(false);
    const navigate = useNavigate();
    const [formulario, setFormulario] = useState({
        nome: "",
        username: "",
        email: "",
        contato: "",
        tipo_perfil: "",
        nicho: "",
        plataformas: "",
        senha: "",
        confirmarSenha: "",
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
        if (salvando) return;

        setErro("");
        setSucesso("");
        if (administrador && [formulario.nome, formulario.username, formulario.email, formulario.senha].some((valor) => !valor.trim())) {
            setErro("Preencha todos os campos obrigatórios.");
            return;
        }
        if (administrador && formulario.senha !== formulario.confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        const token = localStorage.getItem("access_token");
        if (administrador && !token) {
            navigate("/login", { replace: true });
            return;
        }

        setSalvando(true);
        onSalvandoChange(true);

        const dadosConta = {
            nome: formulario.nome.trim(),
            username: formulario.username.trim(),
            email: formulario.email.trim(),
            senha: formulario.senha,
        };
        const novoUsuario = administrador ? dadosConta : {
            ...dadosConta,
            contato: formulario.contato,
            tipo_perfil: formulario.tipo_perfil,
            nicho: formulario.nicho,
            plataformas: formulario.plataformas
                .split(",")
                .map((plataforma) => plataforma.trim())
                .filter((plataforma) => plataforma !== ""),
            assinatura: false,
        };

        try {
            const resposta = await fetch(`/api/${administrador ? "admin" : "usuarios"}`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                    ...(administrador ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(novoUsuario),
            });

            if (administrador && (resposta.status === 401 || resposta.status === 422)) {
                localStorage.removeItem("access_token");
                navigate("/login", { replace: true });
                return;
            }

            if (administrador && (resposta.status === 403 || resposta.status === 404)) {
                setErro("Sua conta não tem permissão para cadastrar administradores.");
                return;
            }

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                setErro(dados.erro || `Não foi possível cadastrar o ${administrador ? "administrador" : "usuário"}.`);
                return;
            }

            setSucesso(administrador ? "Administrador cadastrado com sucesso!" : "Usuário cadastrado com sucesso!");
            onUsuarioCadastrado(administrador);
        } catch {
            setErro("Não foi possível comunicar com a API.")
        } finally {
            setSalvando(false);
            onSalvandoChange(false);
        }


    }

    return (
        <form className="usuario-form" id="cadastro-usuario" onSubmit={handleCadastrar} aria-busy={salvando}>
            <div className="usuario-form-cabecalho">
                <div>
                    <h2>Adicionar usuário</h2>
                </div>
                <span className="usuario-form-selo" aria-hidden="true">＋</span>
            </div>

            <div className="usuario-form-tipo-conta usuario-form-campo">
                <label htmlFor="tipo-conta">Tipo de conta</label>
                <select id="tipo-conta" name="tipo-conta" value={administrador ? "admin" : "usuario"}
                    aria-describedby="tipo-conta-ajuda" disabled={salvando}
                    onChange={(event) => { setAdministrador(event.target.value === "admin"); setErro(""); setSucesso(""); }}>
                    <option value="usuario">Usuário comum</option>
                    <option value="admin">Administrador</option>
                </select>
                <small id="tipo-conta-ajuda">{administrador ? "Administrador: acesso ao painel de gestão." : "Usuário comum: acesso à plataforma."}</small>
            </div>

            <fieldset className="usuario-form-campos" disabled={salvando}>
                <div className="usuario-form-campo">
                    <label htmlFor="nome">Nome completo</label>
                    <input id="nome" name="nome" type="text" autoComplete="name"
                        placeholder="Nome completo" value={formulario.nome} onChange={handleChange} required />
                </div>
                <div className="usuario-form-campo">
                    <label htmlFor="username">Username</label>
                    <input id="username" name="username" type="text" autoComplete="off"
                        placeholder="Ex.: ana.creator" value={formulario.username} onChange={handleChange} required />
                </div>
                <div className="usuario-form-campo">
                    <label htmlFor="email">E-mail</label>
                    <input id="email" name="email" type="email" autoComplete="email"
                        placeholder="nome@exemplo.com" value={formulario.email} onChange={handleChange} required />
                </div>
                {!administrador && <>
                <div className="usuario-form-campo">
                    <label htmlFor="contato">Contato</label>
                    <input id="contato" name="contato" type="tel" autoComplete="tel"
                        placeholder="(11) 99999-9999" value={formulario.contato} onChange={handleChange} required />
                </div>
                <div className="usuario-form-campo">
                    <label htmlFor="tipo_perfil">Tipo de perfil</label>
                    <select id="tipo_perfil" name="tipo_perfil"
                        value={formulario.tipo_perfil} onChange={handleChange} required>
                        <option value="" disabled>Selecione</option>
                        <option value="empresa">Empresa</option>
                        <option value="influenciador">Influenciador</option>
                    </select>
                </div>
                <div className="usuario-form-campo">
                    <label htmlFor="nicho">Nicho</label>
                    <input id="nicho" name="nicho" type="text" placeholder="Ex.: moda e lifestyle"
                        value={formulario.nicho} onChange={handleChange} required />
                </div>
                <div className="usuario-form-campo">
                    <label htmlFor="plataformas">Plataformas</label>
                    <input id="plataformas" name="plataformas" type="text" placeholder="Instagram, YouTube"
                        aria-describedby="plataformas-ajuda" value={formulario.plataformas} onChange={handleChange} required />
                    <small id="plataformas-ajuda">Separe as plataformas por vírgula.</small>
                </div>
                </>}
                <div className="usuario-form-campo">
                    <label htmlFor="senha">Senha inicial</label>
                    <input id="senha" name="senha" type="password" autoComplete="new-password"
                        placeholder="Defina uma senha" value={formulario.senha} onChange={handleChange} required />
                </div>
                {administrador && <div className="usuario-form-campo">
                    <label htmlFor="confirmarSenha">Confirmar senha</label>
                    <input id="confirmarSenha" name="confirmarSenha" type="password" autoComplete="new-password"
                        placeholder="Repita a senha" value={formulario.confirmarSenha} onChange={handleChange} required />
                </div>}
            </fieldset>

            {erro && <p className="admin-aviso admin-aviso-erro" role="alert">{erro}</p>}
            {sucesso && <p className="admin-aviso" role="status">{sucesso}</p>}
            <div className="usuario-form-rodape">
                <p>{administrador ? "Esta conta poderá gerenciar usuários e criar outros administradores." : "O usuário será criado sem assinatura ativa."}</p>
                <div className="usuario-form-acoes">
                    <button className="admin-botao admin-botao-secundario" type="button" onClick={onCancelar} disabled={salvando}>Cancelar</button>
                    <button className="admin-botao admin-botao-primario" type="submit" disabled={salvando}>
                        {salvando ? "Cadastrando..." : administrador ? "Cadastrar administrador" : "Cadastrar usuário"}
                    </button>
                </div>
            </div>
        </form>
    );
}
