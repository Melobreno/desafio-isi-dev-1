# ⚽ Passe — Sistema de Gestão de Liga e Mercado de Futebol

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.6-green.svg)](https://spring.io/projects/spring-boot)
[![MySQL 8.0](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![React 19](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-v2-blue.svg)](https://docs.docker.com/compose/)

Solução completa desenvolvida para o Estudo de Caso **SENAI/PE – CÓD. 237 DESENVOLVEDOR I (FULLSTACK)**. O sistema contempla a gestão de jogadores com cálculo automatizado de overall e valor de mercado, administração de clubes (limite de 20), compra e venda com contratos de fidelidade, multas e comissões sobre lucro, histórico contábil imutável com exportação em CSV, escalações táticas por formação, simulação de partidas com 6 duelos técnicos determinísticos e classificação oficial da liga com critérios de desempate.

---

## 1. 📋 Pré-requisitos

| Ferramenta | Versão recomendada | Finalidade |
| :--- | :--- | :--- |
| **Ubuntu Linux** | **24.04 LTS** (ambiente da banca) | Sistema operacional base |
| **Docker Engine & Compose** | **Docker 24+ / Compose v2** | Orquestração integrada de banco, backend e frontend |
| **Java Development Kit (JDK)** | **21 LTS** | Compilação e testes do backend fora do Docker |
| **Maven** | **3.9+** (ou `./mvnw` incluído) | Gerenciador de build e dependências do backend |
| **Node.js & npm** | **Node.js 22 LTS / npm 10+** | Execução e testes do frontend fora do Docker |
| **MySQL** | **8.0** (imagem oficial `mysql:8.0`) | Banco de dados relacional oficial |

---

## 2. 🗄️ Passo a passo para criar o banco de dados e para recriá-lo do zero

O esquema com as 7 tabelas normalizadas (`jogadores`, `clubes`, `contratos`, `transacoes`, `escalacoes`, `partidas`, `duelos_partida`) é criado pelo **Flyway** a partir de `backend/src/main/resources/db/migration/V1__create_tables.sql` na inicialização da API. O banco nasce **completamente vazio**, sem dados mockados.

### 2.1 Criar o banco pela primeira vez
A partir da raiz do repositório:
```bash
cp .env.example .env
docker compose up -d db
```

### 2.2 Recriar o banco do zero (apagar e recriar limpo)
A partir da raiz do repositório:
```bash
docker compose down -v
docker compose up -d db
```
> O parâmetro `-v` remove o volume nomeado `mysql_data`, garantindo que o banco seja recriado vazio na próxima inicialização.

---

## 3. 🚀 Passo a passo para instalar e executar (Ubuntu 24.04)

### 3.1 Execução com Docker Compose (Comando único recomendado)

A partir da raiz do repositório:
```bash
cp .env.example .env
docker compose up -d --build
```

- **Origem da API REST (Backend):** `http://localhost:8080` (endpoints sob `/api/v1`)
- **Interface Web (Frontend):** `http://localhost:5173`
- **Documentação Interativa Swagger / OpenAPI:** `http://localhost:8080/swagger-ui.html`

Para encerrar os contêineres:
```bash
docker compose down
```

---

### 3.2 Execução manual para desenvolvimento

#### Subir o banco de dados MySQL
Na raiz do repositório:
```bash
cp .env.example .env
docker compose up -d db
```

#### Iniciar o Backend (Terminal 1)
Na raiz do repositório:
```bash
cd backend
./mvnw spring-boot:run
```
> A API estará disponível em `http://localhost:8080`.

#### Iniciar o Frontend (Terminal 2)
A partir da raiz do repositório, em outro terminal:
```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```
> A interface web estará disponível em `http://localhost:5173`.

---

### 3.3 Testes automatizados, Lint e Formatação (Diferenciais)

#### Backend (JUnit 5 + Mockito)
Na pasta `backend`:
```bash
cd backend
./mvnw test
```
> Executa a suíte de testes unitários terminando sem modo de observação (`watch`), cobrindo as regras de negócio de valor de mercado (RN02 a RN05), fidelidade, duelos e classificação.

#### Frontend (Vitest + Testing Library + ESLint + Prettier)
Na pasta `frontend`:
```bash
cd frontend
npm test
npm run lint
npm run format:check
```
> Executa **44 testes unitários e de componente** com Vitest (sem modo watch), verificação de análise estática do ESLint (**0 erros**) e checagem de estilo com Prettier sem alterar arquivos.

---

## 4. ⚙️ Variáveis de ambiente

Arquivo de referência consolidado: [`.env.example`](.env.example) na raiz do repositório:

| Variável | Valor Padrão | Descrição |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | Host do MySQL (no Compose, a API usa `db`) |
| `DB_PORT` | `3301` | Porta do MySQL exposta no host |
| `DB_NAME` | `caseSenai` | Nome do banco de dados |
| `DB_USER` | `admin` | Usuário da aplicação MySQL |
| `DB_PASSWORD` | `passe_password` | Senha da aplicação MySQL |
| `MYSQL_ROOT_PASSWORD` | `rootpassword%db` | Senha de root do contêiner MySQL |
| `PORT` | `8080` | Porta HTTP da API backend |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | Origem autorizada nas requisições CORS |
| `FRONTEND_PORT` | `5173` | Porta HTTP da interface web |
| `VITE_API_URL` | `http://localhost:8080` | Origem da API consumida pelo frontend |

---

## 5. 📁 Estrutura de pastas e bibliotecas utilizadas

### 5.1 Estrutura do projeto

```text
desafio-isi-dev-1/
├── backend/                    # API REST em Spring Boot 3.5.6 (Java 21)
│   ├── src/main/java/          # Clean Architecture: Controller, Service, Model, DTOs, Repository
│   ├── src/main/resources/     # Migrações Flyway e application.properties
│   ├── src/test/java/          # Testes unitários com JUnit 5 e Mockito
│   ├── Dockerfile              # Imagem Docker do backend
│   └── pom.xml                 # Gerenciamento de dependências Maven
├── frontend/                   # Interface web em React 19 + TypeScript + Vite
│   ├── src/                    # Componentes, Páginas, Services, Hooks, Contexts e Design System
│   ├── Dockerfile              # Imagem Docker do frontend servido com Nginx
│   ├── package.json            # Dependências e scripts npm
│   └── package-lock.json       # Arquivo de trava de versões versionado
├── docs/                       # Documentação técnica e mockup de referência
├── case/                       # Enunciado oficial, barema e glossário da seleção
├── docker-compose.yml          # Orquestração dos serviços (db, backend, frontend)
├── .env.example                # Modelo de variáveis de ambiente
└── README.md                   # Documentação principal
```

### 5.2 Bibliotecas utilizadas e justificativas

#### Backend (`backend/pom.xml`)
- **`spring-boot-starter-web` (Spring Boot 3.5.6):** Construção da API REST com Spring MVC, Tomcat embutido e serialização JSON padronizada em `snake_case`.
- **`spring-boot-starter-validation`:** Validação declarativa dos payloads e parâmetros nos DTOs (`@NotNull`, `@Size`, `@Min`, `@Max`).
- **`spring-boot-starter-data-jpa`:** Persistência de dados com Hibernate/JPA, transações gerenciadas e repositórios padronizados.
- **`flyway-core` & `flyway-mysql`:** Versionamento e execução automatizada de migrações SQL idempotentes no MySQL 8.0.
- **`mysql-connector-j`:** Driver JDBC oficial do MySQL para conexão com o banco de dados.
- **`lombok`:** Eliminação de código boilerplate de getters, setters e construtores nas entidades de persistência.
- **`springdoc-openapi-starter-webmvc-ui` (v2.8.9):** Geração automática da documentação Swagger / OpenAPI 3.0 disponível em `/swagger-ui.html`.
- **`spring-boot-starter-test`:** Suíte de testes unitários com JUnit 5 e Mockito para validação de serviços e utilitários.

#### Frontend (`frontend/package.json`)
- **`react` & `react-dom` (v19.2.8):** Biblioteca reativa para construção declarativa de componentes e renderização na Web.
- **`react-router-dom` (v7.18.4):** Roteamento client-side com navegação declarativa, rotas aninhadas e query parameters (`useSearchParams`).
- **`lucide-react` (v1.59.0):** Conjunto consistente de ícones vetoriais leves sem dependência de fontes externas.
- **`vite` (v8.3.0):** Bundler com Hot Module Replacement ultrarrápido e compilação otimizada para produção.
- **`typescript` (~6.0.2):** Tipagem estática rigorosa baseada nos DTOs da API REST.
- **`vitest` (v5.0.5) & `@testing-library/react` (v16.3.3):** Execução de testes de comportamento de componentes e utilitários sem modo watch.
- **`eslint` (v10.10.0) & `prettier` (v3.9.10):** Análise estática e formatação padronizada de código.

---

## 6. 💡 Decisões e premissas

1. **Separação Estrita de Camadas (Clean Architecture):** Nenhuma chamada HTTP é realizada diretamente de dentro de componentes de apresentação React; todas transitam pela camada `services/`.
2. **Ponto Único da Verdade (Single Source of Truth):** Todas as 6 fórmulas de negócio (overall por posição, valor de mercado dinâmico, taxa de transferência de 5%, multa e dias de fidelidade, comissão progressiva de venda e resultado de duelos/partidas) são calculadas exclusivamente no backend. O frontend apenas consome os valores recebidos, eliminando divergências de arredondamento.
3. **Consistência Transacional:** Operações que alteram caixas de clubes, transferem atletas e gravam auditorias ocorrem sob anotação `@Transactional`, garantindo atomicidade com rollback automático em caso de falha.
4. **Valores Calculados Não Persistidos:** Nenhum valor derivado (overall, valor de mercado, valor do elenco, patrimônio líquido, pontuação e saldo) é gravado como coluna no banco de dados, sendo sempre apurados em tempo de execução.
5. **Resiliência e Estados Visuais:** Tratamento dos 3 estados (carregamento, vazio e erro com retry) em todas as listagens. URLs inexistentes de clubes (`/clubes/999`) capturam o erro 404 da API e apresentam tela amigável para retorno.
6. **Responsividade Mobile (375 px):** O layout adapta-se a telas móveis sem rolagem horizontal na janela principal, permitindo scroll horizontal interno controlado nas tabelas e no gramado tático.
7. **Formatação Monetária e Temporal:** Moedas exibidas no padrão BRL (`R$ 0,00`) com vírgula decimal e datas manipuladas estritamente no fuso de Brasília (`-03:00`).

---

## 7. 📌 Funcionalidades não implementadas

**Nenhuma.** Todas as regras de negócio (RN01 a RN21), validações de entrada (V1 a V9), requisitos do roteiro de interface (F01 a F14) e diferenciais técnicos (testes unitários no backend e frontend, Swagger OpenAPI, Docker Compose, lint e formatação) foram implementados e validados.

---

## 8. 🤖 Uso de inteligência artificial

Em conformidade com o item 8 de *Requisitos do README.md* e as diretrizes do regulamento:

### Uso Geral
- **Ferramenta utilizada:** Google Gemini (Antigravity).
- **Como e por que foi utilizada:** Atuou como assistente de desenvolvimento em par (*pair programming*) para aceleração na cobertura de testes automatizados, validação de regras de entrada e refinamento visual de componentes.
- **Governança arquitetural:** Toda a atuação seguiu a diretriz de arquitetura e qualidade versionada em [`docs/ai/fullstack-architecture-enforcer.md`](docs/ai/fullstack-architecture-enforcer.md), garantindo Clean Architecture, isolamento de camadas e aderência ao regulamento.

### Frontend
- **Onde foi utilizada:** Estruturação dos testes de componentes e utilitários no Vitest/Testing Library, cálculos de coordenadas vetoriais SVG no gramado tático (`SoccerPitch.tsx`) e miniaturas das 4 formações táticas (`ClubLineupTab.tsx`), além de formatadores monetários/temporais e validadores pré-envio de formulários.
- **O que foi aceito:** Esqueleto dos testes unitários no Vitest, lógica vetorial das marcações de campo e estilização com Tailwind / CSS.
- **O que foi alterado:** Ajuste fino nos detalhes visuais e estilização.
- **O que foi descartado:** Componentes e modais redundantes sem uso, além de qualquer tentativa de recálculo de regras no cliente, mantendo o consumo dos dados 100% declarativo da API.

### Backend
- **Onde foi utilizada:** Construção da suíte de testes unitários com JUnit 5 / Mockito para as fórmulas de valor de mercado (RN02 a RN05), transferências e multas (RN11 a RN13), além de validação das expressões regulares de validação de datas no fuso de Brasília (`-03:00`) e exportação de CSV oficial.
- **O que foi aceito:** Cenários de testes de serviços com Mockito e validações de tipos e faixas de inteiros.
- **O que foi alterado:** Refinamento do tratamento global de exceções para retornar rigorosamente o corpo padronizado `{"message": "..."}` em conformidade com a regra V07, abordagem generalista de serviços, organização do Swagger.
- **O que foi descartado:** Testes artificiais de classes de infraestrutura que não agregavam valor real às regras de negócio e trechos de código redundantes, assegurando uma base limpa e focada no domínio.
