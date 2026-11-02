import test from "node:test";
import assert from "node:assert/strict";
import { iniciarConversa, enviarMensagem, lerMensagens, listarConversas } from "./conversas.js";

test("conversa e mensagem enviam somente parceiro ou texto, com JWT", async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.headers.Authorization, "Bearer token");
    calls.push([url, JSON.parse(options.body)]);
    return new Response(JSON.stringify({ id: "chat" }));
  });
  await iniciarConversa("token", "creator");
  await enviarMensagem("token", "chat", "Aceito");
  assert.deepEqual(calls, [["/api/conversas", { parceiro: "creator" }], ["/api/conversas/chat/mensagens", { mensagem: "Aceito" }]]);
});

test("chat preserva erros de autorização e rejeita histórico inválido", async t => {
  await assert.rejects(listarConversas(null), error => error.status === 401);
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ erro: "Premium necessário" }), { status: 403 }));
  await assert.rejects(lerMensagens("token", "chat"), error => error.status === 403);
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ mensagens: "inválido" })));
  await assert.rejects(lerMensagens("token", "chat"), /carregar as mensagens/);
});
