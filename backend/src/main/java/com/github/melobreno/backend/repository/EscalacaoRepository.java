package com.github.melobreno.backend.repository;

import com.github.melobreno.backend.model.Escalacao;
import com.github.melobreno.backend.model.EscalacaoId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EscalacaoRepository extends JpaRepository<Escalacao, EscalacaoId> {

    List<Escalacao> findAllById_ClubeIdOrderByCriadoEmAsc(Long clubeId);

    boolean existsByJogador_Id(Long jogadorId);

    void deleteAllById_ClubeId(Long clubeId);
}
