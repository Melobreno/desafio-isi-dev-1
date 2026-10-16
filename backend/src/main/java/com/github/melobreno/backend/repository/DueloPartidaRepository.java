package com.github.melobreno.backend.repository;

import com.github.melobreno.backend.model.DueloPartida;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DueloPartidaRepository extends JpaRepository<DueloPartida, Integer> {

    List<DueloPartida> findAllByPartida_IdOrderByOrdemAsc(Integer partidaId);
}
