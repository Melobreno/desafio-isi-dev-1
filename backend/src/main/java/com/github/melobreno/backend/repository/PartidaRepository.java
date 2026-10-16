package com.github.melobreno.backend.repository;

import com.github.melobreno.backend.model.Partida;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartidaRepository extends JpaRepository<Partida, Integer> {

    List<Partida> findAllByOrderByJogadaEmDescIdDesc();

    List<Partida> findAllByMandante_IdOrVisitante_IdOrderByJogadaEmDescIdDesc(Integer mandanteId, Integer visitanteId);
}
