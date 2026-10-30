export function subscriptionDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && /(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value !== "string" || !/^\d{2}-\d{2}-\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year ? date : null;
}

export function premiumExpiration(profile) {
  return subscriptionDate(profile && "premium_ate" in profile ? profile.premium_ate : profile?.expiracao_assinatura);
}

export function hasActivePremium(profile, now) {
  const expiration = premiumExpiration(profile);
  return profile?.assinatura === true && expiration !== null && expiration.getTime() > now;
}
