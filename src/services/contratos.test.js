import test from "node:test";
import assert from "node:assert/strict";
import { criarContrato, enviarContrato, listarContratos, sincronizarContrato, baixarContrato, aprovarContrato, acessoAssinatura } from "./contratos.js";

test("rascunho envia somente título, conversa e PDF sem aceitar identidade ou modo do cliente", async t => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/contratos");
    assert.equal(options.headers.Authorization, "Bearer token");
    assert.equal(options.headers["Content-Type"], undefined);
    assert.deepEqual([...options.body.keys()], ["titulo", "chat_id", "documento"]);
    assert.equal(options.body.get("chat_id"), "chat");
    return new Response(JSON.stringify({ id: "contrato", status: "rascunho" }), { status: 201 });
  });
  const data = await criarContrato("token", { titulo: "Teste", chatId: "chat", documento: new Blob(["%PDF-1.4"]), email: "alheio@example.test", test_mode: false });
  assert.equal(data.status, "rascunho");
});

test("envio e consulta de status não permitem sobrescrever dados do contrato", async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push(url);
    assert.equal(options.method, "POST");
    assert.equal(options.body, "{}");
    return new Response(JSON.stringify({ id: "id", status: "aguardando_assinaturas" }));
  });
  await enviarContrato("token", "id");
  await sincronizarContrato("token", "id");
  assert.deepEqual(calls, ["/api/contratos/id/enviar", "/api/contratos/id/sincronizar"]);
});

test("download preserva erro de PDF em preparação e autenticação expirada", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ erro: "Preparando PDF" }), { status: 409 }));
  await assert.rejects(baixarContrato("token", "id", "assinado"), error => error.status === 409 && error.message === "Preparando PDF");
  await assert.rejects(enviarContrato(null, "id"), error => error.status === 401);
});

test("lista inválida e falha do servidor não viram sucesso ou lista vazia", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ inesperado: true })));
  await assert.rejects(listarContratos("token"), /lista de contratos inválida/);
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ erro: "Indisponível" }), { status: 503 }));
  await assert.rejects(enviarContrato("token", "id"), /Indisponível/);
});


test("aprovação identifica a versão e acesso à assinatura não aceita identidade do cliente", async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push([url, JSON.parse(options.body)]);
    return new Response(JSON.stringify({ ok: true }));
  });
  await aprovarContrato("token", "id", "hash");
  await acessoAssinatura("token", "id");
  assert.deepEqual(calls, [["/api/contratos/id/aprovar", { sha256: "hash" }], ["/api/contratos/id/assinar", {}]]);
});
