package com.github.melobreno.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "jogadores")
@Getter
@Setter
@NoArgsConstructor
public class Jogador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 3)
    private PosicaoJogador posicao;

    @Column(nullable = false)
    private Integer agilidade;

    @Column(nullable = false)
    private Integer idade;

    @Column(name = "valor_base", nullable = false, precision = 6, scale = 2)
    private BigDecimal valorBase;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private CondicaoJogador condicao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clube_id")
    private Clube clube;

    @Column(nullable = false)
    private Integer velocidade;

    @Column(nullable = false)
    private Integer finalizacao;

    @Column(nullable = false)
    private Integer passe;

    @Column(nullable = false)
    private Integer drible;

    @Column(nullable = false)
    private Integer defesa;

    @Column(nullable = false)
    private Integer fisico;

    @Column(nullable = false)
    private Integer potencial;

    @Column(name = "excluido_em")
    private OffsetDateTime excluidoEm;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;
}
