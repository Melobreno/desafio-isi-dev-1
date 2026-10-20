# ⚽ Frontend - Interface da Liga de Futebol (Passe)

Interface web moderna, responsiva e acessível do Estudo de Caso **SENAI/PE – CÓD. 237 DESENVOLVEDOR I (FULLSTACK)**. Permite percorrer todo o fluxo do sistema: gestão do mercado de jogadores, administração de clubes, compra e venda com contratos de fidelidade, histórico financeiro com exportação CSV, escalação tática por formação, simulação de partidas com duelos e tabela de classificação oficial.

---

## 1. 📋 Pré-requisitos

| Ferramenta        | Versão recomendada                                  | Uso                                        |
| :---------------- | :-------------------------------------------------- | :----------------------------------------- |
| **Node.js**       | **22 LTS** (mínimo 20+)                             | Ambiente de execução JavaScript/TypeScript |
| **npm**           | **10+** (incluído no Node.js)                       | Gerenciador de pacotes e dependências      |
| **Navegador Web** | **Google Chrome** (1366 × 768 e modo mobile 375 px) | Execução e visualização da interface       |

---

## 2. 🚀 Passo a passo para instalar e executar (Ubuntu 24.04)

### 2.1 Configuração inicial

A partir da pasta `frontend`:

```bash
cd frontend
cp .env.example .env
npm ci
```

### 2.2 Execução em modo de desenvolvimento

```bash
npm run dev
```

- **URL da Interface:** `http://localhost:5173`
- **Origem da API consumida:** `http://localhost:8080` (configurada via `VITE_API_BASE_URL` em `frontend/.env`)

### 2.3 Build de produção e pré-visualização

```bash
npm run build
npm run preview
```

---

## 3. 🧪 Testes, Lint e Formatação

Todos os comandos terminam de forma autônoma sem modo de observação (`watch`), atendendo aos critérios de pontuação do barema (F5):

### Testes automatizados

```bash
npm test
```

> Executa a suíte completa de testes com Vitest e Testing Library (44 testes unitários e de componente cobrindo formatadores, validadores, DataTable genérico, HomePage / Mockup Tela Inicial, Not Found no ClubDetailPage e visualização tática no MatchDetailPage).

### Lint (verificação estática)

```bash
npm run lint
```

> Analisa todo o código com ESLint e TypeScript-ESLint, finalizando com **0 erros e 0 avisos**.

### Formatação de código (apenas verificação)

```bash
npm run format:check
```

> Verifica a conformidade de formatação com o Prettier sem alterar arquivos.

### Formatação automática (opcional para desenvolvimento)

```bash
npm run format
```

---

## 4. ⚙️ Variáveis de ambiente

Arquivo de referência: [`frontend/.env.example`](.env.example):

| Variável            | Valor padrão                   | Descrição                              |
| :------------------ | :----------------------------- | :------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | URL base dos endpoints REST do backend |

---

## 5. 📁 Estrutura de pastas e bibliotecas

### 5.1 Estrutura do projeto

```text
frontend/
├── src/
│   ├── assets/                 # SVGs, logotipos e ilustrações
│   ├── components/             # Componentes modulares reutilizáveis
│   │   ├── club/               # Abas e cartões de clubes (Elenco, Escalação, Histórico, KPIs)
│   │   ├── layout/             # Topbar com breadcrumbs e tracker, Sidebar, PageHeader, AppLayout
│   │   ├── modals/             # Modais (PlayerForm, PlayerDetails, Condition, Delete, Buy, Sell, Simulate)
│   │   ├── players/            # Barra de busca e filtros combináveis de jogadores
│   │   └── ui/                 # Design System (Button, Badge, DataTable, Dialog, Input, Toast, etc.)
│   ├── context/                # LeagueSummaryContext (rastreamento de deltas de alterações e caches)
│   ├── hooks/                  # Custom hooks (useAsyncResource, usePlayerFilters, useClubTransactions)
│   ├── pages/                  # Telas da aplicação
│   │   ├── __tests__/          # Testes de componentes das páginas
│   │   ├── HomePage.tsx        # Tela inicial (Mockup W01 com partidas e W02 sem partidas)
│   │   ├── PlayersPage.tsx     # Mercado de jogadores com busca, filtros e paginação
│   │   ├── ClubsPage.tsx       # Listagem e busca de clubes com patrimônio e caixa
│   │   ├── ClubDetailPage.tsx  # Página detalhada do clube com tratamento de erro 404 / ID inexistente
│   │   ├── StandingsPage.tsx   # Classificação oficial da liga com regras da RN21
│   │   ├── MatchesPage.tsx     # Histórico de partidas e simulação
│   │   └── MatchDetailPage.tsx # Detalhes da partida (Scoreboard, Gramado com 10 jogadores e 6 Duelos)
│   ├── services/               # Clientes de API desacoplados (apiClient, players, clubs, league, market)
│   ├── types/                  # Tipagens TypeScript estritas refletindo os DTOs do backend
│   └── utils/                  # Formatadores (moeda, data pt-BR), validadores e exportação CSV
├── .env.example                # Exemplo de variáveis de ambiente
├── eslint.config.js            # Configuração do ESLint
├── package.json                # Dependências e scripts
├── tsconfig.json               # Configuração do compilador TypeScript
└── vite.config.ts              # Configuração do bundler Vite
```

### 5.2 Bibliotecas utilizadas e justificativas

| Biblioteca                 | Versão     | Motivo do uso                                                                                             |
| :------------------------- | :--------- | :-------------------------------------------------------------------------------------------------------- |
| **react** / **react-dom**  | `^19.2.8`  | Biblioteca base para construção declarativa da interface com componentes reativos.                        |
| **react-router-dom**       | `^7.18.4`  | Roteamento client-side com suporte a histórico, rotas aninhadas e query parameters (`useSearchParams`).   |
| **lucide-react**           | `^1.59.0`  | Conjunto leve e consistente de ícones vetoriais acessíveis (sem dependência de fontes externas pesadas).  |
| **vite**                   | `^8.3.0`   | Bundler moderno com inicialização instantânea, Hot Module Replacement (HMR) e build otimizado com Rollup. |
| **typescript**             | `~6.0.2`   | Tipagem estática rigorosa para garantir segurança e prevenir erros em tempo de compilação.                |
| **vitest**                 | `^5.0.5`   | Framework de testes unitários ultrarrápido integrado nativamente com a configuração do Vite.              |
| **@testing-library/react** | `^16.3.3`  | Testes centrados no comportamento do usuário final e acessibilidade.                                      |
| **prettier**               | `^3.9.10`  | Formatação padronizada e determinística de código.                                                        |
| **eslint**                 | `^10.10.0` | Linter de código estático garantindo conformidade com regras de boas práticas React Hooks.                |

---

## 6. 💡 Decisões e premissas do frontend

1. **Separação Estrita de Camadas (Clean Architecture):** Nenhuma chamada HTTP é realizada diretamente de dentro dos componentes React. Todas as operações transitam pela camada `services/`, consumindo a instância padronizada do `apiClient`.
2. **Sem Recálculo de Regras de Negócio no Cliente:** Todos os valores monetários (valores base, valores de mercado, multas, comissões de lucro, taxas e pontuações) e resultados dos duelos da partida são calculados estritamente pelo backend da API e consumidos de forma declarativa pelo frontend, eliminando divergências de arredondamento.
3. **Resiliência e Tratamento de Erros (Empty & Not Found States):**
   - **Busca inexistente:** Caso a busca por jogador ou por clube não encontre resultados, a interface renderiza um estado vazio amigável com ícone `SearchX` e botão para limpar a busca.
   - **ID de clube inexistente na URL (`/clubes/999` ou `/clubes/abc`):** O `ClubDetailPage` captura o erro 404 da API e exibe uma tela dedicada de "Clube não encontrado", com botões para retornar à lista de clubes ou ir para a tela inicial.
4. **Fidelidade ao Mockup do Figma:**
   - A tela inicial (`/`) reproduz o mockup oficial do Figma nas duas variações solicitadas: **W02 (Liga sem partidas)** com status _"nenhuma partida ainda"_ e **W01 (Liga com partidas)** exibindo o clube líder e seus pontos apurados em tempo real na classificação.
   - Suporte ao atalho do teclado: pressionar a tecla `Enter` na tela inicial inicia a navegação para o mercado de jogadores (`/jogadores`).
5. **Responsividade Garantida (375 px):** O layout adapta-se a telas móveis sem rolagem horizontal da janela, permitindo que tabelas e seções táticas rolem suavemente dentro de seus próprios contêineres.
6. **Prevenção de Duplo Clique:** Botões de envio de formulários e simulação desabilitam-se automaticamente durante o processamento das requisições assíncronas.

---

## 7. 📌 Funcionalidades não implementadas

**Nenhuma.** Todas as funcionalidades obrigatórias e diferenciais técnicos previstos no estudo de caso e no barema foram plenamente desenvolvidos e validados.

---

## 8. 🤖 Uso de Inteligência Artificial

Em atendimento ao item 8 de _Requisitos do README.md_ e às regras do regulamento:

- **Ferramentas utilizadas:** Google Gemini (Antigravity) como assistente de programação em par.
- **Forma de utilização:** Auxílio na estruturação de testes unitários com Vitest e Testing Library, refinamento de marcações visuais CSS para o gramado tático e redação de documentação técnica. Validação e refinamento das regras de negócios, integração de endpoints e serviços. Conformidade com as regras (RN01 a RN21) foram rigorosamente verificadas e validadas através da suíte automatizada de testes.
