import test from "node:test";
import assert from "node:assert/strict";
import { listarDenuncias, enviarDenuncia, salvarAnalise } from "./denuncias.js";

function setup(t, handler, token = "token-teste") {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => token } });
  t.after(() => { if (previous) Object.defineProperty(globalThis, "localStorage", previous); else delete globalThis.localStorage; });
  t.mock.method(globalThis, "fetch", handler);
}

test("envia somente campos permitidos e autentica com token", async t => {
  setup(t, async (url, options) => {
    assert.equal(url, "/api/denuncias");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer token-teste");
    assert.deepEqual(JSON.parse(options.body), { denunciado: "marca", motivo: "Spam", descricao: "Relato completo do ocorrido." });
    return Response.json({ denuncia: { id: "123", status: "pendente" } }, { status: 201 });
  });
  assert.equal((await enviarDenuncia({ username: "marca", motivo: "Spam", descricao: " Relato completo do ocorrido. ", denunciante: "falso" })).id, "123");
});

test("históricos usam rotas distintas e aceitam cancelamento", async t => {
  const signal = new AbortController().signal;
  const urls = [];
  setup(t, async (url, options) => { urls.push(url); assert.equal(options.signal, signal); return Response.json([]); });
  await listarDenuncias(false, signal); await listarDenuncias(true, signal);
  assert.deepEqual(urls, ["/api/denuncias", "/api/admin/denuncias"]);
});

test("salva análise e preserva erro de concorrência do backend", async t => {
  setup(t, async (url, options) => {
    assert.equal(url, "/api/admin/denuncias/123");
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), { status: "concluida", resposta: "Resolvido." });
    return Response.json({ erro: "A denúncia foi alterada. Atualize a lista." }, { status: 409 });
  });
  await assert.rejects(salvarAnalise("123", "concluida", " Resolvido. "), error => error.status === 409 && error.message.includes("Atualize"));
});

test("token ausente não dispara requisição", async t => {
  setup(t, () => assert.fail("Não deve enviar sem token"), null);
  await assert.rejects(listarDenuncias(), error => error.status === 401);
});

test("sessão expirada e falta de permissão não viram lista vazia", async t => {
  let status = 401;
  setup(t, async () => Response.json({}, { status }));
  await assert.rejects(listarDenuncias(), error => error.status === 401);
  status = 403;
  await assert.rejects(listarDenuncias(true), error => error.status === 403);
});

test("respostas inválidas e falhas de rede não são sucesso", async t => {
  setup(t, async () => Response.json({}));
  await assert.rejects(listarDenuncias(), /inválida/);
  await assert.rejects(enviarDenuncia({ descricao: "relato" }), /Atualize o histórico/);
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("offline"); });
  await assert.rejects(enviarDenuncia({ descricao: "relato" }), /verificar se a denúncia foi recebida/);
});
