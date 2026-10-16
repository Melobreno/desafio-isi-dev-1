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
@Table(name = "contratos")
@Getter
@Setter
@NoArgsConstructor
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jogador_id", nullable = false)
    private Jogador jogador;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clube_id", nullable = false)
    private Clube clube;

    @Column(name = "valor_compra", nullable = false, precision = 6, scale = 2)
    private BigDecimal valorCompra;

    @Column(name = "fidelidade_ate", nullable = false)
    private OffsetDateTime fidelidadeAte;

    @Column(nullable = false, length = 12)
    private String situacao;

    @Column(name = "iniciado_em", nullable = false)
    private OffsetDateTime iniciadoEm;

    @Column(name = "encerrado_em")
    private OffsetDateTime encerradoEm;
}
