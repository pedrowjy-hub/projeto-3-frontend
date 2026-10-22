import { useState } from "react";

import "./index.css";

export default function FormularioUsuario({ onUsuarioCadastrado, onCancelar }) {
    const [formulario, setFormulario] = useState({
        nome: "",
        username: "",
        email: "",
        contato: "",
        tipo_perfil: "",
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


    }

    return (
        <form className="usuario-form" id="cadastro-usuario" onSubmit={handleCadastrar}>
            <div className="usuario-form-cabecalho">
                <div>
                    <h2>Adicionar usuário</h2>
                </div>
                <span className="usuario-form-selo" aria-hidden="true">＋</span>
            </div>

            <div className="usuario-form-campos">
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
                <div className="usuario-form-campo">
                    <label htmlFor="contato">Contato</label>
                    <input id="contato" name="contato" type="tel" autoComplete="tel"
                        placeholder="(11) 99999-9999" value={formulario.contato} onChange={handleChange} required />
                </div>
                <div className="usuario-form-campo">
                    <label htmlFor="tipo_perfil">Tipo de perfil</label>
                    <select id="tipo_perfil" name="tipo_perfil" value={formulario.tipo_perfil} onChange={handleChange} required>
                        <option value="">Selecione</option>
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
                <div className="usuario-form-campo">
                    <label htmlFor="senha">Senha inicial</label>
                    <input id="senha" name="senha" type="password" autoComplete="new-password"
                        placeholder="Defina uma senha" value={formulario.senha} onChange={handleChange} required />
                </div>
            </div>

            {erro && <p className="admin-aviso admin-aviso-erro" role="alert">{erro}</p>}
            {sucesso && <p className="admin-aviso" role="status">{sucesso}</p>}
            <div className="usuario-form-rodape">
                <p>O usuário será criado sem assinatura ativa.</p>
                <div className="usuario-form-acoes">
                    <button className="admin-botao admin-botao-secundario" type="button" onClick={onCancelar} disabled={salvando}>Cancelar</button>
                    <button className="admin-botao admin-botao-primario" type="submit" disabled={salvando}>
                        {salvando ? "Cadastrando..." : "Cadastrar usuário"}
                    </button>
                </div>
            </div>
        </form>
    );
}
