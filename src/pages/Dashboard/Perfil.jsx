import { useState } from "react";

const toForm = profile => ({
  nome: profile.nome || "",
  nicho: profile.nicho || "",
  descricao: profile.descricao || "",
  plataformas: (profile.plataformas || []).join(", "),
});

export default function Perfil({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => toForm(profile));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const company = profile.tipo_perfil === "empresa";
  const initials = (profile.nome || profile.username).trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();

  function change(event) {
    setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSuccess("");
    const data = {
      nome: form.nome.trim(), nicho: form.nicho.trim(), descricao: form.descricao.trim(),
      plataformas: [...new Set(form.plataformas.split(",").map(value => value.trim()).filter(Boolean))],
    };
    if (!data.nome || !data.nicho || !data.plataformas.length) {
      setError("Preencha nome, nicho e ao menos uma plataforma.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/usuarios/${encodeURIComponent(profile.username)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 401 || response.status === 422 && !result.erro
        ? "Sua sessão expirou. Entre novamente para salvar." : result.erro || "Não foi possível salvar seu perfil.");
      onUpdate({ ...profile, ...data });
      setForm(toForm(data));
      setEditing(false);
      setSuccess("Perfil atualizado com sucesso.");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <div className="dash-content profile-content">
    <header className="dash-header"><div><p className="dash-label">SEU ESPAÇO / PERFIL</p><h1>Meu perfil</h1></div><span className="dash-role">{company ? "Empresa" : "Influenciador"}</span></header>
    <section className="profile-summary" aria-label="Apresentação do perfil">
      <div className="profile-cover"><span aria-hidden="true">✦</span></div>
      <div className="profile-identity"><span className="profile-avatar" aria-hidden="true">{initials}</span><div><h2>{profile.nome || profile.username}</h2><p>@{profile.username}</p></div><button type="button" className="profile-primary" disabled={editing} onClick={() => { setForm(toForm(profile)); setEditing(true); setSuccess(""); setError(""); }}>Editar perfil</button></div>
    </section>
    {success && <p className="profile-success" role="status">{success}</p>}
    <section className="profile-details">
      <div className="profile-section-heading"><p className="dash-label">SUA APRESENTAÇÃO</p><h2>{editing ? "Editar informações" : "Sobre o perfil"}</h2><p>{company ? "Apresente sua empresa e os interesses da sua marca." : "Conte sobre seu conteúdo e ajude marcas a conhecerem seu trabalho."}</p></div>
      {editing ? <form onSubmit={save} aria-busy={saving}>
        <fieldset disabled={saving} className="profile-fields">
          <label htmlFor="profile-name">{company ? "Nome da empresa" : "Nome"}<input id="profile-name" name="nome" value={form.nome} onChange={change} required /></label>
          <label htmlFor="profile-niche">{company ? "Segmento / nicho" : "Nicho de conteúdo"}<input id="profile-niche" name="nicho" value={form.nicho} onChange={change} required /></label>
          <label className="profile-wide" htmlFor="profile-bio">{company ? "Sobre a empresa" : "Biografia"}<textarea id="profile-bio" name="descricao" rows={5} value={form.descricao} onChange={change} placeholder="Apresente seu trabalho e o que você busca nas parcerias." /></label>
          <label className="profile-wide" htmlFor="profile-platforms">Plataformas<input id="profile-platforms" name="plataformas" value={form.plataformas} onChange={change} aria-describedby="profile-platform-help" required /><small id="profile-platform-help">Separe por vírgulas. Ex.: Instagram, YouTube, TikTok.</small></label>
        </fieldset>
        {error && <p className="profile-error" role="alert">{error}</p>}
        <div className="profile-actions"><button type="button" className="profile-secondary" disabled={saving} onClick={() => { setEditing(false); setError(""); }}>Cancelar</button><button type="submit" className="profile-primary" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button></div>
      </form> : <><dl className="profile-info"><div><dt>Nome de usuário</dt><dd>@{profile.username}</dd></div><div><dt>{company ? "Segmento / nicho" : "Nicho de conteúdo"}</dt><dd>{profile.nicho || "Nicho não informado"}</dd></div><div className="profile-wide"><dt>{company ? "Sobre a empresa" : "Biografia"}</dt><dd className="profile-bio">{profile.descricao || "Você ainda não adicionou uma apresentação. Edite seu perfil para contar mais sobre seu trabalho."}</dd></div></dl><h3 className="profile-platform-title">Plataformas</h3><div className="dash-platforms">{profile.plataformas?.length ? profile.plataformas.map(platform => <span key={platform}>{platform}</span>) : <p>Nenhuma plataforma informada.</p>}</div></>}
    </section>
  </div>;
}
