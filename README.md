# projeto-3-frontend

## Configurações de aparência

A aba `/configuracoes` contém tema claro, escuro ou do sistema, fonte em
100%, 112,5% ou 125%, paletas verde, azul e ameixa, alto contraste e redução de animações.
As mudanças são imediatas, com prévia e opção para restaurar o padrão.
Tema e paleta são compartilhados pelas páginas e diálogos da área logada;
o tamanho da fonte é aplicado na raiz da aplicação.

As preferências são salvas no MongoDB pelo backend e vinculadas à conta via
`GET/PATCH /usuarios/me/preferencias`, autenticados por JWT. Não é necessária
migração para contas antigas: a API fornece os padrões até a primeira edição.

O `localStorage` guarda uma cópia por usuário em
`nexo:aparencia:v1:<username>`, sem compartilhar a aparência entre contas.
O cache global antigo não é atribuído automaticamente a uma conta, pois não
registra quem escolheu as opções. Após o login, o servidor tem prioridade;
alterações locais ainda pendentes são reenviadas sem sobrescrever opções não
editadas. Logout/troca de conta cancela as consultas antigas e troca o cache.

A interface aplica alterações imediatamente e informa carregamento, gravação
ou falha. As gravações são serializadas para preservar cliques rápidos;
falhas ficam pendentes no cache e podem ser reenviadas pelo botão de tentativa,
quando a conexão voltar ou ao recuperar o foco. O tema do sistema continua
acompanhando o dispositivo. Restaurar o padrão também salva na conta.

Editar perfil e gerenciar a conta não fazem parte desta aba.
