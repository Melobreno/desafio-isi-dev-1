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

@Entity
@Table(name = "duelos_partida")
@Getter
@Setter
@NoArgsConstructor
public class DueloPartida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "partida_id", nullable = false)
    private Partida partida;

    @Column(nullable = false)
    private Integer ordem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clube_atacante_id", nullable = false)
    private Clube clubeAtacante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "atacante_id", nullable = false)
    private Jogador atacante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "defensor_id", nullable = false)
    private Jogador defensor;

    @Column(name = "nome_atacante", nullable = false, length = 100)
    private String nomeAtacante;

    @Column(name = "nome_defensor", nullable = false, length = 100)
    private String nomeDefensor;

    @Column(name = "posicao_atacante", nullable = false, length = 3)
    private String posicaoAtacante;

    @Column(name = "posicao_defensor", nullable = false, length = 3)
    private String posicaoDefensor;

    @Column(name = "condicao_atacante", nullable = false, length = 20)
    private String condicaoAtacante;

    @Column(name = "condicao_defensor", nullable = false, length = 20)
    private String condicaoDefensor;

    @Column(name = "atributo_ataque", nullable = false, length = 10)
    private String atributoAtaque;

    @Column(name = "atributo_defesa", nullable = false, length = 10)
    private String atributoDefesa;

    @Column(name = "valor_ataque", nullable = false)
    private Integer valorAtaque;

    @Column(name = "valor_defesa", nullable = false)
    private Integer valorDefesa;

    @Column(nullable = false)
    private Boolean gol;
}
