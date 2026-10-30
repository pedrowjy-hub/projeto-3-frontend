export function getProfileLocation(profile) {
  const location = profile.localizacao;
  if (typeof location === "string" && location.trim()) return location.trim();
  const structured = location && typeof location === "object" ? location : profile;
  return [structured.cidade, structured.estado]
    .filter(value => typeof value === "string" && value.trim())
    .map(value => value.trim())
    .join(", ");
}
