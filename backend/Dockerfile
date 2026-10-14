# Estágio 1: Build da aplicação Java com Maven e JDK 21
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

# Copia os arquivos de configuração do Maven e o código fonte
COPY pom.xml .
COPY src ./src

# Compila o projeto e gera o pacote JAR sem executar a suíte de testes durante o build
RUN mvn clean package -DskipTests

# Estágio 2: Imagem final de execução leve com JRE 21
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copia o artefato gerado no estágio anterior
COPY --from=build /app/target/*.jar app.jar

# Expõe a porta padrão do Spring Boot
EXPOSE 8080

# Comando para iniciar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]