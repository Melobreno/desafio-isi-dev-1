package com.github.melobreno.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "transacoes")
@Getter
@Setter
@NoArgsConstructor
public class Transacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clube_id", nullable = false)
    private Clube clube;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jogador_id", nullable = false)
    private Jogador jogador;

    @Column(name = "nome_jogador", nullable = false, length = 100)
    private String nomeJogador;

    @Column(nullable = false, length = 6)
    private String tipo;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal taxa;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal multa;

    @Column(precision = 7, scale = 2)
    private BigDecimal lucro;

    @Column(name = "variacao_caixa", nullable = false, precision = 8, scale = 2)
    private BigDecimal variacaoCaixa;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;
}
