import test from "node:test";
import assert from "node:assert/strict";
import { APPEARANCE_KEY, DEFAULT_APPEARANCE, normalizeAppearance, readAppearance, saveAppearance, applyAppearance } from "./aparencia.js";

test("preferências inválidas ou armazenamento corrompido voltam ao padrão", () => {
  assert.deepEqual(normalizeAppearance({ tema: "inexistente", fonte: 999, cor: "#fff", reduzirMovimento: "true" }), DEFAULT_APPEARANCE);
  assert.deepEqual(readAppearance({ getItem: () => "json inválido" }), DEFAULT_APPEARANCE);
  assert.deepEqual(readAppearance({ getItem: () => { throw new Error("bloqueado"); } }), DEFAULT_APPEARANCE);
});

test("escolhas válidas persistem e podem ser restauradas sem afetar a sessão", () => {
  const data = new Map([["access_token", "sessao-existente"]]);
  const storage = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) };
  const preferences = { tema: "escuro", fonte: "maior", cor: "azul", reduzirMovimento: true, altoContraste: true };
  assert.equal(saveAppearance(storage, preferences), true);
  assert.deepEqual(readAppearance(storage), preferences);
  assert.equal(data.has(APPEARANCE_KEY), true);
  saveAppearance(storage, DEFAULT_APPEARANCE);
  assert.deepEqual(readAppearance(storage), DEFAULT_APPEARANCE);
  assert.equal(data.get("access_token"), "sessao-existente");
});

test("armazenamento bloqueado é informado sem impedir a aplicação visual", () => {
  const storage = { setItem: () => { throw new Error("sem espaço"); } };
  assert.equal(saveAppearance(storage, { tema: "escuro" }), false);
  const root = { dataset: {} };
  applyAppearance({ tema: "escuro" }, root, false);
  assert.equal(root.dataset.theme, "escuro");
});

test("tema do sistema acompanha claro e escuro e a escolha explícita tem prioridade", () => {
  const root = { dataset: {} };
  applyAppearance({ tema: "sistema", fonte: "grande", cor: "ameixa", reduzirMovimento: true }, root, true);
  assert.deepEqual(root.dataset, { theme: "escuro", fontSize: "grande", accent: "ameixa", reduceMotion: "true", highContrast: "false" });
  applyAppearance({ tema: "sistema" }, root, false);
  assert.equal(root.dataset.theme, "claro");
  applyAppearance({ tema: "claro" }, root, true);
  assert.equal(root.dataset.theme, "claro");
});

test("alto contraste preserva preferências antigas e pode ser ligado e desligado", () => {
  const previous = { tema: "sistema", fonte: "grande", cor: "azul" };
  assert.equal(normalizeAppearance(previous).altoContraste, false);
  assert.equal(normalizeAppearance({ altoContraste: "true" }).altoContraste, false);
  const root = { dataset: {} };
  applyAppearance({ ...previous, altoContraste: true }, root, true);
  assert.equal(root.dataset.highContrast, "true");
  assert.equal(root.dataset.accent, "azul");
  assert.equal(root.dataset.theme, "escuro");
  applyAppearance(previous, root, false);
  assert.equal(root.dataset.highContrast, "false");
  assert.equal(root.dataset.theme, "claro");
});
