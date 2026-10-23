import { useEffect, useRef } from "react";
import "../DetalhesUsuario/index.css";

export default function ConfirmarExclusao({
    usuario,
    excluindo,
    erro,
    onCancelar,
    onConfirmar
}) {
    const dialogRef = useRef(null);

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
                    type="button"
                    onClick={onConfirmar}
                    disabled={excluindo}
                >
                    {excluindo ? "Excluindo..." : "Excluir usuário"}
                </button>
            </div>
        </dialog>
    );

}