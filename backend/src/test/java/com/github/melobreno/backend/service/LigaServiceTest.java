package com.github.melobreno.backend.service;

import com.github.melobreno.backend.dto.AtualizarEscalacaoRequestDto;
import com.github.melobreno.backend.dto.ClassificacaoItemDto;
import com.github.melobreno.backend.dto.CriarPartidaRequestDto;
import com.github.melobreno.backend.dto.EscalacaoDto;
import com.github.melobreno.backend.dto.JogadorDto;
import com.github.melobreno.backend.dto.PartidaDto;
import com.github.melobreno.backend.exceptions.BadRequestException;
import com.github.melobreno.backend.exceptions.BusinessException;
import com.github.melobreno.backend.model.Clube;
import com.github.melobreno.backend.model.CondicaoJogador;
import com.github.melobreno.backend.model.DueloPartida;
import com.github.melobreno.backend.model.Escalacao;
import com.github.melobreno.backend.model.EscalacaoId;
import com.github.melobreno.backend.model.Jogador;
import com.github.melobreno.backend.model.Partida;
import com.github.melobreno.backend.model.PosicaoJogador;
import com.github.melobreno.backend.repository.ClubeRepository;
import com.github.melobreno.backend.repository.DueloPartidaRepository;
import com.github.melobreno.backend.repository.EscalacaoRepository;
import com.github.melobreno.backend.repository.JogadorRepository;
import com.github.melobreno.backend.repository.PartidaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LigaServiceTest {

    @Mock
    private ClubeRepository clubeRepository;

    @Mock
    private JogadorRepository jogadorRepository;

    @Mock
    private EscalacaoRepository escalacaoRepository;

    @Mock
    private PartidaRepository partidaRepository;

    @Mock
    private DueloPartidaRepository dueloPartidaRepository;

    @Mock
    private JogadorService jogadorService;

    @InjectMocks
    private LigaService ligaService;

    @Test
    void atualizarEscalacaoComSucesso() {
        // RN19 - Escalação 2-1-1 com 1 GOL, 1 ZAG, 1 LAT, 1 MEI, 1 ATA
        Clube clube = new Clube();
        clube.setId(1);
        clube.setNome("Águias FC");

        Jogador gol = criarJogador(30, "Rui Prado", PosicaoJogador.GOL, clube, CondicaoJogador.APTO);
        Jogador lat = criarJogador(31, "Davi Lins", PosicaoJogador.LAT, clube, CondicaoJogador.MAL_CONDICIONADO);
        Jogador zag = criarJogador(32, "Téo Brandão", PosicaoJogador.ZAG, clube, CondicaoJogador.APTO);
        Jogador mei = criarJogador(33, "Lauro Neves", PosicaoJogador.MEI, clube, CondicaoJogador.APTO);
        Jogador ata = criarJogador(34, "Otto Rangel", PosicaoJogador.ATA, clube, CondicaoJogador.APTO);

        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(30)).thenReturn(Optional.of(gol));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(31)).thenReturn(Optional.of(lat));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(32)).thenReturn(Optional.of(zag));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(33)).thenReturn(Optional.of(mei));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(34)).thenReturn(Optional.of(ata));

        when(jogadorService.paraDto(any())).thenAnswer(invocation -> {
            Jogador j = invocation.getArgument(0);
            return new JogadorDto(j.getId(), j.getNome(), j.getPosicao().name(), 80, 25, j.getCondicao().name(),
                    BigDecimal.TEN, BigDecimal.TEN, 70, 70, 70, 70, 70, 70, 80, 75, 1, null);
        });

        AtualizarEscalacaoRequestDto request = new AtualizarEscalacaoRequestDto("2-1-1", List.of(34, 31, 30, 33, 32));
        EscalacaoDto dto = ligaService.atualizarEscalacao(1, request);

        assertNotNull(dto);
        assertEquals(1, dto.clubId());
        assertEquals("2-1-1", dto.formation());
        assertTrue(dto.complete());
        assertEquals(5, dto.players().size());
        // Ordem do elenco: GOL (30), ZAG (32), LAT (31), MEI (33), ATA (34)
        assertEquals(30, dto.players().get(0).id());
        assertEquals(32, dto.players().get(1).id());
        assertEquals(31, dto.players().get(2).id());
        assertEquals(33, dto.players().get(3).id());
        assertEquals(34, dto.players().get(4).id());

        verify(escalacaoRepository).deleteAllById_ClubeId(1);
    }

    @Test
    void atualizarEscalacaoFalhaQuandoJogadorNaoPertenceAoClube() {
        Clube clube1 = new Clube();
        clube1.setId(1);
        Clube clube2 = new Clube();
        clube2.setId(2);

        Jogador gol = criarJogador(30, "Rui Prado", PosicaoJogador.GOL, clube1, CondicaoJogador.APTO);
        Jogador lat = criarJogador(31, "Davi Lins", PosicaoJogador.LAT, clube2, CondicaoJogador.APTO); // clube diferente!
        Jogador zag = criarJogador(32, "Téo Brandão", PosicaoJogador.ZAG, clube1, CondicaoJogador.APTO);
        Jogador mei = criarJogador(33, "Lauro Neves", PosicaoJogador.MEI, clube1, CondicaoJogador.APTO);
        Jogador ata = criarJogador(34, "Otto Rangel", PosicaoJogador.ATA, clube1, CondicaoJogador.APTO);

        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube1));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(30)).thenReturn(Optional.of(gol));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(31)).thenReturn(Optional.of(lat));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(32)).thenReturn(Optional.of(zag));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(33)).thenReturn(Optional.of(mei));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(34)).thenReturn(Optional.of(ata));

        AtualizarEscalacaoRequestDto request = new AtualizarEscalacaoRequestDto("2-1-1", List.of(30, 31, 32, 33, 34));
        BusinessException ex = assertThrows(BusinessException.class, () -> ligaService.atualizarEscalacao(1, request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertTrue(ex.getMessage().contains("não pertence ao elenco"));
    }

    @Test
    void atualizarEscalacaoFalhaQuandoJogadorDoente() {
        Clube clube = new Clube();
        clube.setId(1);

        Jogador gol = criarJogador(30, "Rui Prado", PosicaoJogador.GOL, clube, CondicaoJogador.DOENTE); // DOENTE
        Jogador lat = criarJogador(31, "Davi Lins", PosicaoJogador.LAT, clube, CondicaoJogador.APTO);
        Jogador zag = criarJogador(32, "Téo Brandão", PosicaoJogador.ZAG, clube, CondicaoJogador.APTO);
        Jogador mei = criarJogador(33, "Lauro Neves", PosicaoJogador.MEI, clube, CondicaoJogador.APTO);
        Jogador ata = criarJogador(34, "Otto Rangel", PosicaoJogador.ATA, clube, CondicaoJogador.APTO);

        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(30)).thenReturn(Optional.of(gol));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(31)).thenReturn(Optional.of(lat));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(32)).thenReturn(Optional.of(zag));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(33)).thenReturn(Optional.of(mei));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(34)).thenReturn(Optional.of(ata));

        AtualizarEscalacaoRequestDto request = new AtualizarEscalacaoRequestDto("2-1-1", List.of(30, 31, 32, 33, 34));
        BusinessException ex = assertThrows(BusinessException.class, () -> ligaService.atualizarEscalacao(1, request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertTrue(ex.getMessage().contains("está DOENTE"));
    }

    @Test
    void atualizarEscalacaoFalhaQuandoPosicoesNaoFechamFormacao() {
        Clube clube = new Clube();
        clube.setId(1);

        // 2 atacantes para uma formacao 2-1-1 (que exige 1 ATA e 1 MEI)
        Jogador gol = criarJogador(30, "Rui Prado", PosicaoJogador.GOL, clube, CondicaoJogador.APTO);
        Jogador lat = criarJogador(31, "Davi Lins", PosicaoJogador.LAT, clube, CondicaoJogador.APTO);
        Jogador zag = criarJogador(32, "Téo Brandão", PosicaoJogador.ZAG, clube, CondicaoJogador.APTO);
        Jogador ata1 = criarJogador(33, "Lauro Neves", PosicaoJogador.ATA, clube, CondicaoJogador.APTO);
        Jogador ata2 = criarJogador(34, "Otto Rangel", PosicaoJogador.ATA, clube, CondicaoJogador.APTO);

        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(30)).thenReturn(Optional.of(gol));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(31)).thenReturn(Optional.of(lat));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(32)).thenReturn(Optional.of(zag));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(33)).thenReturn(Optional.of(ata1));
        when(jogadorRepository.findByIdAndExcluidoEmIsNull(34)).thenReturn(Optional.of(ata2));

        AtualizarEscalacaoRequestDto request = new AtualizarEscalacaoRequestDto("2-1-1", List.of(30, 31, 32, 33, 34));
        BusinessException ex = assertThrows(BusinessException.class, () -> ligaService.atualizarEscalacao(1, request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertTrue(ex.getMessage().contains("não atendem à formação"));
    }

    @Test
    void simularPartidaCenarioExatoDoEdital() {
        // RN20 - Partida entre Águias FC (mandante) e Delta FC (visitante)
        Clube aguias = new Clube();
        aguias.setId(1);
        aguias.setNome("Águias FC");
        aguias.setFormacao("2-1-1");

        Clube delta = new Clube();
        delta.setId(2);
        delta.setNome("Delta FC");
        delta.setFormacao("2-1-1");

        // Mandante: Águias FC
        Jogador mGol = criarJogador(30, "Rui Prado", PosicaoJogador.GOL, aguias, CondicaoJogador.APTO);
        mGol.setDefesa(77);

        Jogador mZag = criarJogador(32, "Téo Brandão", PosicaoJogador.ZAG, aguias, CondicaoJogador.APTO);
        mZag.setDefesa(84);
        mZag.setDrible(50);

        Jogador mLat = criarJogador(31, "Davi Lins", PosicaoJogador.LAT, aguias, CondicaoJogador.MAL_CONDICIONADO);
        mLat.setDrible(74); // 74 * 0.85 = 62.9 -> 63
        mLat.setDefesa(66); // 66 * 0.85 = 56.1 -> 56

        Jogador mMei = criarJogador(33, "Lauro Neves", PosicaoJogador.MEI, aguias, CondicaoJogador.APTO);
        mMei.setPasse(82);

        Jogador mAta = criarJogador(34, "Otto Rangel", PosicaoJogador.ATA, aguias, CondicaoJogador.APTO);
        mAta.setFinalizacao(75);

        // Visitante: Delta FC
        Jogador vGol = criarJogador(40, "Ivo Teles", PosicaoJogador.GOL, delta, CondicaoJogador.APTO);
        vGol.setDefesa(72);

        Jogador vZag = criarJogador(41, "Hugo Vaz", PosicaoJogador.ZAG, delta, CondicaoJogador.APTO);
        vZag.setDefesa(84);

        Jogador vLat = criarJogador(42, "Lino Matos", PosicaoJogador.LAT, delta, CondicaoJogador.APTO);
        vLat.setDrible(79);
        vLat.setDefesa(63);

        Jogador vMei = criarJogador(43, "Nei Soares", PosicaoJogador.MEI, delta, CondicaoJogador.APTO);
        vMei.setPasse(70);

        Jogador vAta = criarJogador(44, "Ugo Falcão", PosicaoJogador.ATA, delta, CondicaoJogador.APTO);
        vAta.setFinalizacao(81);

        when(clubeRepository.findById(1)).thenReturn(Optional.of(aguias));
        when(clubeRepository.findById(2)).thenReturn(Optional.of(delta));

        when(escalacaoRepository.findAllById_ClubeIdOrderByCriadoEmAsc(1)).thenReturn(List.of(
                criarEscalacao(aguias, mGol),
                criarEscalacao(aguias, mLat),
                criarEscalacao(aguias, mZag),
                criarEscalacao(aguias, mMei),
                criarEscalacao(aguias, mAta)
        ));

        when(escalacaoRepository.findAllById_ClubeIdOrderByCriadoEmAsc(2)).thenReturn(List.of(
                criarEscalacao(delta, vGol),
                criarEscalacao(delta, vZag),
                criarEscalacao(delta, vLat),
                criarEscalacao(delta, vMei),
                criarEscalacao(delta, vAta)
        ));

        when(partidaRepository.save(any(Partida.class))).thenAnswer(invocation -> {
            Partida p = invocation.getArgument(0);
            p.setId(100);
            return p;
        });

        CriarPartidaRequestDto request = new CriarPartidaRequestDto(1, 2);
        PartidaDto partida = ligaService.jogarPartida(request);

        assertNotNull(partida);
        assertEquals(100, partida.id());
        assertEquals("VISITANTE", partida.result());
        assertEquals(1, partida.home().goals());
        assertEquals(2, partida.away().goals());
        assertEquals(6, partida.duels().size());

        // Duelo 1: Otto Rangel (ATA finalização 75) vs Ivo Teles (GOL defesa 72) -> gol = true
        assertTrue(partida.duels().get(0).goal());
        assertEquals("shooting", partida.duels().get(0).attacker().attribute());
        assertEquals(75, partida.duels().get(0).attacker().value());
        assertEquals(72, partida.duels().get(0).defender().value());

        // Duelo 2: Lauro Neves (MEI passe 82) vs Hugo Vaz (ZAG defesa 84) -> gol = false
        assertFalse(partida.duels().get(1).goal());
        assertEquals(82, partida.duels().get(1).attacker().value());
        assertEquals(84, partida.duels().get(1).defender().value());

        // Duelo 3: Davi Lins (LAT drible 63) vs Lino Matos (LAT defesa 63) -> empate = false
        assertFalse(partida.duels().get(2).goal());
        assertEquals(63, partida.duels().get(2).attacker().value());
        assertEquals(63, partida.duels().get(2).defender().value());

        // Duelo 4: Ugo Falcão (ATA finalização 81) vs Rui Prado (GOL defesa 77) -> gol = true
        assertTrue(partida.duels().get(3).goal());
        assertEquals(81, partida.duels().get(3).attacker().value());
        assertEquals(77, partida.duels().get(3).defender().value());

        // Duelo 5: Nei Soares (MEI passe 70) vs Téo Brandão (ZAG defesa 84) -> gol = false
        assertFalse(partida.duels().get(4).goal());
        assertEquals(70, partida.duels().get(4).attacker().value());
        assertEquals(84, partida.duels().get(4).defender().value());

        // Duelo 6: Lino Matos (LAT drible 79) vs Davi Lins (LAT defesa 56) -> gol = true
        assertTrue(partida.duels().get(5).goal());
        assertEquals(79, partida.duels().get(5).attacker().value());
        assertEquals(56, partida.duels().get(5).defender().value());
    }

    @Test
    void obterClassificacaoComDesempatePorSaldoGolsENome() {
        // RN21 - Tabela de classificação com 6 clubes:
        // Gama SC: 6 pts
        // Épsilon EC: 3 pts, saldo 0, 4 gols marcados
        // Delta FC: 3 pts, saldo 0, 2 gols marcados
        // Mangue FC: 0 pts, saldo 0, 0 gols marcados
        // Tubarões EC: 0 pts, saldo 0, 0 gols marcados
        // Águias FC: 0 pts, saldo -2, 3 gols marcados
        Clube aguias = criarClube(1, "Águias FC");
        Clube delta = criarClube(2, "Delta FC");
        Clube gama = criarClube(3, "Gama SC");
        Clube epsilon = criarClube(4, "Épsilon EC");
        Clube mangue = criarClube(5, "Mangue FC");
        Clube tubaroes = criarClube(6, "Tubarões EC");

        when(clubeRepository.findAll()).thenReturn(List.of(aguias, delta, gama, epsilon, mangue, tubaroes));

        // Partidas:
        // 1) Águias 1 x 2 Delta
        Partida p1 = criarPartidaSimulada(aguias, delta, 1, 2);
        // 2) Gama 2 x 1 Épsilon
        Partida p2 = criarPartidaSimulada(gama, epsilon, 2, 1);
        // 3) Épsilon 3 x 2 Águias
        Partida p3 = criarPartidaSimulada(epsilon, aguias, 3, 2);
        // 4) Delta 0 x 1 Gama
        Partida p4 = criarPartidaSimulada(delta, gama, 0, 1);

        when(partidaRepository.findAll()).thenReturn(List.of(p1, p2, p3, p4));

        List<ClassificacaoItemDto> standings = ligaService.obterClassificacao();

        assertEquals(6, standings.size());

        // 1º Gama SC
        assertEquals(1, standings.get(0).position());
        assertEquals("Gama SC", standings.get(0).clubName());
        assertEquals(6, standings.get(0).points());

        // 2º Épsilon EC
        assertEquals(2, standings.get(1).position());
        assertEquals("Épsilon EC", standings.get(1).clubName());
        assertEquals(3, standings.get(1).points());
        assertEquals(0, standings.get(1).goalDifference());
        assertEquals(4, standings.get(1).goalsFor());

        // 3º Delta FC
        assertEquals(3, standings.get(2).position());
        assertEquals("Delta FC", standings.get(2).clubName());
        assertEquals(3, standings.get(2).points());
        assertEquals(0, standings.get(2).goalDifference());
        assertEquals(2, standings.get(2).goalsFor());

        // 4º Mangue FC (ordem alfabética antes de Tubarões)
        assertEquals(4, standings.get(3).position());
        assertEquals("Mangue FC", standings.get(3).clubName());
        assertEquals(0, standings.get(3).points());
        assertEquals(0, standings.get(3).goalDifference());

        // 5º Tubarões EC
        assertEquals(5, standings.get(4).position());
        assertEquals("Tubarões EC", standings.get(4).clubName());
        assertEquals(0, standings.get(4).points());
        assertEquals(0, standings.get(4).goalDifference());

        // 6º Águias FC
        assertEquals(6, standings.get(5).position());
        assertEquals("Águias FC", standings.get(5).clubName());
        assertEquals(0, standings.get(5).points());
        assertEquals(-2, standings.get(5).goalDifference());
    }

    private Clube criarClube(Integer id, String nome) {
        Clube c = new Clube();
        c.setId(id);
        c.setNome(nome);
        return c;
    }

    private Partida criarPartidaSimulada(Clube mandante, Clube visitante, int gm, int gv) {
        Partida p = new Partida();
        p.setMandante(mandante);
        p.setVisitante(visitante);
        p.setGolsMandante(gm);
        p.setGolsVisitante(gv);
        p.setFormacaoMandante("2-1-1");
        p.setFormacaoVisitante("2-1-1");
        p.setJogadaEm(OffsetDateTime.now());
        return p;
    }

    private Escalacao criarEscalacao(Clube clube, Jogador jogador) {
        Escalacao e = new Escalacao();
        e.setId(new EscalacaoId(clube.getId(), jogador.getId()));
        e.setClube(clube);
        e.setJogador(jogador);
        e.setCriadoEm(OffsetDateTime.now());
        return e;
    }

    private Jogador criarJogador(Integer id, String nome, PosicaoJogador posicao, Clube clube, CondicaoJogador condicao) {
        Jogador j = new Jogador();
        j.setId(id);
        j.setNome(nome);
        j.setPosicao(posicao);
        j.setClube(clube);
        j.setCondicao(condicao);
        j.setVelocidade(70);
        j.setFinalizacao(70);
        j.setPasse(70);
        j.setDrible(70);
        j.setDefesa(70);
        j.setFisico(70);
        return j;
    }
}
