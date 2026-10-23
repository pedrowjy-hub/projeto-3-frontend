import { useState } from "react";

export default function Cadastro() {
    const [nome, setNome] = useState("");
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

    function handleChange(event) {
        const { name, value } = event.target;

        setFormulario((event) => ({
            ...anterior,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        console.log("Nome:", formulario.nome);
    }


    return (
        <main>
            <h1>Crie sua conta</h1>

            <form onSubmit={handleSubmit}>
                <label htmlFor="nome">Nome completo</label>
                <input
                    id="nome"
                    name="nome"
                    type="text"
                    autoComplete="name"
                    value={formulario.nome}
                    onChange={handleChange}
                    required
                />
                
                <label htmlFor="username">Nome de usuário</label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formulario.username}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formulario.email}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="contato">Contato</label>
                <input
                    id="contato"
                    name="contato"
                    type="tel"
                    autoComplete="contato"
                    value={formulario.contato}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="tipo_perfil">Tipo de perfil</label>
                <select
                    id="tipo_perfil"
                    name="tipo_perfil"
                    value={formulario.tipo_perfil}
                    onChange={handleChange}
                    required
                />

                <option value="">Selecione</option>
                <option value="influenciador">Influenciador</option>
                <option value="empresa">Empresa</option>

                <label htmlFor="nicho">Nicho</label>
                <input
                    id="nicho"
                    name="nicho"
                    type="text"
                    placeholder="Ex.: tecnologia"
                    value={formulario.nicho}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="plataformas">Plataformas</label>
                <input
                    id="plataformas"
                    name="plataformas"
                    type="text"
                    placeholder="Instagram, YouTube"
                    value={formulario.plataformas}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="senha">Senha</label>
                <input
                    id="senha"
                    name="senha"
                    type="password"
                    autoComplete="new-password"
                    value={formulario.senha}
                    onChange={handleChange}
                    required
                />

                <button type="submit">Cadastrar</button>
            </form>
        </main>
    );
}