import test from "node:test";
import assert from "node:assert/strict";
import { createCheckout, openSandboxCheckout, cancelRenewal } from "./pagamentos.js";

test("checkout enviado sem preço ou usuário controlados pelo cliente", async t => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/usuarios/me/assinatura/checkout");
    assert.equal(options.method, "POST");
    assert.equal(options.body, "{}");
    assert.equal(options.headers.Authorization, "Bearer token_teste");
    return { ok: true, json: async () => ({ environment: "sandbox" }) };
  });
  assert.deepEqual(await createCheckout("token_teste"), { environment: "sandbox" });
});

test("erro de sessão preserva status para redirecionamento ao login", async t => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 401, json: async () => ({ erro: "Sessão expirada" }) }));
  await assert.rejects(createCheckout("token_teste"), error => error.status === 401);
});

test("cancelamento usa identidade do token e preserva estado do período pago", async t => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/usuarios/me/assinatura/cancelamento");
    assert.equal(options.body, "{}");
    assert.equal(options.headers.Authorization, "Bearer token_teste");
    return { ok: true, json: async () => ({ assinatura: true, cancelamento_agendado: true, premium_ate: "2030-02-28T12:30:00Z" }) };
  });
  const state = await cancelRenewal("token_teste");
  assert.equal(state.assinatura, true);
  assert.equal(state.cancelamento_agendado, true);
});

test("erro de cancelamento não é apresentado como sucesso", async t => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 502, json: async () => ({ erro: "Provedor indisponível" }) }));
  await assert.rejects(cancelRenewal("token_teste"), error => error.status === 502 && error.message === "Provedor indisponível");
});

test("não abre checkout de produção ou sem identificador válido", async () => {
  for (const checkout of [
    { environment: "live", client_token: "test_token", transaction_id: "txn_" + "a".repeat(26) },
    { environment: "sandbox", client_token: "live_token", transaction_id: "txn_" + "a".repeat(26) },
    { environment: "sandbox", client_token: "test_token", transaction_id: "invalido" },
  ]) await assert.rejects(openSandboxCheckout(checkout, () => {}), /bloqueado/);
});

test("SDK abre a transação do servidor em sandbox e inicializa uma única vez", async t => {
  const calls = [];
  let dispatch;
  const original = globalThis.window;
  globalThis.window = { Paddle: {
    Environment: { set: environment => calls.push(["environment", environment]) },
    Initialize: options => { calls.push(["initialize", options.token]); dispatch = options.eventCallback; },
    Checkout: { open: options => calls.push(["open", options]), close: () => calls.push(["close"]) },
  } };
  t.after(() => { globalThis.window = original; });
  const events = [];
  const checkout = { environment: "sandbox", client_token: "test_token", transaction_id: "txn_" + "a".repeat(26) };
  const cleanup = await openSandboxCheckout(checkout, event => events.push(event.name));
  dispatch({ name: "checkout.completed" });
  assert.deepEqual(events, ["checkout.completed"]);
  assert.deepEqual(calls[0], ["environment", "sandbox"]);
  assert.equal(calls[2][1].transactionId, checkout.transaction_id);
  assert.deepEqual(calls[2][1].settings.allowedPaymentMethods, ["card"]);
  cleanup();
  dispatch({ name: "checkout.closed" });
  assert.deepEqual(events, ["checkout.completed"]);
  await openSandboxCheckout(checkout, () => {});
  assert.equal(calls.filter(([type]) => type === "initialize").length, 1);
});
