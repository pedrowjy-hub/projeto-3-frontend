import { Link } from "react-router";
import { DEFAULT_APPEARANCE } from "../../services/aparencia";
import useAppearance from "../../hooks/useAppearance";
import Sidebar from "../Dashboard/Sidebar";

const themes = [{ value: "claro", label: "Claro", icon: "☀", detail: "Leve e acolhedor" }, { value: "escuro", label: "Escuro", icon: "☾", detail: "Para ambientes com pouca luz" }, { value: "sistema", label: "Do sistema", icon: "◐", detail: "Acompanha seu dispositivo" }];
const colors = [{ value: "verde", label: "Verde", hex: "#275747" }, { value: "azul", label: "Azul", hex: "#254e85" }, { value: "ameixa", label: "Ameixa", hex: "#754064" }];
const sizes = [{ value: "padrao", label: "Padrão", detail: "100%" }, { value: "grande", label: "Grande", detail: "112,5%" }, { value: "maior", label: "Extra grande", detail: "125%" }];

export default function Aparencia({ profile }) {
  const { preferences, update, storageError, loading, saving, error, retry } = useAppearance();
  function change(patch) {
    update(patch);
  }

  return <main className="dash-page settings-page">
    <Sidebar profile={profile} />
    <div className="dash-content settings-content">
      <header className="dash-header"><div><p className="dash-label">DO SEU JEITO</p><h1>Configurações<span> ✦</span></h1><p className="settings-subtitle">Um espaço que combina com você. Ajuste a aparência e encontre seu jeito de navegar.</p></div></header>
      <div className="settings-layout">
        <section className="settings-card" aria-labelledby="appearance-title">
          <div className="settings-card-heading"><span className="settings-icon" aria-hidden="true">◐</span><div><h2 id="appearance-title">Aparência e leitura</h2><p>Experimente: as mudanças aparecem na hora.</p></div></div>
          <fieldset className="settings-choice-group"><legend>Tema do site</legend><div className="settings-theme-options">{themes.map(theme => <label key={theme.value} className={`settings-option${preferences.tema === theme.value ? " is-selected" : ""}`}><input type="radio" name="tema" value={theme.value} checked={preferences.tema === theme.value} onChange={() => change({ tema: theme.value })} /><span className="settings-theme-icon" aria-hidden="true">{theme.icon}</span><strong>{theme.label}</strong><small>{theme.detail}</small></label>)}</div></fieldset>
          <fieldset className="settings-choice-group"><legend>Tamanho da fonte</legend><p className="settings-help">Aumenta os textos e os elementos para facilitar a leitura.</p><div className="settings-size-options">{sizes.map(size => <label key={size.value} className={`settings-option${preferences.fonte === size.value ? " is-selected" : ""}`}><input type="radio" name="fonte" value={size.value} checked={preferences.fonte === size.value} onChange={() => change({ fonte: size.value })} /><strong>{size.label}</strong><small>{size.detail}</small></label>)}</div></fieldset>
          <fieldset className="settings-choice-group"><legend>Cor de destaque</legend><p className="settings-help">Escolha a paleta dos botões e dos destaques da plataforma.</p><div className="settings-color-options">{colors.map(color => <label key={color.value} className={`settings-color${preferences.cor === color.value ? " is-selected" : ""}`}><input type="radio" name="cor" value={color.value} checked={preferences.cor === color.value} onChange={() => change({ cor: color.value })} /><span className="settings-swatch" style={{ backgroundColor: color.hex }} aria-hidden="true">{preferences.cor === color.value && "✓"}</span><strong>{color.label}</strong></label>)}</div></fieldset>
          <div className="settings-motion"><div><label htmlFor="high-contrast">Alto contraste</label><p id="high-contrast-help">Realce textos, bordas e controles para facilitar a leitura, no tema claro ou escuro.</p></div><input id="high-contrast" type="checkbox" role="switch" aria-describedby="high-contrast-help" checked={preferences.altoContraste} onChange={event => change({ altoContraste: event.target.checked })} /></div>
          <div className="settings-motion"><div><label htmlFor="reduce-motion">Reduzir animações</label><p>Prefira transições mais discretas durante a navegação.</p></div><input id="reduce-motion" type="checkbox" role="switch" checked={preferences.reduzirMovimento} onChange={event => change({ reduzirMovimento: event.target.checked })} /></div>
          <div className="settings-save"><p role="status">{loading ? "Carregando as preferências da sua conta…" : saving ? "Salvando suas preferências…" : error ? `${error} As alterações continuam aplicadas aqui e serão reenviadas quando possível.` : storageError ? "Preferências salvas na sua conta. Não foi possível guardar uma cópia neste navegador." : "Preferências salvas na sua conta. Elas acompanham você em outros dispositivos."}</p>{error && <button type="button" className="settings-button" onClick={retry}>Tentar sincronizar</button>}<button type="button" className="settings-button" onClick={() => update(DEFAULT_APPEARANCE)}>Restaurar padrão</button></div>
        </section>
        <aside className="settings-preview-column" aria-labelledby="preview-title">
          <div className="settings-card settings-preview"><p className="dash-label">UMA PRÉVIA DO SEU ESPAÇO</p><h2 id="preview-title">Boas conexões,<br /><em>do seu jeito.</em></h2><p>Assim ficam os textos, os cartões e os destaques com suas escolhas.</p><div className="settings-preview-sample"><span className="settings-preview-avatar" aria-hidden="true">{(profile.nome || profile.username).slice(0, 1).toUpperCase()}</span><div><strong>{profile.nome || profile.username}</strong><span>Seu próximo encontro começa aqui.</span></div><span className="settings-preview-star" aria-hidden="true">✦</span></div><Link className="settings-primary" to="/explorar">Explorar conexões <span aria-hidden="true">↗</span></Link></div>
          <p className="settings-local-note">Suas escolhas acompanham sua conta em outros dispositivos. O tema “Do sistema” respeita a aparência de cada dispositivo.</p>
        </aside>
      </div>
    </div>
  </main>;
}
