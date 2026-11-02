import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_APPEARANCE, accountAppearanceKey, readAccountAppearance, appearanceOwner } from "./aparencia.js";
import { createAppearanceSync } from "./sincronizarAparencia.js";

const response = preferences => ({ ok: true, json: async () => ({ preferencias: preferences }) });
function memory() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }

test("consulta remota tem prioridade sobre cache antigo do mesmo usuário", async t => {
  const storage = memory(), states = [];
  storage.setItem(accountAppearanceKey("ana"), JSON.stringify({ preferences: { cor: "verde" }, pending: {} }));
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.headers.Authorization, "Bearer token-ana");
    return response({ ...DEFAULT_APPEARANCE, tema: "escuro", cor: "azul" });
  });
  const sync = createAppearanceSync({ token: "token-ana", username: "ana", storage, onChange: value => states.push(value) });
  await sync.refresh();
  assert.equal(states.at(-1).preferences.tema, "escuro");
  assert.equal(states.at(-1).preferences.cor, "azul");
  assert.equal(states.at(-1).error, "");
  sync.stop();
});

test("edição durante a consulta não é sobrescrita e PATCH envia apenas campos alterados", async t => {
  const initial = deferred(), storage = memory(), calls = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    if (options.method === "GET") return initial.promise;
    calls.push(JSON.parse(options.body));
    return response({ ...DEFAULT_APPEARANCE, tema: "escuro", fonte: "grande", ...calls.at(-1) });
  });
  const sync = createAppearanceSync({ token: "token", username: "ana", storage, onChange() {} });
  const loading = sync.refresh();
  await sync.update({ cor: "azul" });
  initial.resolve(response({ ...DEFAULT_APPEARANCE, tema: "escuro", fonte: "grande" }));
  await loading;
  assert.deepEqual(calls, [{ cor: "azul" }]);
  assert.equal(sync.snapshot().preferences.cor, "azul");
  assert.equal(sync.snapshot().preferences.fonte, "grande");
  sync.stop();
});

test("cliques rápidos são gravados em sequência sem reverter a escolha mais recente", async t => {
  const first = deferred(), patches = [], storage = memory();
  let remote = { ...DEFAULT_APPEARANCE };
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    if (options.method === "GET") return response(remote);
    const patch = JSON.parse(options.body);
    patches.push(patch);
    if (patches.length === 1) await first.promise;
    remote = { ...remote, ...patch };
    return response(remote);
  });
  const sync = createAppearanceSync({ token: "token", username: "ana", storage, onChange() {} });
  await sync.refresh();
  const saving = sync.update({ tema: "escuro" });
  await sync.update({ tema: "claro", altoContraste: true });
  assert.equal(patches.length, 1);
  first.resolve();
  await saving;
  assert.deepEqual(patches, [{ tema: "escuro" }, { tema: "claro", altoContraste: true }]);
  assert.equal(remote.tema, "claro");
  assert.equal(remote.altoContraste, true);
  assert.deepEqual(sync.snapshot().pending, {});
  sync.stop();
});

test("falha fica pendente no cache e é reenviada ao recuperar a conexão", async t => {
  const storage = memory(), states = [];
  let failing = true, remote = { ...DEFAULT_APPEARANCE };
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    if (options.method === "GET") return response(remote);
    if (failing) return { ok: false, status: 503, json: async () => ({ erro: "Banco indisponível" }) };
    remote = { ...remote, ...JSON.parse(options.body) };
    return response(remote);
  });
  const sync = createAppearanceSync({ token: "token", username: "ana", storage, onChange: value => states.push(value) });
  await sync.refresh();
  await sync.update({ fonte: "maior" });
  assert.equal(states.at(-1).error, "Banco indisponível");
  assert.deepEqual(readAccountAppearance(storage, "ana").pending, { fonte: "maior" });
  failing = false;
  await sync.refresh();
  assert.equal(remote.fonte, "maior");
  assert.equal(states.at(-1).error, "");
  assert.deepEqual(readAccountAppearance(storage, "ana").pending, {});
  sync.stop();
});

test("resposta antiga não altera a conta seguinte e caches são separados", async t => {
  const storage = memory(), oldResponse = deferred(), statesA = [], statesB = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => options.headers.Authorization === "Bearer ana"
    ? oldResponse.promise : response({ ...DEFAULT_APPEARANCE, cor: "ameixa" }));
  const ana = createAppearanceSync({ token: "ana", username: "ana", storage, onChange: state => statesA.push(state) });
  const pending = ana.refresh();
  ana.stop();
  const before = statesA.length;
  const bia = createAppearanceSync({ token: "bia", username: "bia", storage, onChange: state => statesB.push(state) });
  await bia.refresh();
  oldResponse.resolve(response({ ...DEFAULT_APPEARANCE, cor: "azul" }));
  await pending;
  assert.equal(statesA.length, before);
  assert.equal(statesB.at(-1).preferences.cor, "ameixa");
  assert.equal(readAccountAppearance(storage, "ana").preferences.cor, "verde");
  assert.equal(readAccountAppearance(storage, "bia").preferences.cor, "ameixa");
  bia.stop();
});

test("cache não compartilhado com token ausente, inválido ou outra conta", () => {
  assert.equal(appearanceOwner(null), null);
  assert.equal(appearanceOwner("inválido"), null);
  const token = `header.${Buffer.from(JSON.stringify({ sub: "ana" })).toString("base64url")}.signature`;
  assert.equal(appearanceOwner(token), "ana");
  const storage = memory();
  storage.setItem("nexo:aparencia:v1", JSON.stringify({ tema: "escuro" }));
  assert.deepEqual(readAccountAppearance(storage, "bia").preferences, DEFAULT_APPEARANCE);
});
