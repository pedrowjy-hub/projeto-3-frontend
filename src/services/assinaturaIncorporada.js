export async function abrirAssinatura(data, handlers = {}, Client) {
  if (data?.test_mode !== true || typeof data.client_id !== "string" || !/^[a-f0-9]{32,64}$/i.test(data.client_id)) {
    throw new Error("A assinatura de teste ainda não está configurada.");
  }
  let url;
  try { url = new URL(data.sign_url); } catch { throw new Error("O acesso à assinatura é inválido."); }
  if (url.protocol !== "https:" || !["app.hellosign.com", "app.sign.dropbox.com"].includes(url.hostname)
      || url.username || url.password || (url.port && url.port !== "443") || url.pathname !== "/editor/embeddedSign"
      || !url.searchParams.get("signature_id") || !url.searchParams.get("token") || !Number.isFinite(data.expires_at) || data.expires_at * 1000 <= Date.now()) {
    throw new Error("O acesso à assinatura é inválido ou expirou. Tente abri-la novamente.");
  }
  const Constructor = Client || (await import("hellosign-embedded")).default;
  if (handlers.isActive && !handlers.isActive()) return () => {};
  const client = new Constructor();
  let active = true;
  client.on("sign", () => { if (active) handlers.onSign?.(); });
  client.on("error", () => { if (active) handlers.onError?.(new Error("Não foi possível concluir a assinatura. Feche a janela e tente novamente.")); });
  client.on("close", () => { if (active) { active = false; handlers.onClose?.(); } });
  client.open(url.href, { clientId: data.client_id, skipDomainVerification: true, debug: false });
  return () => { active = false; client.close(); };
}
