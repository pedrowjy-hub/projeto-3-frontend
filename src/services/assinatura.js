export function subscriptionDate(value) {
  if (typeof value !== "string" || !/^\d{2}-\d{2}-\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year ? date : null;
}

export function hasActivePremium(profile, now) {
  const expiration = subscriptionDate(profile?.expiracao_assinatura);
  return profile?.assinatura === true && expiration !== null && expiration.getTime() >= now;
}
