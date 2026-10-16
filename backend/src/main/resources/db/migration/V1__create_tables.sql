CREATE TABLE IF NOT EXISTS `clubes` (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(60) NOT NULL UNIQUE,
    sigla CHAR(3) NOT NULL UNIQUE,
    caixa DECIMAL(10,2) NOT NULL DEFAULT 300.00,
    formacao VARCHAR(5) NULL,
    criado_em TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS `jogadores` (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    posicao ENUM('GOL', 'ZAG', 'LAT', 'MEI', 'ATA') NOT NULL,
    agilidade INT NOT NULL,
    idade INT NOT NULL,
    valor_base DECIMAL(6,2) NOT NULL,
    condicao ENUM('APTO', 'MAL_CONDICIONADO', 'DOENTE') NOT NULL DEFAULT 'APTO',
    clube_id INT NULL,
    velocidade INT NOT NULL,
    finalizacao INT NOT NULL,
    passe INT NOT NULL,
    drible INT NOT NULL,
    defesa INT NOT NULL,
    fisico INT NOT NULL,
    potencial INT NOT NULL,
    excluido_em TIMESTAMP NULL,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT `fk_jogadores_clubes` FOREIGN KEY (clube_id) REFERENCES `clubes` (id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `contratos` (
    id INT NOT NULL AUTO_INCREMENT,
    jogador_id INT NOT NULL,
    clube_id INT NOT NULL,
    valor_compra DECIMAL(6,2) NOT NULL,
    fidelidade_ate TIMESTAMP NOT NULL,
    situacao ENUM('ATIVO', 'ENCERRADO', 'RESCINDIDO') NOT NULL,
    iniciado_em TIMESTAMP NOT NULL,
    encerrado_em TIMESTAMP NULL,
    PRIMARY KEY (id),
    CONSTRAINT `fk_contratos_jogadores` FOREIGN KEY (jogador_id) REFERENCES `jogadores` (id),
    CONSTRAINT `fk_contratos_clubes` FOREIGN KEY (clube_id) REFERENCES `clubes` (id)
);

CREATE TABLE IF NOT EXISTS `transacoes` (
    id INT NOT NULL AUTO_INCREMENT,
    clube_id INT NOT NULL,
    jogador_id INT NOT NULL,
    nome_jogador VARCHAR(100) NOT NULL,
    tipo ENUM('COMPRA', 'VENDA') NOT NULL,
    valor DECIMAL(6,2) NOT NULL,
    taxa DECIMAL(6,2) NOT NULL,
    multa DECIMAL(6,2) NOT NULL,
    lucro DECIMAL(7,2) NULL,
    variacao_caixa DECIMAL(8,2) NOT NULL,
    criado_em TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT `fk_transacoes_clubes` FOREIGN KEY (clube_id) REFERENCES `clubes` (id),
    CONSTRAINT `fk_transacoes_jogadores` FOREIGN KEY (jogador_id) REFERENCES `jogadores` (id)
);

CREATE TABLE IF NOT EXISTS `escalacoes` (
    clube_id INT NOT NULL,
    jogador_id INT NOT NULL UNIQUE,
    criado_em TIMESTAMP NOT NULL,
    PRIMARY KEY (clube_id, jogador_id),
    CONSTRAINT `fk_escalacoes_clubes` FOREIGN KEY (clube_id) REFERENCES `clubes` (id),
    CONSTRAINT `fk_escalacoes_jogadores` FOREIGN KEY (jogador_id) REFERENCES `jogadores` (id)
);

CREATE TABLE IF NOT EXISTS `partidas` (
    id INT NOT NULL AUTO_INCREMENT,
    mandante_id INT NOT NULL,
    visitante_id INT NOT NULL,
    gols_mandante INT NOT NULL,
    gols_visitante INT NOT NULL,
    formacao_mandante VARCHAR(5) NOT NULL,
    formacao_visitante VARCHAR(5) NOT NULL,
    jogada_em TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT `fk_partidas_mandante` FOREIGN KEY (mandante_id) REFERENCES `clubes` (id),
    CONSTRAINT `fk_partidas_visitante` FOREIGN KEY (visitante_id) REFERENCES `clubes` (id)
);

CREATE TABLE IF NOT EXISTS `duelos_partida` (
    id INT NOT NULL AUTO_INCREMENT,
    partida_id INT NOT NULL,
    ordem INT NOT NULL,
    clube_atacante_id INT NOT NULL,
    atacante_id INT NOT NULL,
    defensor_id INT NOT NULL,
    nome_atacante VARCHAR(100) NOT NULL,
    nome_defensor VARCHAR(100) NOT NULL,
    posicao_atacante ENUM('GOL', 'ZAG', 'LAT', 'MEI', 'ATA') NOT NULL,
    posicao_defensor ENUM('GOL', 'ZAG', 'LAT', 'MEI', 'ATA') NOT NULL,
    condicao_atacante ENUM('APTO', 'MAL_CONDICIONADO') NOT NULL,
    condicao_defensor ENUM('APTO', 'MAL_CONDICIONADO') NOT NULL,
    atributo_ataque ENUM('shooting', 'passing', 'dribbling', 'defending') NOT NULL,
    atributo_defesa ENUM('shooting', 'passing', 'dribbling', 'defending') NOT NULL,
    valor_ataque INT NOT NULL,
    valor_defesa INT NOT NULL,
    gol BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT `fk_duelos_partidas` FOREIGN KEY (partida_id) REFERENCES `partidas` (id),
    CONSTRAINT `fk_duelos_clubes` FOREIGN KEY (clube_atacante_id) REFERENCES `clubes` (id),
    CONSTRAINT `fk_duelos_atacantes` FOREIGN KEY (atacante_id) REFERENCES `jogadores` (id),
    CONSTRAINT `fk_duelos_defensores` FOREIGN KEY (defensor_id) REFERENCES `jogadores` (id)
);