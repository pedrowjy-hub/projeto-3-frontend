import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSession } from "../../services/session";
import Sidebar from "../Dashboard/Sidebar";
import ConfirmarExclusao from "../../components/ConfirmarExclusao";
import "../Dashboard/index.css";
import "../../components/FormularioUsuario/index.css";
import "./index.css";

function camposPerfil(profile) {
    return {
        nome: profile.nome || "", nicho: profile.nicho || "",
        descricao: profile.descricao || "", plataformas: (profile.plataformas || []).join(", "),
        email: profile.email || "", contato: profile.contato || "",
    };
}

export default function Configuracoes() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState(null);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [excluir, setExcluir] = useState(false);
    const [excluindo, setExcluindo] = useState(false);
    const [erroExclusao, setErroExclusao] = useState("");

    useEffect(() => {
        let active = true;
        const token = localStorage.getItem("access_token");
        if (!token) { navigate("/login", { replace: true }); return; }
        getSession(token).then(async user => {
            if (!active) return;
            if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
            const resposta = await fetch("/api/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!resposta.ok) throw new Error("Não foi possível carregar os dados da sua conta.");
            const conta = await resposta.json();
            if (!active) return;
            setProfile(conta);
            setForm(camposPerfil(conta));
        }).catch(error => { if (active) setErro(error.message); });
        return () => { active = false; };
    }, [navigate]);

    function sair() {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
    }

    function alterar(event) {
        const { name, value } = event.target;
        setForm(anterior => ({ ...anterior, [name]: value }));
        setMensagem("");
        setErro("");
    }

    async function salvar(event) {
        event.preventDefault();
        if (salvando) return;
        const original = camposPerfil(profile);
        const dados = {};
        for (const campo of ["nome", "nicho", "descricao"]) {
            if (form[campo].trim() !== original[campo]) dados[campo] = form[campo].trim();
        }
        if (form.plataformas !== original.plataformas) {
            dados.plataformas = form.plataformas.split(",").map(item => item.trim()).filter(Boolean);
            if (!dados.plataformas.length) { setErro("Informe pelo menos uma plataforma."); return; }
        }
        if (form.email.trim() !== original.email) dados.email = form.email.trim();
        if (form.contato.trim() !== original.contato) {
            if (!/^[0-9]{10,11}$/.test(form.contato.replace(/[()\s-]/g, ""))) {
                setErro("Informe um contato com 10 ou 11 dígitos, incluindo o DDD."); return;
            }
            dados.contato = form.contato.trim();
        }
        if (!Object.keys(dados).length) { setMensagem("Nenhuma alteração para salvar."); return; }
        setSalvando(true); setErro(""); setMensagem("");
        try {
            const resposta = await fetch(`/api/usuarios/${encodeURIComponent(profile.username)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
                body: JSON.stringify(dados),
            });
            if (resposta.status === 401) { sair(); return; }
            const resultado = await resposta.json().catch(() => ({}));
            if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível salvar suas alterações.");
            const atualizado = { ...profile, ...dados };
            setProfile(atualizado); setForm(camposPerfil(atualizado));
            setMensagem("Alterações salvas com sucesso!");
        } catch (error) { setErro(error.message); }
        finally { setSalvando(false); }
    }

    async function excluirConta(senha) {
        if (excluindo) return;
        setExcluindo(true); setErroExclusao("");
        try {
            const resposta = await fetch(`/api/usuarios/${encodeURIComponent(profile.username)}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
                body: JSON.stringify({ senha }),
            });
            if (resposta.status === 401) { sair(); return; }
            if (!resposta.ok) {
                const resultado = await resposta.json().catch(() => ({}));
                throw new Error(resultado.erro || "Não foi possível desativar sua conta.");
            }
            sair();
        } catch (error) { setErroExclusao(error.message); }
        finally { setExcluindo(false); }
    }

    if (!profile) return <main className="dash-page dash-status"><p role={erro ? "alert" : "status"}>{erro || "Carregando suas configurações…"}</p>{erro && <Link to="/login">Voltar ao login</Link>}</main>;

    const mudou = JSON.stringify(form) !== JSON.stringify(camposPerfil(profile));
    return <main className="dash-page settings-page">
        <Sidebar profile={profile} />
        <div className="dash-content settings-content">
            <header className="dash-header"><div><p className="dash-label">DO SEU JEITO</p><h1>Configurações<span> ✦</span></h1><p className="settings-subtitle">Cuide do seu perfil e dos dados da sua conta.</p></div></header>
            <nav className="settings-anchors" aria-label="Seções das configurações"><a href="#perfil">Seu perfil</a><a href="#seguranca">Acesso e segurança</a></nav>
            <form onSubmit={salvar}>
                <fieldset disabled={salvando || excluindo} className="settings-fields">
                    <section className="settings-card" id="perfil" aria-labelledby="perfil-titulo">
                        <div className="settings-card-heading"><span className="settings-icon" aria-hidden="true">◎</span><div><h2 id="perfil-titulo">Seu perfil</h2><p>Atualize sua apresentação e seus dados de contato.</p></div></div>
                        <div className="settings-identity"><span className="settings-avatar">{(profile.nome || profile.username).slice(0, 2).toUpperCase()}</span><div><strong>{profile.nome}</strong><span>@{profile.username} · {profile.tipo_perfil === "empresa" ? "Empresa" : "Influenciador"}</span></div><span className="settings-badge">Perfil público</span></div>
                        <div className="settings-grid">
                            <label>Nome<input name="nome" value={form.nome} onChange={alterar} autoComplete="name" required /></label>
                            <label>Nicho<input name="nicho" value={form.nicho} onChange={alterar} placeholder="Ex.: moda e lifestyle" required /></label>
                            <label className="settings-wide">Plataformas<input name="plataformas" value={form.plataformas} onChange={alterar} placeholder="Instagram, YouTube" required /><small>Separe os nomes por vírgula.</small></label>
                            <label>E-mail<input name="email" type="email" value={form.email} onChange={alterar} autoComplete="email" placeholder="nome@exemplo.com" required /></label>
                            <label>Contato<input name="contato" type="tel" value={form.contato} onChange={alterar} autoComplete="tel" placeholder="(11) 99999-9999" required /><small>10 ou 11 dígitos, incluindo o DDD.</small></label>
                            <label className="settings-wide">Sobre você<textarea name="descricao" value={form.descricao} onChange={alterar} rows={4} placeholder="Conte um pouco sobre seu trabalho e as parcerias que procura." /></label>
                        </div>
                    </section>
                </fieldset>
                {erro && <p className="settings-feedback settings-error" role="alert">{erro}</p>}
                {mensagem && <p className="settings-feedback" role="status">{mensagem}</p>}
                <div className="settings-save"><span>{mudou ? "Você tem alterações não salvas." : "Seus dados, sempre em dia."}</span><div><button type="button" className="settings-button" disabled={!mudou || salvando || excluindo} onClick={() => { setForm(camposPerfil(profile)); setErro(""); setMensagem(""); }}>Descartar</button><button type="submit" className="settings-button settings-primary" disabled={!mudou || salvando || excluindo}>{salvando ? "Salvando…" : "Salvar alterações"}</button></div></div>
            </form>
            <section className="settings-card settings-security" id="seguranca" aria-labelledby="seguranca-titulo">
                <div className="settings-card-heading"><span className="settings-icon" aria-hidden="true">◇</span><div><h2 id="seguranca-titulo">Acesso e segurança</h2><p>Você decide quando encerrar sua sessão ou sua conta.</p></div></div>
                <div className="settings-action"><div><h3>Sair da conta</h3><p>Encerre sua sessão neste navegador.</p></div><button type="button" className="settings-button" onClick={sair} disabled={salvando || excluindo}>Sair da conta ↗</button></div>
                <div className="settings-action settings-danger"><div><h3>Desativar minha conta</h3><p>Seu acesso será bloqueado e seus dados preservados. Para reativar, entre em contato com a administração.</p></div><button type="button" className="settings-button" disabled={salvando || excluindo} onClick={() => { setErroExclusao(""); setExcluir(true); }}>Desativar conta</button></div>
            </section>
            <p className="settings-footer">nexo<span>.</span> · Conexões que fazem sentido.</p>
        </div>
        {excluir && <ConfirmarExclusao usuario={profile} excluindo={excluindo} erro={erroExclusao} onConfirmar={excluirConta} onCancelar={() => setExcluir(false)} />}
    </main>;
}
