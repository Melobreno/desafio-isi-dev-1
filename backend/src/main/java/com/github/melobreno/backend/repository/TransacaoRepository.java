package com.github.melobreno.backend.repository;

import com.github.melobreno.backend.model.Transacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransacaoRepository extends JpaRepository<Transacao, Integer> {

    List<Transacao> findAllByClube_IdOrderByCriadoEmDescIdDesc(Integer clubeId);

    List<Transacao> findAllByClube_IdAndTipoOrderByCriadoEmDescIdDesc(Integer clubeId, String tipo);

    List<Transacao> findAllByClube_IdAndJogador_IdOrderByCriadoEmDescIdDesc(Integer clubeId, Integer jogadorId);

    List<Transacao> findAllByClube_IdAndTipoAndJogador_IdOrderByCriadoEmDescIdDesc(
            Integer clubeId,
            String tipo,
            Integer jogadorId
    );
}
