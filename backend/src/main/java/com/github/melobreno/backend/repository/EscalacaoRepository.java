package com.github.melobreno.backend.repository;

import com.github.melobreno.backend.model.Escalacao;
import com.github.melobreno.backend.model.EscalacaoId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EscalacaoRepository extends JpaRepository<Escalacao, EscalacaoId> {

    List<Escalacao> findAllById_ClubeIdOrderByCriadoEmAsc(Integer clubeId);

    boolean existsByJogador_Id(Integer jogadorId);

    void deleteAllById_ClubeId(Integer clubeId);

    void deleteById_JogadorId(Integer jogadorId);
}
