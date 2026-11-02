async function requisicaoSenha(path, body, { method = "POST", token } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.erro || "Não foi possível concluir a solicitação.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export function solicitarRecuperacao(email) {
  return requisicaoSenha("/recuperar-senha", { email });
}

export function redefinirSenha(token, nova_senha) {
  return requisicaoSenha("/redefinir-senha", { token, nova_senha });
}

export function alterarSenha(token, senha_atual, nova_senha) {
  return requisicaoSenha("/usuarios/me/senha", { senha_atual, nova_senha }, { method: "PATCH", token });
}
