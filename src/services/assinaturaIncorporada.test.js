import test from "node:test";
import assert from "node:assert/strict";
import { abrirAssinatura } from "./assinaturaIncorporada.js";

const data = () => ({ test_mode: true, client_id: "a".repeat(40), expires_at: Math.floor(Date.now() / 1000) + 60,
  sign_url: "https://app.hellosign.com/editor/embeddedSign?signature_id=abc&token=temporario" });

test("SDK abre em teste e eventos solicitam confirmação sem conceder assinatura", async () => {
  let instance, signs = 0, closes = 0;
  class Client {
    constructor() { instance = this; this.handlers = {}; }
    on(name, fn) { this.handlers[name] = fn; }
    open(url, options) { this.url = url; this.options = options; }
    close() { this.closed = true; this.handlers.close(); }
  }
  const cleanup = await abrirAssinatura(data(), { onSign: () => signs++, onClose: () => closes++ }, Client);
  assert.deepEqual(instance.options, { clientId: "a".repeat(40), skipDomainVerification: true, debug: false });
  instance.handlers.sign();
  assert.equal(signs, 1);
  assert.equal(closes, 0);
  cleanup();
  assert.equal(instance.closed, true);
  instance.handlers.sign();
  assert.equal(signs, 1);
  assert.equal(closes, 0);
});

test("URLs externas, credenciais, expiração e produção nunca abrem iframe", async () => {
  class Forbidden { constructor() { assert.fail("Não deveria criar o SDK"); } }
  for (const changes of [ { test_mode: false }, { client_id: "" }, { expires_at: 1 },
    { sign_url: "https://example.test/editor/embeddedSign?signature_id=x&token=y" },
    { sign_url: "https://user:password@app.hellosign.com/editor/embeddedSign?signature_id=x&token=y" } ]) {
    await assert.rejects(abrirAssinatura({ ...data(), ...changes }, {}, Forbidden));
  }
  await abrirAssinatura(data(), { isActive: () => false }, Forbidden);
});
