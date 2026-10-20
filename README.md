# ⚽ Passe — Sistema de Gestão de Liga e Mercado de Futebol

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.4-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-v2-blue.svg)](https://docs.docker.com/compose/)

Solução completa desenvolvida para o Estudo de Caso **SENAI/PE – CÓD. 237 DESENVOLVEDOR I (FULLSTACK)**. O sistema contempla a gestão completa de jogadores com cálculo automatizado de valor de mercado e exclusão lógica, administração financeira e patrimonial de clubes (limite de 20), compra e venda com contratos de fidelidade, multas e comissões sobre lucro, histórico contábil imutável com exportação em CSV, escalações táticas por formação, simulação de partidas com 6 duelos técnicos determinísticos e classificação oficial com múltiplos critérios de desempate.

---

## 1. 📋 Pré-requisitos

| Ferramenta                         | Versão recomendada                | Finalidade                                            |
| :--------------------------------- | :-------------------------------- | :---------------------------------------------------- |
| **Ubuntu Linux**                   | **24.04 LTS** (ambiente da banca) | Sistema operacional base                              |
| **Docker Engine & Docker Compose** | **Docker 24+ / Compose v2**       | Execução integrada de banco, backend e frontend       |
| **Java Development Kit (JDK)**     | **21 LTS**                        | Compilação e testes do backend fora do Docker         |
| **Maven**                          | **3.9+** (ou `./mvnw` incluído)   | Gerenciador de build do backend                       |
| **Node.js & npm**                  | **Node.js 22 LTS / npm 10+**      | Execução e testes do frontend fora do Docker          |
| **MySQL**                          | **8.0**                           | Banco de dados relacional (imagem oficial via Docker) |

---
## 2. 🚀 Passo a passo para instalar e executar (Ubuntu 24.04)

### 2.1 Execução com Docker Compose (Comando Único Recomendado)
Clone o Repositório a partir do link: 
```bash
git clone https://github.com/Melobreno/desafio-isi-dev-1.git
```

Entre no diretório do repositório: 
```bash
cd ./desafio-isi-dev-1
```

Na raiz do repositório, execute:

```bash
cp .env.example .env
docker compose up -d --build
```

- **Interface Web (Frontend):** `http://localhost:5173`
- **Origem da API REST (Backend):** `http://localhost:8080` (endpoints sob `/api/v1`)
- **Documentação Interativa Swagger / OpenAPI:** `http://localhost:8080/swagger-ui.html`

Para encerrar os contêineres:

```bash
docker compose down
```


## 3. 🗄️ Criar e recriar o banco de dados do zero

O banco de dados relacional utiliza o **Flyway** para versionamento e execução automática das migrações na inicialização da API, gerando as 7 tabelas normalizadas do esquema relacional:
`jogadores`, `clubes`, `contratos`, `transacoes`, `escalacoes`, `partidas` e `duelos_partida`.

O banco nasce completamente **vazio** (sem dados mockados obrigatórios), conforme exigência do regulamento.

### 3.1 Criar o banco pela primeira vez

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up -d db
```

### 3.2 Recriar o banco do zero (apagar e recriar limpo)

Na raiz do repositório:

```bash
docker compose down -v
docker compose up -d db
```

> O parâmetro `-v` remove o volume nomeado `mysql_data`, garantindo que o banco seja recriado vazio na próxima inicialização.

### 3.3 Carga Opcional de Dados (Seeds de Demonstração)

Caso deseje iniciar a aplicação já com **dados fictícios de demonstração** (6 clubes, 23 jogadores — 16 escalados/contratados e 7 livres —, histórico de transações e 1 partida jogada), basta ativar a flag `SEED_DATA`:

```bash
# Inicialização completa via Docker Compose com seed ativado:
SEED_DATA=true docker compose up -d

# Ou definindo no arquivo .env:
# SEED_DATA=true
```

> **Nota:** A execução é **idempotente**. O seeder verifica se já existem registros cadastrados antes de aplicar o script `db/seed.sql`, prevenindo duplicidades se o contêiner reiniciar.

---

### 3.4 Execução Manual para Desenvolvimento (Sem contêiner da aplicação)

#### Passo A: Subir o banco de dados MySQL

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up -d db
```

#### Passo B: Iniciar o Backend (Terminal 1)

Na pasta `backend`:

```bash
cd backend
./mvnw spring-boot:run
```

> O backend iniciará na porta **8080**.

#### Passo C: Iniciar o Frontend (Terminal 2)

A partir da raiz do repositório, em outro terminal:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

> O frontend iniciará em `http://localhost:5173`.

---

## 4. 🧪 Testes, Lint e Formatação

### 4.1 Backend (Java / Spring Boot)

Na pasta `backend`:

```bash
cd backend
./mvnw test
```

> Executa a suíte de testes unitários e de integração sem modo de observação, cobrindo todas as regras de negócio de valor de mercado (RN02 a RN05), fidelidade, duelos de partida e classificação.

### 4.2 Frontend (React / TypeScript / Vitest)

Na pasta `frontend`:

```bash
cd frontend
npm test
```

> Executa **44 testes automatizados** com Vitest e Testing Library terminando sozinhos em poucos segundos.

```bash
npm run lint
```

> Executa a análise estática do ESLint, terminando com **0 erros e 0 avisos**.

```bash
npm run format:check
```

> Verifica a formatação com Prettier sem alterar arquivos.

---

## 5. ⚙️ Variáveis de ambiente

Arquivo de referência consolidado: [`.env.example`](.env.example) na raiz do repositório:

| Variável              | Valor Padrão                    | Descrição                                          |
| :-------------------- | :------------------------------ | :------------------------------------------------- |
| `DB_HOST`             | `localhost` (ou `db` no Docker) | Endereço do servidor MySQL                         |
| `DB_PORT`             | `3301`                          | Porta exposta no host para o MySQL                 |
| `DB_NAME`             | `caseSenai`                     | Nome do banco de dados                             |
| `DB_USER`             | `admin`                         | Usuário da aplicação                               |
| `DB_PASSWORD`         | `passe_password`                | Senha da aplicação                                 |
| `MYSQL_ROOT_PASSWORD` | `rootpassword%db`               | Senha do usuário root do contêiner MySQL           |
| `PORT`                | `8080`                          | Porta HTTP da API backend                          |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173`         | Origem do frontend autorizada nas requisições CORS |
| `VITE_API_BASE_URL`   | `http://localhost:8080/api/v1`  | URL da API consumida pelo cliente Vite             |

---

## 6. 📁 Estrutura de pastas e bibliotecas

### 6.1 Visão Geral do Repositório

```text
desafio-isi-dev-1/
├── backend/                    # API REST em Spring Boot 3.4.4 (Java 21)
│   ├── src/main/java/          # Clean Architecture: Controller, Service, Model, DTOs, Repository
│   ├── src/main/resources/     # Migrações Flyway e application.properties
│   ├── src/test/java/          # Testes unitários com JUnit 5 e Mockito
│   ├── Dockerfile              # Imagem Docker do backend
│   └── pom.xml                 # Gerenciamento de dependências Maven
├── frontend/                   # Interface web em React 19 + TypeScript + Vite
│   ├── src/                    # Componentes, Páginas, Services, Hooks, Contexts e Design System
│   ├── Dockerfile              # Imagem Docker do frontend servido com Nginx
│   └── package.json            # Dependências e scripts npm
├── docs/                       # Documentação técnica e mockup de referência
├── case/                       # Enunciado oficial, barema e glossário da seleção
├── docker-compose.yml          # Orquestração dos serviços (db, backend, frontend)
├── .env.example                # Modelo de variáveis de ambiente
└── README.md                   # Esta documentação principal
```

### 6.2 Bibliotecas Principais

- **Backend:**
  - `spring-boot-starter-web` & `spring-boot-starter-validation`: Criação de API REST com validação declarativa de DTOs (`@NotNull`, `@Size`, `@Min`, `@Max`).
  - `spring-boot-starter-data-jpa` & `mysql-connector-j`: Mapeamento objeto-relacional com Hibernate e driver MySQL.
  - `flyway-core` & `flyway-mysql`: Controle de versão e migrações idempotentes de banco de dados.
  - `springdoc-openapi-starter-webmvc-ui`: Geração automática da documentação Swagger OpenAPI 3.
  - `spring-boot-starter-test`: Testes unitários e de integração com JUnit 5, AssertJ e Mockito.
- **Frontend:**
  - `react` (v19) & `react-dom`: Biblioteca declarativa para renderização de componentes reativos.
  - `react-router-dom` (v7): Gerenciamento de rotas e navegação client-side.
  - `lucide-react`: Ícones vetoriais consistentes e acessíveis.
  - `vite`: Bundler e servidor de desenvolvimento ultra-otimizado.
  - `vitest` & `@testing-library/react`: Testes de comportamento e acessibilidade.
  - `eslint` & `prettier`: Garantia de conformidade com padrões de código limpo.

---

## 7. 💡 Decisões e premissas

1. **Separação de Responsabilidades e Clean Architecture:**
   - O backend é a única fonte da verdade para o cálculo de regras de negócio (arredondamentos a 2 casas, multas proporcionais de fidelidade, comissões de venda sobre lucro, resultado dos 6 duelos técnicos e desempates na tabela).
   - O frontend consome os dados da API sem recálculos arbitrários, prevenindo divergências de centavos.
2. **Resiliência e Tratamento de Not Found:**
   - Na busca de jogadores ou clubes inexistentes, exibe-se um estado vazio amigável com botão direto para limpar a busca.
   - Na tentativa de acessar um clube inexistente diretamente pela barra de URL (`/clubes/999`), a interface intercepta o erro 404 da API e renderiza uma página de erro dedicada com orientações e botões para voltar à lista ou à tela inicial.
3. **Fidelidade ao Mockup de Interface:**
   - A tela inicial (`/`) segue fielmente o mockup oficial do Figma nas variações W01 (com partidas) e W02 (sem partidas), com atalho de teclado (`Enter`) para início rápido.
   - A tela de Detalhes da Partida (`/liga/jogos/:id`) reconstrói geometricamente a posição dos 10 jogadores escalados em um campo gramado com marcações táticas, crachá de gol ⚽, badge de condição física ⚡ e tabela detalhada dos 6 duelos técnicos.
4. **Exportação CSV:** Segue estritamente a especificação da RN18 com separador `;`, cabeçalho oficial, valores com 2 casas decimais e vírgula, negativos com `-` e fuso horário de Brasília.

---

## 8. 📌 Funcionalidades não implementadas

**Nenhuma.** Todos os requisitos funcionais da API (RN01 a RN21), funcionalidades obrigatórias do frontend (F01 a F14) e diferenciais técnicos (testes, Docker Compose, Swagger OpenAPI, logs padronizados, responsividade mobile 375 px, lint e formatação) foram 100% implementados e testados.

---

## 9. 🤖 Uso de inteligência artificial

Conforme exigência do item 8 de _Requisitos do README.md_ e das diretrizes do processo seletivo:

- **Ferramenta utilizada:** Google Gemini (Antigravity).
- **Forma de utilização:** Atuação como assistente de desenvolvimento para aceleração na geração de massa de testes de unidade (Vitest / Testing Library / Mockito), diagramação e marcação CSS das linhas do gramado tático e redação técnica dos arquivos README. Toda a lógica de domínio, restrições do banco, tratamento de exceções e endpoints da API foram rigorosamente revisados e auditados quanto à conformidade com os requisitos oficiais do regulamento.
