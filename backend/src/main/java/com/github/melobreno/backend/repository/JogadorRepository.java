package com.github.melobreno.backend.repository;

import com.github.melobreno.backend.model.Jogador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JogadorRepository extends JpaRepository<Jogador, Integer> {

    List<Jogador> findAllByExcluidoEmIsNull();

    Optional<Jogador> findByIdAndExcluidoEmIsNull(Integer id);

    List<Jogador> findAllByClube_IdAndExcluidoEmIsNull(Integer clubeId);
}
