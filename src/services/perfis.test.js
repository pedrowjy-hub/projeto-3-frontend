import test from "node:test";
import assert from "node:assert/strict";
import { buscarPerfil, limparUsername, prepararFoto, filtrarSugestoes, listarPerfis } from "./perfis.js";

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


test("sugestões buscam nome ou username sem diferenciar acentos e maiúsculas", () => {
  const perfis = [
    { username: "joao.criador", nome: "João Silva", tipo_perfil: "influenciador" },
    { username: "maria", nome: "Maria Souza", tipo_perfil: "influenciador" },
  ];
  assert.deepEqual(filtrarSugestoes(perfis, "JOAO", "influenciador", "empresa"), [perfis[0]]);
  assert.deepEqual(filtrarSugestoes(perfis, " @JOAO.C ", "influenciador", "empresa"), [perfis[0]]);
  assert.deepEqual(filtrarSugestoes(perfis, "souza", "influenciador", "empresa"), [perfis[1]]);
  assert.deepEqual(filtrarSugestoes(perfis, " @ ", "influenciador", "empresa"), []);
  assert.deepEqual(filtrarSugestoes(perfis, "inexistente", "influenciador", "empresa"), []);
});

test("sugestões excluem a própria conta, administradores, inativos e tipos incompatíveis", () => {
  const perfis = [
    { username: "ana", tipo_perfil: "influenciador" },
    { username: "ana.eu", tipo_perfil: "influenciador" },
    { username: "ana.empresa", tipo_perfil: "empresa" },
    { username: "ana.inativa", tipo_perfil: "influenciador", ativo: false },
    { username: "ana.admin", tipo_perfil: "influenciador", papel: "admin" },
  ];
  assert.deepEqual(filtrarSugestoes(perfis, "ana", "influenciador", "ana.eu"), [perfis[0]]);
  assert.deepEqual(filtrarSugestoes(perfis, "ana", "empresa", "ana.eu"), [perfis[2]]);
});

test("sugestões priorizam username exato, depois prefixo, e limitam a lista", () => {
  const perfis = Array.from({ length: 12 }, (_, index) => ({ username: `ana${index}`, nome: "Ana", tipo_perfil: "influenciador" }));
  perfis.push({ username: "ana", nome: "Z Ana", tipo_perfil: "influenciador" });
  const resultado = filtrarSugestoes(perfis, "ana", "influenciador", "empresa");
  assert.equal(resultado.length, 8);
  assert.equal(resultado[0].username, "ana");
});

test("listagem usa filtro de tipo e permite cancelar a requisição", async t => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/usuarios?tipo_perfil=empresa");
    assert.equal(options.signal, controller.signal);
    return Response.json([{ username: "marca", tipo_perfil: "empresa" }]);
  });
  assert.equal((await listarPerfis("empresa", controller.signal))[0].username, "marca");
});

test("falha ou resposta inválida da listagem produz erro recuperável", async t => {
  const mock = t.mock.method(globalThis, "fetch", async () => Response.json({}, { status: 503 }));
  await assert.rejects(listarPerfis("empresa"), /Não foi possível carregar/);
  mock.mock.mockImplementation(async () => Response.json({ usuarios: [] }));
  await assert.rejects(listarPerfis("empresa"), /Não foi possível carregar/);
});
