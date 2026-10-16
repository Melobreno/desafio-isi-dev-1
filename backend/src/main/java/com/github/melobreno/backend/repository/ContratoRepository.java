package com.github.melobreno.backend.repository;

import com.github.melobreno.backend.model.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContratoRepository extends JpaRepository<Contrato, Integer> {

    Optional<Contrato> findFirstByJogador_IdAndSituacaoOrderByIniciadoEmDesc(Integer jogadorId, String situacao);

    List<Contrato> findAllByClube_IdAndSituacao(Integer clubeId, String situacao);
}
