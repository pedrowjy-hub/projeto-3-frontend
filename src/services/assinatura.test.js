import test from "node:test";
import assert from "node:assert/strict";
import { hasActivePremium } from "./assinatura.js";

test("acesso Premium exige assinatura ativa com data válida", () => {
  const now = new Date(2026, 9, 28, 12).getTime();
  for (const tipo_perfil of ["empresa", "influenciador"]) {
    const profile = { tipo_perfil, assinatura: true, expiracao_assinatura: "28-10-2026" };
    assert.equal(hasActivePremium(profile, now), true);
    assert.equal(hasActivePremium({ ...profile, assinatura: false }, now), false);
    assert.equal(hasActivePremium({ ...profile, expiracao_assinatura: "27-10-2026" }, now), false);
    assert.equal(hasActivePremium({ ...profile, expiracao_assinatura: "31-02-2027" }, now), false);
    assert.equal(hasActivePremium({ ...profile, expiracao_assinatura: null }, now), false);
    assert.equal(hasActivePremium({ ...profile, assinatura: "true" }, now), false);
  }
  assert.equal(hasActivePremium(null, now), false);
});

test("validade UTC tem prioridade sobre data legada e termina no instante exato", () => {
  const end = Date.parse("2030-02-28T12:30:00Z");
  const profile = { assinatura: true, premium_ate: "2030-02-28T09:30:00-03:00", expiracao_assinatura: "31-12-2099" };
  assert.equal(hasActivePremium(profile, end - 1), true);
  assert.equal(hasActivePremium(profile, end), false);
  assert.equal(hasActivePremium({ ...profile, premium_ate: null }, end - 1), false);
  assert.equal(hasActivePremium({ ...profile, premium_ate: "2030-02-28T12:30:00" }, end - 1), false);
});
