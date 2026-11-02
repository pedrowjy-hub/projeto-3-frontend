export const limparUsername = value => value.trim().replace(/^@/, "");

export async function buscarPerfil(username, signal) {
  const name = limparUsername(username);
  if (!name) throw new Error("Digite o nome de usuário do perfil.");
  const response = await fetch(`/api/usuarios/${encodeURIComponent(name)}`, { signal });
  if (response.status === 404) throw new Error("Usuário não encontrado. Confira o username digitado.");
  if (!response.ok) throw new Error("Não foi possível consultar o perfil. Tente novamente.");
  const profile = await response.json();
  if (!profile?.username) throw new Error("O servidor retornou um perfil inválido.");
  return profile;
}

export async function prepararFoto(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Escolha uma foto JPG, PNG ou WebP.");
  if (file.size > 5 * 1024 * 1024) throw new Error("A foto deve ter no máximo 5 MB.");
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error("Não foi possível abrir essa imagem."); });
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d");
    const side = Math.min(bitmap.width, bitmap.height);
    context.fillStyle = "#fffef8"; context.fillRect(0, 0, 512, 512);
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 512, 512);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally { bitmap.close(); }
}


const normalizarBusca = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();

export function filtrarSugestoes(perfis, busca, tipoPerfil, usernameAtual) {
  const termo = normalizarBusca(limparUsername(busca));
  if (!termo) return [];
  return perfis.filter(perfil => perfil.username && perfil.username !== usernameAtual
    && perfil.tipo_perfil === tipoPerfil && perfil.ativo !== false && perfil.papel !== "admin"
    && [perfil.nome, perfil.username].some(valor => normalizarBusca(valor).includes(termo)))
    .sort((a, b) => {
      const prioridade = perfil => normalizarBusca(perfil.username) === termo ? 0
        : normalizarBusca(perfil.username).startsWith(termo) ? 1 : 2;
      return prioridade(a) - prioridade(b) || (a.nome || a.username).localeCompare(b.nome || b.username, "pt-BR");
    }).slice(0, 8);
}

export async function listarPerfis(tipoPerfil, signal) {
  const response = await fetch(`/api/usuarios?tipo_perfil=${encodeURIComponent(tipoPerfil)}`, { signal });
  if (!response.ok) throw new Error("Não foi possível carregar as sugestões. Tente novamente.");
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Não foi possível carregar as sugestões. Tente novamente.");
  return data;
}
