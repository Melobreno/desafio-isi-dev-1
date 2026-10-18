package com.github.melobreno.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clubes")
@Getter
@Setter
@NoArgsConstructor
public class Clube {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 60, unique = true)
    private String nome;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(nullable = false, length = 3, unique = true, columnDefinition = "CHAR(3)")
    private String sigla;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal caixa;

    @Column(length = 5)
    private String formacao;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;

    @OneToMany(mappedBy = "clube")
    private List<Jogador> jogadores = new ArrayList<>();
}
