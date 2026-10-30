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
  // A conta autenticada inclui o plano; o perfil público não expõe a assinatura.
  const profileResponse = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!profileResponse.ok) {
    const error = new Error([401, 422].includes(profileResponse.status)
      ? "Sua sessão expirou. Entre novamente." : "Não foi possível carregar seu perfil.");
    error.status = profileResponse.status;
    throw error;
  }
  const profile = await profileResponse.json();
  if (!["empresa", "influenciador"].includes(profile.tipo_perfil)) {
    throw new Error("Seu perfil precisa ser definido como empresa ou influenciador.");
  }
  return { ...profile, papel: "usuario" };
}
