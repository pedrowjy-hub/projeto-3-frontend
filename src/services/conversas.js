async function api(token, path = "", { method = "GET", body, signal } = {}) {
  if (!token) { const error = new Error("Entre novamente para acessar suas mensagens."); error.status = 401; throw error; }
  const response = await fetch(`/api/conversas${path}`, { method, signal,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) { const error = new Error(data?.erro || "Não foi possível atualizar a conversa."); error.status = response.status; throw error; }
  if (!data || typeof data !== "object") throw new Error("O servidor retornou uma conversa inválida.");
  return data;
}
export async function listarConversas(token, signal) {
  const data = await api(token, "", { signal });
  if (!Array.isArray(data)) throw new Error("Não foi possível carregar suas conversas.");
  return data;
}
export function iniciarConversa(token, parceiro) { return api(token, "", { method: "POST", body: { parceiro } }); }
export async function lerMensagens(token, id, signal) {
  const data = await api(token, `/${encodeURIComponent(id)}/mensagens`, { signal });
  if (!Array.isArray(data.mensagens)) throw new Error("Não foi possível carregar as mensagens.");
  return data;
}
export function enviarMensagem(token, id, mensagem) { return api(token, `/${encodeURIComponent(id)}/mensagens`, { method: "POST", body: { mensagem } }); }
