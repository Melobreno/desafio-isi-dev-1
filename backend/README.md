# ⚽ Backend - API da Liga de Futebol (Passe)

API REST do Estudo de Caso **SENAI/PE – CÓD. 237 DESENVOLVEDOR I (FULLSTACK)**: jogadores e valor de mercado, clubes, compra e venda com contrato de fidelidade, histórico de transações com exportação CSV, escalação, partidas determinísticas e classificação.

---

## 1. 📋 Pré-requisitos

| Ferramenta | Versão | Uso |
| :--- | :--- | :--- |
| **Java (JDK)** | **21** | Compilar e executar a API fora do Docker e rodar os testes |
| **Maven** | **3.9** (ou o wrapper `./mvnw` incluído) | Build e dependências |
| **Docker Engine** | **24+** | Contêineres do banco e da API |
| **Docker Compose** | **v2** | Orquestração (`docker compose`) |
| **MySQL** | **8.0** (imagem pública `mysql:8.0`, iniciada pelo Compose) | Banco de dados |

---

## 2. 🗄️ Criar e recriar o banco do zero

O esquema (7 tabelas obrigatórias: `jogadores`, `clubes`, `contratos`, `transacoes`, `escalacoes`, `partidas`, `duelos_partida`) é criado pelo **Flyway** a partir de [`V1__create_tables.sql`](src/main/resources/db/migration/V1__create_tables.sql) na inicialização da API. O banco nasce vazio.

Criar (na raiz do repositório):
```bash
cp .env.example .env
docker compose up -d db
```

Recriar do zero (na raiz do repositório):
```bash
docker compose down -v
docker compose up -d --build
```
> `-v` remove o volume `mysql_data`; na subida seguinte o MySQL e as tabelas são recriados vazios.

---

## 3. 🚀 Instalar e executar (Ubuntu 24.04)

### Opção 1: Docker Compose (recomendada)

Na raiz do repositório:
```bash
cp .env.example .env
docker compose up -d --build
```

- **Origem da API:** `http://localhost:8080` (sem `/api/v1`)
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`

Encerrar:
```bash
docker compose down
```

### Opção 2: API com Maven, banco no Docker

Na raiz do repositório:
```bash
cp .env.example .env
docker compose up -d db
```

Na pasta `backend` (carrega as variáveis do `.env` da raiz no shell e sobe a API):
```bash
cd backend
set -a; . ../.env; set +a
./mvnw spring-boot:run
```

- **Origem da API:** `http://localhost:8080`

> O Spring Boot não lê arquivos `.env` sozinho; por isso o `set -a; . ../.env; set +a` exporta as variáveis antes do `spring-boot:run`.

---

## 4. ⚙️ Variáveis de ambiente

Arquivo de referência: [`.env.example`](../.env.example), na raiz do repositório (usado pelo Docker Compose e pela execução local).

| Variável | Valor no `.env.example` | Uso |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | Host do MySQL na execução local (no Compose, a API usa `db`) |
| `DB_PORT` | `3301` | Porta do MySQL exposta no host |
| `DB_NAME` | `caseSenai` | Nome do banco |
| `DB_USER` | `admin` | Usuário da aplicação no MySQL |
| `DB_PASSWORD` | `passe_password` | Senha do usuário da aplicação |
| `MYSQL_ROOT_PASSWORD` | `rootpassword%db` | Senha do root do MySQL (contêiner `db`) |
| `PORT` | `8080` | Porta HTTP da API |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | Origem do frontend liberada no CORS |

---

## 5. 📁 Estrutura de pastas e bibliotecas

### 5.1 Estrutura

```text
backend/
├── src/main/java/com/github/melobreno/backend/
│   ├── config/        # CORS e OpenAPI
│   ├── controllers/   # Endpoints REST sob /api/v1
│   ├── dto/           # Records de requisição e resposta (snake_case)
│   ├── exceptions/    # Handler global e exceções de negócio
│   ├── model/         # Entidades JPA das 7 tabelas
│   ├── repository/    # Spring Data JPA
│   ├── service/       # Regras de negócio (RN01 a RN21)
│   └── util/          # Validações gerais (V4, datas, ordenação)
├── src/main/resources/
│   ├── application.properties
│   └── db/migration/  # Migrations Flyway
├── src/test/java/...  # Testes unitários (JUnit 5 + Mockito)
├── Dockerfile
└── pom.xml
```

### 5.2 Bibliotecas

| Biblioteca | Motivo |
| :--- | :--- |
| `spring-boot-starter-web` (Spring Boot 3.5) | API REST com Spring MVC e Jackson |
| `spring-boot-starter-data-jpa` | Persistência com Hibernate/JPA |
| `spring-boot-starter-validation` | Bean Validation |
| `flyway-core` / `flyway-mysql` | Migrations versionadas e criação reprodutível do banco |
| `mysql-connector-j` | Driver JDBC do MySQL |
| `lombok` | Getters, setters e construtores das entidades |
| `springdoc-openapi-starter-webmvc-ui` 2.8 | Documentação interativa (Swagger UI) |
| `spring-boot-starter-test` | JUnit 5 e Mockito nos testes unitários |

---

## 6. 🧠 Decisões e premissas

1. **Valores calculados não são colunas:** overall, valor de mercado, valor do elenco, patrimônio, dias restantes, percentual de multa, pontos e posição são calculados a cada consulta (seção 3 do enunciado).
2. **V4 centralizada:** textos passam por `ValidacoesGeraisUtils.aplicarV4` (trim e espaços internos colapsados).
3. **Datas (RN01):** `OffsetDateTime` no fuso `-03:00`, formato ISO-8601.
4. **Erros:** `ApiExceptionHandler` devolve `{"message": "..."}`: `400` para dados inválidos, `404` para recurso inexistente, `409` para regra de negócio violada.
5. **Rotas sem barra final:** os caminhos são exatamente os do enunciado (ex.: `/api/v1/clubs`); `/api/v1/clubs/` responde `404`.

---

## 7. 🚫 Funcionalidades não implementadas

Nenhuma no escopo da API (módulos 1 a 4, RN01 a RN21).

---

## 8. 🤖 Uso de inteligência artificial

> ⚠️ **A preencher pelo autor** com as ferramentas efetivamente usadas, onde (arquivos/funcionalidades), como e por quê, e o que foi aceito, alterado ou descartado. O enunciado torna esta seção obrigatória.

---

## 9. 🌟 Diferenciais técnicos

### Testes automatizados
Na pasta `backend` (não precisam de banco; terminam sozinhos):
```bash
./mvnw test
```

### Docker e Docker Compose
Na raiz: `docker compose up -d --build` sobe banco e API.

### Documentação interativa (Swagger/OpenAPI)
`http://localhost:8080/swagger-ui.html`
