package com.github.melobreno.backend.model;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "escalacoes")
@Getter
@Setter
@NoArgsConstructor
public class Escalacao {

    @EmbeddedId
    private EscalacaoId id;

    @MapsId("clubeId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clube_id", nullable = false)
    private Clube clube;

    @MapsId("jogadorId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jogador_id", nullable = false, unique = true)
    private Jogador jogador;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;
}
