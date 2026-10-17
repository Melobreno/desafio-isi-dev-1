package com.github.melobreno.backend.controllers;

import com.github.melobreno.backend.dto.AlterarCondicaoRequestDto;
import com.github.melobreno.backend.dto.AtualizarJogadorRequestDto;
import com.github.melobreno.backend.dto.CriarJogadorRequestDto;
import com.github.melobreno.backend.dto.CriarJogadorResponseDto;
import com.github.melobreno.backend.dto.JogadorDto;
import com.github.melobreno.backend.dto.PaginaJogadoresDto;
import com.github.melobreno.backend.service.JogadorService;
import com.github.melobreno.backend.util.ValidacoesGeraisUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.net.URI;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/players")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Jogadores", description = "Operações relacionadas a cadastro, consulta, listagem paginada, edição e exclusão lógica de jogadores")
public class JogadorController {

    private final JogadorService jogadorService;

    @PostMapping
    @Operation(
            summary = "Cadastra um jogador",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CriarJogadorRequestDto.class),
                            examples = @ExampleObject(
                                    name = "Criar jogador",
                                    value = """
                                            {
                                              "name": "Lucas Ferreira",
                                              "position": "ATA",
                                              "agility": 85,
                                              "age": 24,
                                              "pace": 78,
                                              "shooting": 82,
                                              "passing": 70,
                                              "dribbling": 80,
                                              "defending": 45,
                                              "physical": 74,
                                              "potential": 88
                                            }
                                            """
                            )
                    )
            )
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Jogador cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados do jogador inválidos")
    })
    public ResponseEntity<CriarJogadorResponseDto> criarJogador(
            @RequestBody CriarJogadorRequestDto requestDto) {
        CriarJogadorResponseDto jogador = jogadorService.criarJogador(requestDto);
        URI location = URI.create("/api/v1/players/" + jogador.id());
        return ResponseEntity.created(location).body(jogador);
    }

    @Operation(summary = "Busca jogador pelo ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Jogador encontrado"),
            @ApiResponse(responseCode = "404", description = "Jogador inexistente ou excluído")
    })
    @GetMapping("/{id}")
    public ResponseEntity<JogadorDto> buscarJogador(@PathVariable String id) {
        return ResponseEntity.ok(jogadorService.buscarJogadorId(ValidacoesGeraisUtils.idUrl(id)));
    }

    @Operation(summary = "Lista jogadores com busca, filtros, ordenação e paginação")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista paginada"),
            @ApiResponse(responseCode = "400", description = "Parâmetro inválido"),
            @ApiResponse(responseCode = "404", description = "Clube inexistente")
    })
    @GetMapping
    public ResponseEntity<PaginaJogadoresDto> listarJogadores(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String free,
            @RequestParam(name = "club_id", required = false) String clubId,
            @RequestParam(name = "min_age", required = false) String minAge,
            @RequestParam(name = "max_age", required = false) String maxAge,
            @RequestParam(name = "min_value", required = false) String minValue,
            @RequestParam(name = "max_value", required = false) String maxValue,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String limit) {
        return ResponseEntity.ok(jogadorService.listarJogadores(
                search,
                position,
                condition,
                free == null ? null : ValidacoesGeraisUtils.validaBooleanoCase("free", free),
                parseClubIdQuery("club_id", clubId),
                parseIntegerQuery("min_age", minAge),
                parseIntegerQuery("max_age", maxAge),
                parseDecimalQuery("min_value", minValue),
                parseDecimalQuery("max_value", maxValue),
                sort,
                parseIntegerQuery("page", page),
                parseIntegerQuery("limit", limit)
        ));
    }

    @Operation(summary = "Atualiza os dados editáveis de um jogador")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Jogador atualizado"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Jogador inexistente ou excluído"),
            @ApiResponse(responseCode = "409", description = "Conflito com as regras do jogador")
    })
    @PutMapping("/{id}")
    public ResponseEntity<JogadorDto> atualizarJogador(
            @PathVariable String id,
            @RequestBody AtualizarJogadorRequestDto request) {
        return ResponseEntity.ok(jogadorService.atualizarJogador(
                ValidacoesGeraisUtils.idUrl(id), request));
    }

    @Operation(summary = "Altera a condição física do jogador")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Condição atualizada"),
            @ApiResponse(responseCode = "400", description = "Condição inválida"),
            @ApiResponse(responseCode = "404", description = "Jogador inexistente ou excluído"),
            @ApiResponse(responseCode = "409", description = "Transição de condição não permitida")
    })
    @PatchMapping("/{id}/condition")
    public ResponseEntity<JogadorDto> alterarCondicao(
            @PathVariable String id,
            @RequestBody AlterarCondicaoRequestDto request) {
        return ResponseEntity.ok(jogadorService.alterarCondicao(
                ValidacoesGeraisUtils.idUrl(id), request));
    }

    @Operation(summary = "Exclui logicamente um jogador livre")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Jogador excluído"),
            @ApiResponse(responseCode = "404", description = "Jogador inexistente ou excluído"),
            @ApiResponse(responseCode = "409", description = "Jogador vinculado a um clube")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirJogador(@PathVariable String id) {
        jogadorService.excluirJogador(ValidacoesGeraisUtils.idUrl(id));
        return ResponseEntity.noContent().build();
    }

    private Integer parseClubIdQuery(String name, String value) {
        return parseIntegerQuery(name, value);
    }

    private Integer parseIntegerQuery(String name, String value) {
        return value == null ? null : ValidacoesGeraisUtils.inteiroPositivo(name, value);
    }

    private BigDecimal parseDecimalQuery(String name, String value) {
        return value == null ? null : ValidacoesGeraisUtils.validaDecimal(
                name, value, BigDecimal.ZERO, new BigDecimal("550"));
    }

}
