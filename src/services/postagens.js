export const MAX_MEDIA_SIZE = 8 * 1024 * 1024;
export const MAX_MEDIA_FILES = 3;

async function readResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 || response.status === 422 && data?.msg) {
      throw new Error("Sua sessão expirou. Entre novamente para publicar.");
    }
    throw new Error(data?.erro || "Não foi possível concluir a solicitação. Tente novamente.");
  }
  return data;
}

export async function listarPostagens(signal) {
  const response = await fetch("/api/postagens", { signal });
  const data = await readResponse(response);
  if (!Array.isArray(data)) throw new Error("Não foi possível carregar as postagens.");
  return data.sort((a, b) => new Date(b.criada_em) - new Date(a.criada_em));
}

export async function criarPostagem({ titulo, descricao, midia }, token) {
  if (!titulo.trim() || !descricao.trim()) throw new Error("Preencha o título e a descrição.");
  const files = Array.isArray(midia) ? midia : midia ? [midia] : [];
  if (!files.length || files.some(file => file.size === 0)) throw new Error("Selecione arquivos de mídia não vazios.");
  if (files.length > MAX_MEDIA_FILES) throw new Error("Adicione no máximo três arquivos por postagem.");
  if (files.some(file => file.size > MAX_MEDIA_SIZE)) throw new Error("Cada arquivo deve ter no máximo 8 MB.");
  if (!token) throw new Error("Sua sessão expirou. Entre novamente para publicar.");
  const body = new FormData();
  body.append("titulo", titulo.trim());
  body.append("descricao", descricao.trim());
  files.forEach(file => body.append("midia", file));
  const response = await fetch("/api/postagens", {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body,
  });
  const data = await readResponse(response);
  if (!data?.postagem?.id) throw new Error("A resposta da publicação é inválida. Atualize a lista antes de tentar novamente.");
  return data.postagem;
}

export function urlMidia(id, index = 0) {
  return `/api/postagens/${encodeURIComponent(id)}/midia/${index}`;
}
