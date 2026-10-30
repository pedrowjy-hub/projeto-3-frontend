import test from "node:test";
import assert from "node:assert/strict";
import { getSession } from "./session.js";

test("sessão usa dados autenticados para preservar o plano e sua validade", async t => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.headers.Authorization, "Bearer token_teste");
    if (url === "/api/admin") return { ok: false, status: 403 };
    assert.equal(url, "/api/me");
    return { ok: true, json: async () => ({ username: "ana", tipo_perfil: "empresa", assinatura: true,
      premium_ate: "2030-02-28T12:30:00Z", cancelamento_agendado: true }) };
  });
  const profile = await getSession("token_teste");
  assert.equal(profile.assinatura, true);
  assert.equal(profile.premium_ate, "2030-02-28T12:30:00Z");
  assert.equal(profile.cancelamento_agendado, true);
  assert.equal(profile.papel, "usuario");
});

test("conta gratuita permanece sem assinatura na sessão", async t => {
  t.mock.method(globalThis, "fetch", async url => url === "/api/admin"
    ? { ok: false, status: 403 }
    : { ok: true, json: async () => ({ username: "bia", tipo_perfil: "influenciador", assinatura: false }) });
  assert.equal((await getSession("token_teste")).assinatura, false);
});

test("sessão expirada na consulta privada preserva o erro de autenticação", async t => {
  t.mock.method(globalThis, "fetch", async url => ({ ok: false, status: url === "/api/admin" ? 403 : 401 }));
  await assert.rejects(getSession("token_teste"), error => error.status === 401);
});

test("administrador segue para o fluxo administrativo", async t => {
  t.mock.method(globalThis, "fetch", async url => {
    assert.equal(url, "/api/admin");
    return { ok: true };
  });
  assert.deepEqual(await getSession("token_teste"), { papel: "admin" });
});
