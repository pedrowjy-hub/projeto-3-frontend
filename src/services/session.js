export async function getSession(token) {
  const response = await fetch("/api/admin", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.ok) return { papel: "admin" };
  if (response.status !== 403) {
    const error = new Error(response.status === 401 || response.status === 422
      ? "Sua sessão expirou. Entre novamente."
      : "Não foi possível verificar sua sessão.");
    error.status = response.status;
    throw error;
  }
  // O token identifica o perfil; a autorização administrativa é feita pela API acima.
  const segment = token.split(".")[1];
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const payload = JSON.parse(new TextDecoder().decode(
    Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")), c => c.charCodeAt(0)),
  ));
  const profileResponse = await fetch(`/api/usuarios/${encodeURIComponent(payload.sub)}`);
  if (!profileResponse.ok) throw new Error("Não foi possível carregar seu perfil.");
  const profile = await profileResponse.json();
  if (!["empresa", "influenciador"].includes(profile.tipo_perfil)) {
    throw new Error("Seu perfil precisa ser definido como empresa ou influenciador.");
  }
  return { ...profile, papel: "usuario" };
}
