import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import "../DetalhesUsuario/index.css";
import "../FormularioUsuario/index.css";

function dataLocal(valor) {
    const data = new Date(valor);
    if (!valor || Number.isNaN(data.getTime())) return "";
    const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

export default function FormularioAssinatura({ usuario, onCancelar, onSalvo }) {
    const navigate = useNavigate();
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        dialog.showModal();
        return () => dialog.close();
    }, []);
    const [ativa, setAtiva] = useState(usuario.assinatura === true);
    const [expiracao, setExpiracao] = useState(() => dataLocal(usuario.premium_ate));
    const [senha, setSenha] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        if (salvando) return;
        setErro("");
        const fim = new Date(expiracao);
        if (ativa && (!expiracao || Number.isNaN(fim.getTime()) || fim <= new Date())) {
            setErro("Informe uma validade futura.");
            return;
        }
        setSalvando(true);
        try {
            const resposta = await fetch(`/api/admin/usuarios/${encodeURIComponent(usuario.username)}/assinatura`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ativa, premium_ate: ativa ? fim.toISOString() : null, senha }),
            });
            if (resposta.status === 401 || resposta.status === 422) {
                localStorage.removeItem("access_token");
                navigate("/login", { replace: true });
                return;
            }
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || "Não foi possível salvar a assinatura.");
            onSalvo(dados);
        } catch (error) {
            setErro(error.message || "Não foi possível salvar a assinatura. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <dialog ref={dialogRef} className="usuario-modal" aria-labelledby="assinatura-titulo"
            onCancel={event => {
                event.preventDefault();
                if (!salvando) onCancelar();
            }}>
        <form className="exclusao-form" onSubmit={handleSubmit} aria-busy={salvando}>
            <div className="usuario-form-cabecalho"><div>
                <h2 id="assinatura-titulo">Alterar assinatura</h2>
                <p>Usuário: @{usuario.username}</p>
                <p>Este ajuste altera o acesso na plataforma. Não cancela nem altera cobranças no Paddle. Uma nova atualização do provedor poderá substituir este ajuste.</p>
            </div></div>
            {erro && <p className="admin-aviso" role="alert">{erro}</p>}
            <div className="usuario-form-campos">
                <div className="usuario-form-campo">
                    <label htmlFor="assinatura-status">Status</label>
                    <select id="assinatura-status" value={ativa ? "ativa" : "inativa"} disabled={salvando} autoFocus
                        onChange={event => setAtiva(event.target.value === "ativa")}>
                        <option value="inativa">Sem assinatura</option>
                        <option value="ativa">Ativa</option>
                    </select>
                </div>
                {ativa && <div className="usuario-form-campo">
                    <label htmlFor="assinatura-expiracao">Validade (horário local)</label>
                    <input id="assinatura-expiracao" type="datetime-local" value={expiracao}
                        onChange={event => setExpiracao(event.target.value)} required disabled={salvando} />
                </div>}
                <div className="usuario-form-campo">
                    <label htmlFor="assinatura-senha">Sua senha de administrador</label>
                    <input id="assinatura-senha" type="password" autoComplete="current-password" value={senha}
                        onChange={event => setSenha(event.target.value)} required disabled={salvando} />
                </div>
            </div>
            <div className="usuario-form-acoes">
                <button className="admin-botao admin-botao-secundario" type="button" onClick={onCancelar} disabled={salvando}>Cancelar</button>
                <button className="admin-botao admin-botao-primario" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar assinatura"}</button>
            </div>
        </form>
        </dialog>
    );
}
