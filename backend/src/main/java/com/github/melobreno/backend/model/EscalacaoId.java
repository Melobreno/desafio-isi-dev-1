package com.github.melobreno.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class EscalacaoId implements Serializable {

    @Column(name = "clube_id", nullable = false)
    private Integer clubeId;

    @Column(name = "jogador_id", nullable = false)
    private Integer jogadorId;
}
