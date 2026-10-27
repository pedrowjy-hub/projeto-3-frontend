import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import Sidebar from "../Dashboard/Sidebar";
import { getSession } from "../../services/session";
import { criarPostagem, listarPostagens, urlMidia, MAX_MEDIA_FILES, MAX_MEDIA_SIZE } from "../../services/postagens";
import "../Dashboard/index.css";
import "./index.css";

function Media({ post, media, index }) {
  const [failed, setFailed] = useState(false);
  const url = urlMidia(post.id, index);
  const type = media?.tipo || "";
  return <div className="posts-media">
    {!failed && type.startsWith("image/") && <img src={url} alt={post.titulo} loading="lazy" onError={() => setFailed(true)} />}
    {!failed && type.startsWith("video/") && <video src={url} controls preload="metadata" onError={() => setFailed(true)} aria-label={post.titulo} />}
    {!failed && type.startsWith("audio/") && <audio src={url} controls preload="none" onError={() => setFailed(true)} aria-label={post.titulo} />}
    {failed && <p>Não foi possível exibir a mídia. Tente baixar o arquivo.</p>}
    <a href={url} download>{media?.nome || "Baixar mídia"} <span aria-hidden="true">↓</span></a>
  </div>;
}

export default function Postagens() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [composing, setComposing] = useState(false);
  const fileInput = useRef(null);
  const dialogRef = useRef(null);
  const createButton = useRef(null);
  const feedRef = useRef(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0 });
  }, [search]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!composing || !dialog) return;
    const trigger = createButton.current;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [composing]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) { navigate("/login", { replace: true }); return; }
      try {
        const user = await getSession(token);
        if (controller.signal.aborted) return;
        if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
        setProfile(user);
        const data = await listarPostagens(controller.signal);
        if (!controller.signal.aborted) setPosts(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [navigate, attempt]);

  async function publish(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setFormError(""); setSuccess("");
    try {
      const post = await criarPostagem({ titulo: title, descricao: description, midia: files }, localStorage.getItem("access_token"));
      setPosts(current => [{ ...post, autor: { nome: profile.nome, username: profile.username, tipo_perfil: profile.tipo_perfil } }, ...current.filter(item => item.id !== post.id)]);
      setTitle(""); setDescription(""); setFiles([]); setSearch("");
      setError("");
      fileInput.current.value = "";
      setSuccess("Postagem publicada com sucesso!");
      setComposing(false);
      feedRef.current?.scrollTo({ top: 0 });
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  }

  if (!profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando seu espaço…"}</p>{error && <Link to="/login">Voltar ao login</Link>}</main>;
  const filtered = posts.filter(post => `${post.titulo} ${post.descricao} ${post.autor?.nome || ""} ${post.autor?.username || ""}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
  function openComposer() { setFormError(""); setSuccess(""); setComposing(true); }
  return <main className="dash-page posts-page">
    <Sidebar profile={profile} />
    <div className="dash-content">
      <header className="dash-header"><div><p className="dash-label">IDEIAS QUE CONECTAM</p><h1>Postagens<span> ✦</span></h1></div><button ref={createButton} className="posts-primary" type="button" aria-haspopup="dialog" onClick={openComposer}><span aria-hidden="true">＋</span> Nova postagem</button></header>
      {success && <p className="posts-success" role="status">{success}</p>}
      <dialog ref={dialogRef} className="posts-dialog dash-page" aria-labelledby="posts-compose-title" onCancel={event => { event.preventDefault(); if (!saving) setComposing(false); }}>
      <section className="posts-compose">
        <div className="posts-compose-header"><div><p className="dash-label">COMPARTILHE COM A COMUNIDADE</p><h2 id="posts-compose-title">Nova postagem</h2><p>Divulgue um trabalho, apresente uma ideia ou publique uma oportunidade.</p></div><button className="posts-close" type="button" aria-label="Fechar nova postagem" disabled={saving} onClick={() => setComposing(false)}>×</button></div>
        <form onSubmit={publish}>
          <fieldset disabled={saving}><legend className="posts-sr-only">Nova postagem</legend>
            <label htmlFor="post-title">Título<input id="post-title" required autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Procura-se creator para uma campanha" /></label>
            <label htmlFor="post-description">Descrição<textarea id="post-description" required rows={5} value={description} onChange={event => setDescription(event.target.value)} placeholder="Conte sobre o projeto, os detalhes da oportunidade ou o trabalho que você quer divulgar…" /></label>
            <label htmlFor="post-media">Arquivos<input id="post-media" type="file" multiple ref={fileInput} required={!files.length} aria-describedby="post-media-help" onChange={event => {
              const selected = [...files, ...Array.from(event.target.files || [])];
              event.target.value = "";
              if (selected.length > MAX_MEDIA_FILES) { setFormError("Adicione no máximo três arquivos por postagem."); return; }
              if (selected.some(file => !file.size || file.size > MAX_MEDIA_SIZE)) { setFormError("Cada arquivo deve ser não vazio e ter no máximo 8 MB."); return; }
              setFiles(selected); setFormError(""); setSuccess("");
            }} /></label>
            <p id="post-media-help" className="posts-help">Anexe até três arquivos, com até 8 MB cada. Você pode selecionar vários de uma vez ou adicioná-los aos poucos.</p>
            {files.length > 0 && <ul className="posts-files">{files.map((file, index) => <li key={`${index}-${file.name}`}><span>{file.name} · {(file.size / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} MB</span><button type="button" aria-label={`Remover ${file.name}`} onClick={() => setFiles(current => current.filter((_, i) => i !== index))}>Remover</button></li>)}</ul>}
            <div className="posts-compose-actions"><button className="posts-secondary" type="button" onClick={() => setComposing(false)}>Cancelar</button><button className="posts-primary" type="submit">{saving ? "Publicando…" : "Publicar postagem"} <span aria-hidden="true">↗</span></button></div>
          </fieldset>
          {formError && <p className="posts-error" role="alert">{formError}</p>}
        </form>
      </section>
      </dialog>
      <section className="posts-feed" aria-labelledby="posts-feed-title" aria-busy={loading}>
        <div className="posts-feed-header"><div><p className="dash-label">DA COMUNIDADE · MAIS RECENTES PRIMEIRO</p><h2 id="posts-feed-title">Últimas publicações</h2></div><label className="dash-search"><span>Buscar postagens</span><input type="search" placeholder="Publicação ou autor" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
        <div ref={feedRef} className="posts-feed-scroll" role="region" aria-label="Publicações da comunidade" tabIndex={0}>
        {loading ? <p className="dash-empty" role="status">Carregando postagens…</p> : error ? <div className="dash-empty"><p role="alert">{error}</p><button className="posts-primary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div> : filtered.length === 0 ? <div className="dash-empty"><h3>{search ? "Nenhuma postagem encontrada" : "A próxima ideia pode ser sua."}</h3><p>{search ? "Tente buscar por outra publicação ou autor." : "Compartilhe a primeira postagem com a comunidade."}</p>{!search && <button className="posts-primary" type="button" onClick={openComposer}>Criar uma postagem <span aria-hidden="true">↗</span></button>}</div> : <div className="posts-grid">{filtered.map(post => <article className="dash-card posts-card" key={post.id}>
          <div className="dash-card-body"><header className="posts-author"><span className="posts-avatar" aria-hidden="true">{(post.autor?.nome || post.autor?.username || "?").slice(0, 2).toLocaleUpperCase("pt-BR")}</span><div><strong>{post.autor?.nome || post.autor?.username || "Perfil indisponível"}{post.autor?.username === profile.username && <span className="posts-own"> · Você</span>}</strong><span>{post.autor?.username && `@${post.autor.username} · `}{post.autor?.tipo_perfil === "empresa" ? "Empresa" : post.autor?.tipo_perfil === "influenciador" ? "Influenciador" : "Comunidade"}</span></div></header><time dateTime={post.criada_em}>{Number.isNaN(Date.parse(post.criada_em)) ? "Data não informada" : new Date(post.criada_em).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</time><h3>{post.titulo}</h3><p className="posts-description">{post.descricao}</p></div>
          {(post.midias || (post.midia ? [post.midia] : [])).map((media, index) => <Media key={`${index}-${media?.nome}`} post={post} media={media} index={index} />)}
        </article>)}</div>}
        </div>
      </section>
    </div>
  </main>;
}
