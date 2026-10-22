import { useState } from "react";

export default function FormularioAssinatura({ usuario, onCancelar }) {
    const [ativa, setAtiva] = useState(usuario.assinatura === true);
    const [expiracao, setExpiracao] = useState("");

    function handleSubmit(event) {
        event.preventDefault();
    }

    return (
        <form className="usuario-form" onSubmit={handleSubmit}>
            <div className="usuario-form-cabecalho">
                <div>
                    <h2>Alterar assinatura</h2>
                    <p>Usuário: @{usuario.username}</p>
                </div>
            </div>

            <div className="usuario-form-campos">
                <div className="usuario-form-campo">
                    <label htmlFor="assinatura-status">Status</label>

                    <select
                        id="assinatura-status"
                        value={ativa ? "ativa" : "inativa"}
                        onChange={(event) =>
                            setAtiva(event.target.value === "ativa")
                        }
                    >
                        <option value="inativa">Sem assinatura</option>
                        <option value="ativa">Ativa</option>
                    </select>
                </div>

                {ativa && (
                    <div className="usuario-form-campo">
                        <label htmlFor="assinatura-expiracao">
                            Data de expiração
                        </label>

                        <input
                            id="assinatura-expiracao"
                            type="date"
                            value={expiracao}
                            onChange={(event) =>
                                setExpiracao(event.target.value)
                            }
                            required
                        />
                    </div>
                )}
            </div>

            <div className="usuario-form-acoes">
                <button
                    className="admin-botao admin-botao-secundario"
                    type="button"
                    onClick={onCancelar}
                >
                    Cancelar
                </button>

                <button
                    className="admin-botao admin-botao-primario"
                    type="submit"
                >
                    Salvar assinatura
                </button>
            </div>
        </form>
    );
}