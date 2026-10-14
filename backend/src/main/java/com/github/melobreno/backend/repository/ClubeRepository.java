package com.github.melobreno.backend.repository;

import com.github.melobreno.backend.model.Clube;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClubeRepository extends JpaRepository<Clube, Long> {

    boolean existsByNomeIgnoreCase(String nome);

    boolean existsBySiglaIgnoreCase(String sigla);
}
