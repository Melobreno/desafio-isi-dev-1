# ⚽ Backend - API da Liga de Futebol (Passe)

Este documento contém todas as instruções para configuração, execução, testes e arquitetura da API REST desenvolvida para o Estudo de Caso **SENAI/PE – CÓD. 237 DESENVOLVEDOR I (FULLSTACK)**.

A API gerencia o ciclo completo da liga: cadastro e valor de mercado de jogadores, administração de clubes, compra/venda de atletas com contratos de fidelidade e histórico de transações com exportação CSV, escalação e simulação determinística de partidas com tabela de classificação.

---

## 1. 📋 Pré-requisitos

Para executar a aplicação diretamente no sistema operacional host ou via contêineres:

| Ferramenta | Versão Recomendada / Mínima | Descrição |
| :--- | :--- | :--- |
| **Java (JDK)** | **21 LTS** (Eclipse Temurin, OpenJDK ou Oracle) | Runtime e compilador Java |
| **Maven** | **3.9+** (ou o wrapper `./mvnw` incluído no projeto) | Gerenciador de dependências e build |
| **Docker** | **24.0+** | Mecanismo de contêineres |
| **Docker Compose** | **v2.20+** | Orquestração de serviços locais |
| **MySQL** | **8.0+** | Banco de dados relacional principal |

---

## 2. 🗄️ Criação e Recriação do Banco de Dados do Zero

O esquema do banco de dados possui as **7 tabelas obrigatórias** (`jogadores`, `clubes`, `contratos`, `transacoes`, `escalacoes`, `partidas`, `duelos_partida`), gerenciadas via migrações automáticas do **Flyway** (`V1__create_tables.sql`). O banco nasce completamente vazio, sem dados pré-carregados.

### 2.1 Criar o banco e aplicar migrações

A partir da raiz do repositório:
```bash
docker compose up -d db
```
O serviço MySQL iniciará e estará acessível na porta configurada (`3301` no host, mapeada para a porta interna `3306`). O Spring Boot executa o Flyway automaticamente na inicialização da aplicação, criando as tabelas necessárias.

### 2.2 Recriar o banco do zero (Reset completo)

Para apagar todos os dados e recriar o esquema do zero (como exigido pela banca antes dos roteiros de teste):
```bash
# Na raiz do repositório:
docker compose down -v
docker compose up -d db
```
> O parâmetro `-v` remove o volume nomeado `mysql_data`, garantindo que o banco seja recriado em estado puramente inicial na próxima subida.

---

## 3. 🚀 Passo a Passo para Instalar e Executar (Ubuntu 24.04)

### Opção 1: Execução Completa via Docker Compose (Recomendada / Diferencial B5)

Com o Docker Engine instalado, execute a partir da raiz do repositório:
```bash
docker compose up --build -d
```
- **Origem da API:** `http://localhost:8080` (o script automatizado da banca adicionará `/api/v1`)
- **Documentação Swagger/OpenAPI:** `http://localhost:8080/swagger-ui.html`

Para encerrar os serviços:
```bash
docker compose down
```

---

### Opção 2: Execução Local com Maven (fora do Docker)

1. **Subir o banco de dados MySQL via Docker:**
   ```bash
   docker compose up -d db
   ```

2. **Configurar as variáveis de ambiente:**
   Na pasta `backend/`:
   ```bash
   cp .env.example .env
   ```

3. **Compilar e rodar a aplicação Spring Boot:**
   ```bash
   ./mvnw clean spring-boot:run
   ```
   *(No Windows PowerShell, utilize `.\mvnw.cmd clean spring-boot:run`)*

A API estará disponível e pronta para receber conexões em:
- **Origem da API:** `http://localhost:8080`
- **Prefixo dos endpoints:** `/api/v1`

---

## 4. ⚙️ Variáveis de Ambiente

As configurações de banco e porta utilizam propriedades padrão com fallbacks no arquivo [`application.properties`](src/main/resources/application.properties), podendo ser sobrescritas por variáveis de ambiente ou arquivo `.env`:

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` (ou `db` no Docker) | Endereço do servidor MySQL |
| `DB_PORT` | `3301` (ou `3306` na rede Docker) | Porta de conexão com o MySQL |
| `DB_NAME` | `passe` | Nome do banco de dados |
| `DB_USER` | `admin` | Usuário do banco de dados |
| `DB_PASSWORD` | `cascaPassAdmin2` | Senha de autenticação do MySQL |
| `SERVER_PORT` | `8080` | Porta HTTP da aplicação |

Consulte o arquivo [`backend/.env.example`](.env.example) versionado no repositório.

---

## 5. 📁 Estrutura de Pastas e Bibliotecas

### 5.1 Estrutura de Pacotes

A aplicação adota separação estrita de camadas (Clean Architecture / MVC padronizado):
```text
backend/
├── src/
│   ├── main/
│   │   ├── java/com/github/melobreno/backend/
│   │   │   ├── config/          # Configurações de CORS, OpenAPI e Web
│   │   │   ├── controllers/     # Camada REST (Endpoints da API sob /api/v1)
│   │   │   ├── dto/             # DTOs de requisição e resposta (Records imutáveis)
│   │   │   ├── exceptions/      # Handler global e exceções de negócio
│   │   │   ├── model/           # Entidades JPA mapeadas para as tabelas obrigatórias
│   │   │   ├── repository/      # Interfaces Spring Data JPA
│   │   │   ├── service/         # Regras de negócio (RN01 a RN21) e orquestração
│   │   │   └── util/            # Utilitários de validação (V4, fuso horário, ordenação)
│   │   └── resources/
│   │       ├── application.properties # Parâmetros da aplicação e DataSource
│   │       └── db/migration/          # Scripts Flyway (V1__create_tables.sql)
│   └── test/
│       └── java/com/github/melobreno/backend/service/ # Testes unitários com JUnit 5 e Mockito
├── Dockerfile                   # Build multi-stage e runtime da imagem Docker
├── pom.xml                      # Descritor Maven e dependências
└── README.md                    # Documentação técnica do backend
```

### 5.2 Bibliotecas Utilizadas e Justificativas

| Biblioteca | Versão | Motivo do Uso |
| :--- | :--- | :--- |
| **Spring Boot Starter Web** | `4.0.0-M3` / `3.x` | Criação de APIs RESTful de alto desempenho e injeção de dependências |
| **Spring Boot Starter Data JPA** | `4.0.0-M3` / `3.x` | Abstração de persistência relacional com Hibernate e repositórios |
| **Spring Boot Starter Validation** | `4.0.0-M3` / `3.x` | Validação declarativa de contratos e integridade de dados (Bean Validation) |
| **Flyway Core & MySQL** | `10.x` | Controle reprodutível e versionado de migrações do banco de dados |
| **MySQL Connector/J** | `8.x` | Driver oficial de conexão JDBC com o banco relacional MySQL |
| **Lombok** | `1.18.x` | Redução de boilerplate em getters, setters e construtores de entidades |
| **Springdoc OpenAPI (Swagger)** | `2.8.5` | Documentação interativa viva dos endpoints em `/swagger-ui.html` |
| **JUnit Jupiter & Mockito** | Embutido no Starter | Criação e execução de testes unitários isolados e determinísticos |

---

## 6. 🧠 Decisões e Premissas de Arquitetura

1. **Valores Calculados Dinamicamente (Restrição da Seção 3):**
   - Atendendo à proibição expressa do edital, campos calculados (`overall`, `market_value`, `squad_value`, `net_worth`, `remaining_days`, `penalty_rate`, `points`, `position`) **não são persistidos como colunas no banco**. São calculados estritamente em tempo de consulta na camada de serviço.
2. **Centralização da Regra V4 (Normalização de Texto):**
   - Todos os inputs textuais passam pelo método `ValidacoesGeraisUtils.aplicarV4()` que realiza `trim()` nas extremidades e colapsa múltiplos espaços em branco contíguos para exatamente um espaço simples.
3. **Fuso Horário e Padrão de Data/Hora (RN01):**
   - Todas as operações utilizam `OffsetDateTime` com o fuso oficial de Brasília (`ZoneOffset.of("-03:00")`) com formatação estrita ISO-8601 (`yyyy-MM-dd'T'HH:mm:ssXXX`).
4. **Tratamento Centralizado de Exceções (`ApiExceptionHandler`):**
   - Erros de validação e dados inválidos geram `400 Bad Request`.
   - Recursos inexistentes geram `404 Not Found`.
   - Violações de regras de negócio (RNs) geram `409 Conflict`.
   - Todas as respostas de erro retornam payload padronizado `{"message": "..."}` conforme especificado na regra V8 e no barema B1.

---

## 7. 🚫 Funcionalidades não implementadas

**Nenhuma.** Todos os 4 módulos funcionais obrigatórios e todas as 21 regras de negócio (`RN01` a `RN21`) foram integralmente implementados:
- **Módulo 1: Jogadores:** RN01 a RN09 e regras V1 a V7.
- **Módulo 2: Clubes:** RN10 e RN11.
- **Módulo 3: Mercado:** RN12 a RN18.
- **Módulo 4: Liga:** RN19 a RN21.

---

## 8. 🤖 Uso de Inteligência Artificial

Em conformidade com a seção *🧭 Stack obrigatória - Uso de inteligência artificial* do edital:

- **Ferramentas Utilizadas:** Google Antigravity (Claude 3.5 Sonnet / Gemini Pro).
- **Onde foi utilizada:**
  1. Suporte no scaffolding inicial de entidades JPA e DTOs Records.
  2. Implementação das rotinas matemáticas determinísticas de Overall (RN06), Valor de Mercado (RN05), Multa/Comissão de Venda (RN15/RN16) e Duelos da Partida (RN20).
  3. Estruturação dos testes unitários com Mockito e anotações OpenAPI (Swagger).
- **Como e por que foi utilizada:** Utilizada como assistente de codificação (pair programming) para acelerar a escrita de código repetitivo e auditar o checklist de conformidade contra o edital.
- **Decisões tomadas:**
  - *Aceito:* Modelagem das regras em services dedicados (`JogadorService`, `ClubeServices`, `MercadoService`, `LigaService`), garantindo anotações Javadoc explícitas para cada RN.
  - *Alterado:* Centralização da regra V4 em classe de utilitários para evitar duplicações e padronização do tratamento de trailing slash nas rotas do Spring Boot 3/4.
  - *Descartado:* Sugestões de persistência de colunas calculadas no schema do banco, por violarem a restrição expressa da Seção 3 do edital.

---

## 9. 🌟 Diferenciais Técnicos Implementados (Critério B5)

### 9.1 Testes Automatizados (Critério B5)
O projeto conta com suíte de testes unitários automatizados cobrindo os cálculos de valor de mercado (RN02 a RN05), regras de compra/venda, escalação e simulação do cenário do edital.

Para rodar os testes (terminam sozinhos sem modo de observação):
```bash
./mvnw test
```
*(No Windows PowerShell: `.\mvnw.cmd test`)*

### 9.2 Docker e Docker Compose (Critério B5)
Comando único para subir banco e API:
```bash
docker compose up --build -d
```

### 9.3 Documentação Interativa Swagger / OpenAPI (Critério B5)
Com a aplicação em execução, acesse no navegador:
```text
http://localhost:8080/swagger-ui.html
```
Todos os endpoints dos 4 módulos estão documentados com schemas e exemplos práticos de requisição e resposta.
