export const statusDenuncia = { pendente: "Pendente", em_analise: "Em análise", concluida: "Concluída" };

async function request(path, { signal, method = "GET", body } = {}) {
  const token = localStorage.getItem("access_token");
  if (!token) throw Object.assign(new Error("Sua sessão expirou. Entre novamente."), { status: 401 });
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, signal,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(method === "POST" ? "A conexão falhou. Atualize o histórico antes de tentar enviar novamente, para verificar se a denúncia foi recebida." : "Não foi possível conectar ao servidor. Tente novamente.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status === 401 || response.status === 422
      ? "Sua sessão expirou. Entre novamente."
      : response.status === 403 ? "Você não tem permissão para acessar estas denúncias."
      : data?.erro || "Não foi possível acessar o serviço de denúncias. Confira se o backend está atualizado.";
    throw Object.assign(new Error(message), { status: response.status });
  }
  return data;
}

export async function listarDenuncias(admin = false, signal) {
  const data = await request(admin ? "/admin/denuncias" : "/denuncias", { signal });
  if (!Array.isArray(data)) throw new Error("O servidor retornou uma lista de denúncias inválida.");
  return data;
}

export async function enviarDenuncia(form) {
  const data = await request("/denuncias", { method: "POST", body: {
    denunciado: form.username, motivo: form.motivo, descricao: form.descricao.trim(),
  } });
  if (!data?.denuncia?.id) throw new Error("Resposta inesperada. Atualize o histórico antes de tentar enviar novamente.");
  return data.denuncia;
}

export async function salvarAnalise(id, status, resposta) {
  const data = await request(`/admin/denuncias/${encodeURIComponent(id)}`, { method: "PATCH", body: { status, resposta: resposta.trim() } });
  if (!data?.denuncia?.id) throw new Error("Resposta inesperada. Atualize a lista para conferir a análise.");
  return data.denuncia;
}
