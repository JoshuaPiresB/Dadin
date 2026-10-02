# Dadin

Jogo competitivo de dados 2D em pixel art para navegador. A apresentação, os textos, os efeitos e os elementos visuais são originais; a partida usa um tabuleiro de três colunas, combinações multiplicadoras e destruição de dados correspondentes no tabuleiro rival.

O projeto é um monorepo TypeScript com jogo solo completo, três níveis de bot e multiplayer autoritativo 1v1 por WebSocket.

## Tecnologias

- React 19, React Router e Vite 8 para menus, rotas, lobby e configurações.
- Phaser 3 para tabuleiro, dados, interação e animações pixel art.
- Node.js, Express e Colyseus 0.18 para partidas online autoritativas.
- `@colyseus/schema` para sincronização eficiente do estado.
- Vitest para regras, bots e validações.
- npm workspaces para compartilhar tipos e regras entre cliente e servidor.

## Estrutura

```text
apps/
  client/                 React + Phaser
    src/components/       Controles e telas reutilizáveis
    src/game/             Bridge tipado e cenas Phaser
    src/hooks/            Partida local contra bot
    src/pages/            Rotas da aplicação
    src/services/         Áudio e cliente Colyseus
    src/store/            Preferências em localStorage
    src/styles/           Identidade visual responsiva
  server/                 Servidor Node persistente
    src/rooms/            Sala autoritativa e Schemas
    src/services/         Registro código → sala
    src/utils/            Validação de entradas
packages/
  shared/                 Regras puras, bots, tipos e mensagens
```

O pacote `shared` não conhece React, Phaser ou Colyseus. Ele concentra pontuação, jogadas, remoções, fim de jogo e decisões dos bots. Phaser apenas representa o estado; no online, somente o servidor altera o estado oficial.

## Pré-requisitos

- Node.js 22 ou superior (Node 24 também é suportado).
- npm 10 ou superior.
- Windows 10/11, macOS ou Linux.

## Instalação e desenvolvimento

No PowerShell, a partir da raiz:

```powershell
npm install
npm run dev
```

O comando compila o pacote compartilhado e inicia os dois processos:

- cliente: `http://localhost:5173`
- servidor/API/WebSocket: `http://localhost:2567`

O servidor é recompilado e reiniciado ao editar arquivos TypeScript. O cliente usa hot reload do Vite.

## Comandos

```powershell
npm run dev      # cliente + servidor
npm run test     # suíte Vitest
npm run lint     # checagem TypeScript estrita em todos os workspaces
npm run build    # builds de shared, servidor e cliente
```

Artefatos de produção:

- `apps/client/dist/`
- `apps/server/dist/`
- `packages/shared/dist/`

## Regras

Cada jogador tem três colunas com três espaços. Um dado de 1 a 6 é rolado no início do turno e deve ser colocado em uma coluna livre.

Dados iguais na mesma coluna têm pontuação `valor × quantidade²`. Assim, dois dados 4 valem 16 e três dados 4 valem 36. Ao colocar um valor, todos os dados iguais na coluna correspondente do rival são removidos. Quando o jogador que acabou de jogar preenche o nono espaço, o servidor compara os placares; pode haver empate.

As funções principais estão em `packages/shared/src/game/rules.ts`:

- `createEmptyBoard`
- `isColumnFull`
- `getAvailableColumns`
- `calculateColumnScore`
- `calculateBoardScore`
- `applyMove`
- `removeMatchingOpponentDice`
- `isGameFinished`
- `determineWinner`
- `cloneGameState`

## Bots

- **Fácil:** escolhe aleatoriamente entre as colunas válidas.
- **Médio:** avalia ganho próprio, pontos destruídos, pares, trincas, risco e fechamento do tabuleiro.
- **Difícil:** combina a avaliação imediata com uma busca de valor esperado sobre os seis resultados possíveis e as melhores respostas adversárias. Ele não conhece dados futuros.

Todos usam o mesmo `applyMove` da regra compartilhada e nunca podem escolher uma coluna cheia.

## Multiplayer autoritativo

O cliente envia somente intenções (`place_die`, `request_rematch`, `decline_rematch` e `leave_match`). A sala valida estado, turno, índice, coluna, limite de mensagens e concorrência antes de aplicar a jogada.

O servidor:

1. gera o dado com `node:crypto`;
2. escolhe aleatoriamente quem começa;
3. aplica a jogada pela regra compartilhada;
4. remove dados do rival;
5. recalcula placares e vencedor;
6. publica o novo Schema aos dois clientes.

O código público da sala tem cinco caracteres e evita `0/O` e `1/I/L`. O ID interno do Colyseus nunca é exibido. Salas ficam em memória e são descartadas quando vazias.

## Testar multiplayer localmente

1. Execute `npm run dev`.
2. Abra `http://localhost:5173`.
3. Selecione **Jogar → Online**.
4. Digite um apelido e clique em **Criar sala**.
5. Copie o código ou o link exibido.
6. Abra uma janela anônima ou outro navegador.
7. Acesse o link `/join/CODIGO` ou use **Entrar com código**.
8. Digite outro apelido; a partida inicia automaticamente.

Para testar reconexão, atualize uma das janelas durante a partida. O token fica em `sessionStorage`; o servidor reserva a vaga por 60 segundos e restaura tabuleiro, placares, turno e dado. Depois do prazo, o rival vence por desconexão. O botão **Sair da partida** registra abandono imediatamente após confirmação.

A revanche começa apenas quando ambos solicitam/aceitam. A mesma sala é reutilizada com tabuleiros zerados, novo primeiro jogador e novo dado.

## Variáveis de ambiente

Copie os exemplos se quiser alterar os padrões.

Cliente — `apps/client/.env`:

```dotenv
VITE_GAME_SERVER_URL=ws://localhost:2567
VITE_GAME_API_URL=http://localhost:2567
```

Servidor — `apps/server/.env`:

```dotenv
PORT=2567
CLIENT_URL=http://localhost:5173
```

`CLIENT_URL` aceita várias origens separadas por vírgula. Em produção, use a origem HTTPS real do frontend. Nunca armazene secrets em variáveis `VITE_*`, porque elas são públicas no bundle.

## Persistência local e acessibilidade

Apelido, volumes e preferência de animação reduzida ficam em `localStorage`. Estado oficial de partidas online nunca é salvo como verdade no navegador.

A interface oferece contraste alto, controles com pelo menos 48 px, feedback além de cor, suporte a toque, teclas `1`, `2`, `3`, menu por `Esc`, preferência de movimento reduzido e layouts específicos para desktop e celular. Os efeitos sonoros são sintetizados pela Web Audio API; não há áudio ou arte de terceiros.

## Testes

A suíte cobre:

- todos os exemplos obrigatórios de pontuação;
- remoção de múltiplos dados apenas na coluna correspondente;
- coluna cheia e índices inválidos;
- colocação do nono dado, vencedor e empate;
- jogadas legais dos três bots em diferentes tabuleiros e dados;
- validação de apelidos e códigos de sala.

Além da suíte automatizada, o fluxo foi validado em navegador com dois clientes: criação de sala, entrada por link, jogadas sincronizadas, atualização da página e reconexão com o placar preservado.

## Deploy

### Frontend

Execute `npm run build` e hospede `apps/client/dist` em um serviço de arquivos estáticos. Configure fallback de SPA para `index.html` nas rotas `/play`, `/online`, `/room/*` e `/join/*`. Defina:

```dotenv
VITE_GAME_SERVER_URL=wss://api.seudominio.com
VITE_GAME_API_URL=https://api.seudominio.com
```

### Servidor

O backend precisa de um processo Node persistente com suporte a WebSocket; não use funções serverless efêmeras. Configure `CLIENT_URL` para o domínio do frontend e exponha a porta definida em `PORT`.

Build e execução direta:

```powershell
npm run build
npm run start -w @pixel-dice-duel/server
```

Ou use o Dockerfile:

```powershell
docker build -f apps/server/Dockerfile -t dadin-server .
docker run --rm -p 2567:2567 -e PORT=2567 -e CLIENT_URL=https://jogo.exemplo dadin-server
```

Em produção, termine TLS no proxy/plataforma para que o frontend HTTPS use `wss://`. Como as salas desta versão ficam em memória, execute uma única instância ou adicione presença/driver compartilhado antes de escalar horizontalmente.
