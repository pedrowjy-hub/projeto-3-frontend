import test from "node:test";
import assert from "node:assert/strict";
import { buscarPerfil, limparUsername, prepararFoto } from "./perfis.js";

test("busca username exato com ou sem arroba, sem listar todos os perfis", async t => {
  t.mock.method(globalThis, "fetch", async url => {
    assert.equal(url, "/api/usuarios/ana.creator");
    return Response.json({ username: "ana.creator", tipo_perfil: "influenciador" });
  });
  assert.equal(limparUsername(" @ana.creator "), "ana.creator");
  assert.equal((await buscarPerfil(" @ana.creator ")).username, "ana.creator");
});

test("perfil inexistente exibe erro e não cria seleção", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({}, { status: 404 }));
  await assert.rejects(buscarPerfil("inexistente"), /Usuário não encontrado/);
});

test("busca vazia e fotos inválidas são recusadas", async t => {
  t.mock.method(globalThis, "fetch", () => assert.fail("Não deve consultar username vazio"));
  await assert.rejects(buscarPerfil(" @ "), /Digite/);
  await assert.rejects(prepararFoto({ type: "image/svg+xml", size: 10 }), /JPG/);
  await assert.rejects(prepararFoto({ type: "image/jpeg", size: 6 * 1024 * 1024 }), /5 MB/);
});
