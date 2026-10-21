# Card Hunters

Exploração de ilha em pixel art (Phaser) com duelos de cartas. O jogo abre num mapa de fases
(estilo mapa-múndi do Mario): cada região da ilha é uma fase com mapa próprio (chegada de barco, chefe no
ponto mais distante, ~16 baús, 2 áreas secretas, 2 cavernas e duelistas), pensada para uns 5 minutos de exploração.
As fases são progressivas: vencer o chefe (guardião da região) abre um portal no lugar dele, e
atravessá-lo libera a próxima fase no mapa. Refatoração do arquivo único
`Card Hunters.html` em módulos ES organizados por camada.

## Rodar

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # gera dist/
npm run preview  # serve o build
```

## Arquitetura

As dependências apontam sempre para dentro: `ui`/`game` → `state`/`world`/`art` → `domain` → `data`/`config`/`core`.

```
src/
├── main.js                 Raiz de composição: cria telas, liga eventos, inicia o jogo
├── config/constants.js     Constantes (tile, regras do duelo, vida, chave de salvamento)
├── core/                   Utilitários sem regra de jogo
│   ├── EventBus.js, events.js   Barramento de eventos (desacopla cena ↔ interface)
│   ├── math.js, random.js, noise.js
├── data/                   Só dados: cartas, itens, tipos, regiões, fases, cavernas, oponentes
├── domain/                 Regras puras (sem DOM nem Phaser)
│   ├── cards.js            Raridade e sorteio de cartas
│   ├── equipment.js        Atributos com equipamentos, sorteio de itens
│   ├── opponents.js        Montagem dos oponentes (mapa e arena)
│   ├── rewards.js          Prêmios de baús e vitórias
│   └── duel/rules.js, ai.js    Motor do duelo e IA do oponente
├── state/                  Persistência e consultas do progresso
│   ├── storage.js          Adaptador do localStorage (substituível)
│   ├── gameState.js        Estado do jogador, carregar/salvar/resetar
│   ├── collection.js       Coleção, equipar/desequipar
│   ├── deck.js             Baralho salvo (9 cartas usadas em todos os duelos)
│   ├── progress.js         Baús, segredos, posição
│   └── phaseProgress.js    Progresso e desbloqueio das fases
├── world/                  Geração procedural
│   ├── tiles.js, pathfinding.js
│   ├── islandGenerator.js, caveGenerator.js
│   ├── phaseGenerator.js   Gerador de cada fase (configurado em data/phases.js)
│   └── world.js            Registro dos mapas (miniatura da ilha, fases, cavernas) e portais
├── art/                    Pixel art gerada em código (sem Phaser)
│   ├── palettes.js, color.js, pixelGrid.js, shapeRenderer.js, canvas.js
│   ├── monsters.js, itemIcons.js, characters.js, props.js, portal.js
│   ├── groundPainter.js    Pintura do chão (cálculo puro + montagem do canvas)
│   └── groundWorker.js     Web Worker que pinta a fase em segundo plano
├── game/                   Phaser
│   ├── createGame.js
│   ├── WorldMapScene.js    Mapa de fases (escolha da fase)
│   ├── StageScene.js       Exploração de uma fase ou caverna
│   ├── session.js          Cena ativa e trava do movimento
│   ├── portalFx.js         Portal de saída (aparece ao vencer o chefe)
│   ├── keyboard.js, tapInput.js, textures.js, characterAnimator.js
├── app/                    Fluxos que unem domínio, estado e interface
│   ├── chestFlow.js, duelFlow.js
├── ui/
│   ├── dom.js, toast.js, hud.js
│   ├── components/         cardView.js, itemView.js
│   ├── screens/            Intro, Coleção, Forja, Baralho, Arena, revelação, navegação mapa ↔ fase
│   └── duel/               DuelController (fluxo), DuelView (desenho), DuelInput (entrada), mensagens
└── styles/                 tailwind.css + base, cards, forge, duel
```

### Princípios aplicados

- **S** — cada módulo tem uma responsabilidade: regras do duelo não tocam no DOM; `DuelView` só desenha;
  `DuelInput` só traduz gestos em ações; `DuelController` só coordena turnos.
- **O** — conteúdo novo (cartas, itens, cavernas, visuais) entra em `data/` ou nos mapas de arte, sem mexer na lógica.
- **L/I** — o armazenamento é um adaptador `{ load, save }`; telas recebem só o que usam (`onStart`, `deckBuilder`).
- **D** — a cena Phaser não conhece a interface: emite eventos (`CHEST_REACHED`, `NPC_CHALLENGE`, `TOAST`...)
  e consulta sondas injetadas (`setUiProbes`). Tudo é ligado em `main.js`.

O salvamento usa a mesma chave do original (`ilha-cobica-v1`), então o formato do progresso é compatível.
