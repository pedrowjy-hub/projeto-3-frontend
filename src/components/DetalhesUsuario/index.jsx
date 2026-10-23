import { useEffect, useRef } from "react";
import "./index.css";

export default function DetalhesUsuario({ usuario, onFechar }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;

        dialog.showModal();

        return () => {
            dialog.close();
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className="usuario-modal"
            aria-labelledby="detalhes-usuario-titulo"
            onCancel={(event) => {
                event.preventDefault();
                onFechar();
            }}
        >
            <div className="usuario-modal-cabecalho">
                <h2 id="detalhes-usuario-titulo">Detalhes do usuário</h2>

                <button
                    className="admin-botao admin-botao-secundario"
                    type="button"
                    onClick={onFechar}
                    autoFocus
                >
                    Fechar
                </button>
            </div>

            <dl className="usuario-modal-dados">
                <div>
                    <dt>Nome</dt>
                    <dd>{usuario.nome || "Não informado"}</dd>
                </div>

                <div>
                    <dt>Username</dt>
                    <dd>@{usuario.username}</dd>
                </div>

                <div>
                    <dt>Tipo de perfil</dt>
                    <dd>{usuario.tipo_perfil || "Não informado"}</dd>
                </div>

                <div>
                    <dt>Nicho</dt>
                    <dd>{usuario.nicho || "Não informado"}</dd>
                </div>

                <div>
                    <dt>Plataformas</dt>
                    <dd>
                        {usuario.plataformas?.length
                            ? usuario.plataformas.join(", ")
                            : "Não informado"}
                    </dd>
                </div>

                <div>
                    <dt>Descrição</dt>
                    <dd>{usuario.descricao || "Não informada"}</dd>
                </div>
            </dl>
        </dialog>
    );
}