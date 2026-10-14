package com.github.melobreno.backend.repository;

import com.github.melobreno.backend.model.Transacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransacaoRepository extends JpaRepository<Transacao, Long> {

    List<Transacao> findAllByClube_IdOrderByCriadoEmDescIdDesc(Long clubeId);

    List<Transacao> findAllByClube_IdAndTipoOrderByCriadoEmDescIdDesc(Long clubeId, String tipo);

    List<Transacao> findAllByClube_IdAndJogador_IdOrderByCriadoEmDescIdDesc(Long clubeId, Long jogadorId);

    List<Transacao> findAllByClube_IdAndTipoAndJogador_IdOrderByCriadoEmDescIdDesc(
            Long clubeId,
            String tipo,
            Long jogadorId
    );
}
