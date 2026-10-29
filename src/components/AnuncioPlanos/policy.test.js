import test from "node:test";
import assert from "node:assert/strict";
import { hasPremium, PROMO_INTERVAL, shouldShowPromo } from "./policy.js";

test("anúncio somente a cada terceira visita", () => {
  for (let visits = 0; visits <= 9; visits++) {
    assert.equal(shouldShowPromo({ visits }, 100000), [3, 6, 9].includes(visits));
  }
});

test("respeita sete dias mesmo em uma visita elegível", () => {
  const lastShown = 100000;
  assert.equal(shouldShowPromo({ visits: 6, lastShown }, lastShown + PROMO_INTERVAL - 1), false);
  assert.equal(shouldShowPromo({ visits: 6, lastShown }, lastShown + PROMO_INTERVAL), true);
});

test("Premium ativo não recebe anúncio, incluindo todo o último dia", () => {
  const account = { assinatura: true, expiracao_assinatura: "28-10-2026" };
  assert.equal(hasPremium(account, new Date(2026, 9, 28, 23, 59, 59).getTime()), true);
  assert.equal(hasPremium(account, new Date(2026, 9, 29).getTime()), false);
  assert.equal(hasPremium({ assinatura: false }, Date.now()), false);
  assert.equal(hasPremium({ assinatura: true }, Date.now()), true);
});
