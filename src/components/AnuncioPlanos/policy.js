export const PROMO_INTERVAL = 7 * 24 * 60 * 60 * 1000;

export function shouldShowPromo({ visits, lastShown = 0 }, now) {
  return visits > 0 && visits % 3 === 0 && (!lastShown || now - lastShown >= PROMO_INTERVAL);
}

export function hasPremium(account, now) {
  if (account.assinatura !== true) return false;
  // Sem uma validade conhecida, evite anunciar para quem consta como assinante.
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(account.expiracao_assinatura || "");
  if (!match) return true;
  const [, day, month, year] = match;
  const expiration = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
  return expiration.getTime() >= now;
}
