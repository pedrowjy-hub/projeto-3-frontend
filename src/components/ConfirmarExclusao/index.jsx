import { useEffect, useRef, useState } from "react";
import "../DetalhesUsuario/index.css";

export default function ConfirmarExclusao({
    usuario,
    excluindo,
    erro,
    onCancelar,
    onConfirmar
}) {
    const dialogRef = useRef(null);
    const [senha, setSenha] = useState("");

    function handleConfirmar(event) {
        event.preventDefault();
        if (excluindo || !senha.trim()) return;
        onConfirmar(senha);
    }

    useEffect(() => {
        const dialog = dialogRef.current;

        dialog.showModal();

        return () => dialog.close();
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className="usuario-modal"
            aria-labelledby="exclusao-titulo"
            aria-describedby="exclusao-descricao"
            onCancel={(event) => {
                event.preventDefault();

                if (!excluindo) {
                    onCancelar();
                }
            }}
        >
            <div className="usuario-modal-cabecalho">
                <h2 id="exclusao-titulo">Excluir usuário</h2>
            </div>

            <p id="exclusao-descricao" className="exclusao-descricao">
                Deseja excluir <strong>@{usuario.username}</strong>?
                {" "}Essa ação não pode ser desfeita.
            </p>

            <form className="exclusao-form" onSubmit={handleConfirmar} aria-busy={excluindo}>
                <div className="usuario-form-campo">
                    <label htmlFor="exclusao-senha">Sua senha atual</label>
                    <input id="exclusao-senha" name="senha" type="password" autoComplete="current-password"
                        value={senha} onChange={(event) => setSenha(event.target.value)}
                        aria-describedby="exclusao-senha-ajuda" disabled={excluindo} required />
                    <small id="exclusao-senha-ajuda">Digite a senha da sua conta conectada para confirmar a exclusão.</small>
                </div>

            {erro && (
                <p className="admin-aviso admin-aviso-erro" role="alert">
                    {erro}
                </p>
            )}

            <div className="usuario-form-acoes">
                <button
                    className="admin-botao admin-botao-secundario"
                    type="button"
                    onClick={onCancelar}
                    disabled={excluindo}
                    autoFocus
                >
                    Cancelar
                </button>

                <button
                    className="admin-botao admin-botao-perigo"
                    type="submit"
                    disabled={excluindo || !senha.trim()}
                >
                    {excluindo ? "Excluindo..." : "Excluir usuário"}
                </button>
            </div>
            </form>
        </dialog>
    );

}
