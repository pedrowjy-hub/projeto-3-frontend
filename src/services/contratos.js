async function api(path = "", { token, method = "GET", body, signal } = {}) {
  if (!token) { const error = new Error("Entre novamente para acessar seus contratos."); error.status = 401; throw error; }
  const multipart = body instanceof FormData;
  const response = await fetch(`/api/contratos${path}`, { method, signal,
    headers: { Authorization: `Bearer ${token}`, ...(!multipart && body !== undefined ? { "Content-Type": "application/json" } : {}) },
    ...(body !== undefined ? { body: multipart ? body : JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.erro || "Não foi possível concluir a operação do contrato.");
    error.status = response.status;
    throw error;
  }
  return response;
}

export async function listarContratos(token, signal, chatId) {
  const data = await (await api(chatId ? `?chat_id=${encodeURIComponent(chatId)}` : "", { token, signal })).json();
  if (!Array.isArray(data)) throw new Error("O servidor retornou uma lista de contratos inválida.");
  return data;
}

export async function criarContrato(token, { titulo, chatId, documento }) {
  const body = new FormData();
  body.append("titulo", titulo); body.append("chat_id", chatId); body.append("documento", documento);
  return (await api("", { token, method: "POST", body })).json();
}

export async function aprovarContrato(token, id, sha256) {
  return (await api(`/${encodeURIComponent(id)}/aprovar`, { token, method: "POST", body: { sha256 } })).json();
}

export async function acessoAssinatura(token, id) {
  return (await api(`/${encodeURIComponent(id)}/assinar`, { token, method: "POST", body: {} })).json();
}

export async function enviarContrato(token, id) {
  return (await api(`/${encodeURIComponent(id)}/enviar`, { token, method: "POST", body: {} })).json();
}

export async function sincronizarContrato(token, id) {
  return (await api(`/${encodeURIComponent(id)}/sincronizar`, { token, method: "POST", body: {} })).json();
}

export async function baixarContrato(token, id, tipo) {
  const response = await api(`/${encodeURIComponent(id)}/documento?tipo=${tipo === "assinado" ? "assinado" : "original"}`, { token });
  return response.blob();
}
