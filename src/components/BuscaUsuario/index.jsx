import { useEffect, useRef, useState } from "react";
import { filtrarSugestoes, limparUsername, listarPerfis } from "../../services/perfis";
import "./index.css";

export default function BuscaUsuario({ id, label, value, onChange, onSelect, tipoPerfil, usernameAtual, disabled = false }) {
  const [aberta, setAberta] = useState(false);
  const [perfis, setPerfis] = useState([]);
  const [estado, setEstado] = useState("inicial");
  const [tentativa, setTentativa] = useState(0);
  const [indice, setIndice] = useState(-1);
  const consultado = useRef(null);
  const iniciarBusca = aberta && Boolean(limparUsername(value));
  const sugestoes = filtrarSugestoes(perfis, value, tipoPerfil, usernameAtual);
  const mostrarLista = iniciarBusca && !disabled;
  const indiceAtivo = indice < sugestoes.length ? indice : -1;

  useEffect(() => {
    if (!iniciarBusca || consultado.current === tipoPerfil) return;
    const controller = new AbortController();
    setEstado("carregando");
    listarPerfis(tipoPerfil, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      consultado.current = tipoPerfil;
      setPerfis(data);
      setEstado("pronto");
    }).catch(() => {
      if (!controller.signal.aborted) setEstado("erro");
    });
    return () => controller.abort();
  }, [iniciarBusca, tipoPerfil, tentativa]);

  function selecionar(perfil) {
    setAberta(false);
    setIndice(-1);
    onChange(perfil.username);
    onSelect?.(perfil);
  }

  function navegar(event) {
    if (event.key === "Escape") {
      if (mostrarLista) { event.preventDefault(); event.stopPropagation(); }
      setAberta(false);
      setIndice(-1);
    } else if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      setAberta(true);
      if (sugestoes.length) setIndice(event.key === "ArrowDown"
        ? (indiceAtivo + 1) % sugestoes.length
        : (indiceAtivo <= 0 ? sugestoes.length - 1 : indiceAtivo - 1));
    } else if (event.key === "Enter" && mostrarLista && indiceAtivo >= 0 && !event.nativeEvent.isComposing) {
      event.preventDefault();
      selecionar(sugestoes[indiceAtivo]);
    } else if (event.key === "Enter") {
      setAberta(false);
    }
  }

  useEffect(() => {
    if (mostrarLista && indiceAtivo >= 0) document.getElementById(`${id}-opcao-${indiceAtivo}`)?.scrollIntoView({ block: "nearest" });
  }, [id, indiceAtivo, mostrarLista]);

  return <div className="user-lookup" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) { setAberta(false); setIndice(-1); }
  }}>
    <label htmlFor={id}>{label}</label>
    <input id={id} role="combobox" aria-autocomplete="list" aria-expanded={mostrarLista}
      aria-controls={mostrarLista ? `${id}-lista` : undefined}
      aria-activedescendant={mostrarLista && estado === "pronto" && indiceAtivo >= 0 ? `${id}-opcao-${indiceAtivo}` : undefined}
      value={value} onChange={event => { onChange(event.target.value); setAberta(true); setIndice(-1); }}
      onFocus={() => setAberta(true)} onKeyDown={navegar} disabled={disabled}
      placeholder="Digite nome ou username, com ou sem @" required maxLength={200} autoComplete="off" spellCheck={false} />
    {mostrarLista && <div className="user-lookup-panel">
      <ul id={`${id}-lista`} className="user-lookup-list" role="listbox" aria-label="Sugestões de usuários" aria-busy={estado === "carregando"}>
        {estado === "pronto" && sugestoes.map((perfil, index) => <li key={perfil.username} role="presentation">
          <button id={`${id}-opcao-${index}`} type="button" role="option" aria-selected={indiceAtivo === index}
            tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => selecionar(perfil)}>
            <span className="user-lookup-avatar" aria-hidden="true">{(perfil.nome || perfil.username).slice(0, 1).toLocaleUpperCase("pt-BR")}</span>
            <span><strong>{perfil.nome || perfil.username}</strong><small>@{perfil.username}</small></span>
          </button>
        </li>)}
      </ul>
      {estado === "carregando" || estado === "inicial" ? <p role="status">Buscando usuários…</p>
        : estado === "erro" ? <div role="alert"><p>Não foi possível carregar as sugestões.</p><button className="user-lookup-retry" type="button" onClick={() => setTentativa(valor => valor + 1)}>Tentar novamente</button></div>
        : !sugestoes.length ? <p role="status">Nenhum usuário encontrado.</p>
        : <p className="user-lookup-help">Use ↑ e ↓ para navegar e Enter para selecionar.</p>}
    </div>}
  </div>;
}
