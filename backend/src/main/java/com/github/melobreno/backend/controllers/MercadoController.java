package com.github.melobreno.backend.controllers;

import com.github.melobreno.backend.dto.ComprarJogadorRequestDto;
import com.github.melobreno.backend.dto.HistoricoTransacoesDto;
import com.github.melobreno.backend.dto.TransacaoDto;
import com.github.melobreno.backend.service.MercadoService;
import com.github.melobreno.backend.util.ValidacoesGeraisUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "Mercado", description = "Operações do mercado de jogadores, compras, vendas, histórico e exportação CSV")
public class MercadoController {

    private final MercadoService mercadoService;

    @PostMapping("/players/{id}/buy")
    @Operation(
            summary = "Compra um jogador livre para um clube",
            description = "Compra um jogador pelo valor de mercado atual acrescido de taxa (se > 30,00), respeitando o limite de 50% do caixa e 12 jogadores no elenco.",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ComprarJogadorRequestDto.class),
                            examples = @ExampleObject(
                                    name = "Comprar jogador",
                                    value = """
                                            {
                                              "club_id": 1,
                                              "loyalty_until": "2027-03-02T10:15-03:00"
                                            }
                                            """
                            )
                    )
            )
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Compra realizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TransacaoDto.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos ou fidelidade fora do padrão/limite"),
            @ApiResponse(responseCode = "404", description = "Jogador ou clube inexistente"),
            @ApiResponse(responseCode = "409", description = "Conflito com regras de compra (caixa insuficiente, elenco cheio, jogador já pertence a clube ou recompra proibida)")
    })
    public ResponseEntity<TransacaoDto> comprarJogador(
            @io.swagger.v3.oas.annotations.Parameter(description = "ID do jogador a ser comprado", example = "2")
            @PathVariable String id,
            @RequestBody ComprarJogadorRequestDto request) {
        return ResponseEntity.ok(mercadoService.comprarJogador(ValidacoesGeraisUtils.idUrl(id), request));
    }

    @PostMapping("/players/{id}/sell")
    @Operation(
            summary = "Vende um jogador do elenco pelo clube atual",
            description = "Vende o jogador pelo valor de mercado atual, aplicando multa por fidelidade não cumprida e comissão progressiva sobre o lucro."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Venda realizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TransacaoDto.class))),
            @ApiResponse(responseCode = "404", description = "Jogador inexistente"),
            @ApiResponse(responseCode = "409", description = "Jogador livre (não pertence a nenhum clube)")
    })
    public ResponseEntity<TransacaoDto> venderJogador(
            @io.swagger.v3.oas.annotations.Parameter(description = "ID do jogador a ser vendido", example = "2")
            @PathVariable String id) {
        return ResponseEntity.ok(mercadoService.venderJogador(ValidacoesGeraisUtils.idUrl(id)));
    }

    @GetMapping("/clubs/{id}/transactions")
    @Operation(
            summary = "Consulta o histórico de transações de um clube com resumo de totais",
            description = "Retorna todas as compras e vendas realizadas pelo clube com resumo financeiro (summary), com filtros opcionais por tipo e jogador."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Histórico de transações obtido com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = HistoricoTransacoesDto.class))),
            @ApiResponse(responseCode = "400", description = "Filtro type ou player_id inválido"),
            @ApiResponse(responseCode = "404", description = "Clube ou jogador inexistente")
    })
    public ResponseEntity<HistoricoTransacoesDto> listarTransacoes(
            @io.swagger.v3.oas.annotations.Parameter(description = "ID do clube", example = "1")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.Parameter(description = "Filtro por tipo: COMPRA, VENDA ou COMPRA,VENDA", example = "VENDA")
            @RequestParam(required = false) String type,
            @io.swagger.v3.oas.annotations.Parameter(description = "Filtro por ID do jogador", example = "2")
            @RequestParam(name = "player_id", required = false) String playerId) {
        Integer parsedPlayerId = playerId == null ? null : ValidacoesGeraisUtils.inteiroPositivo("player_id", playerId);
        return ResponseEntity.ok(mercadoService.listarTransacoes(ValidacoesGeraisUtils.idUrl(id), type, parsedPlayerId));
    }

    @GetMapping(value = "/clubs/{id}/transactions/export", produces = "text/csv")
    @Operation(
            summary = "Exporta o histórico de transações de um clube em formato CSV",
            description = "Gera um arquivo CSV com separador ';' e valores monetários formatados em vírgula, com os mesmos filtros da consulta."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Arquivo CSV gerado com sucesso",
                    content = @Content(mediaType = "text/csv", schema = @Schema(type = "string", format = "binary"))),
            @ApiResponse(responseCode = "400", description = "Filtro inválido"),
            @ApiResponse(responseCode = "404", description = "Clube ou jogador inexistente")
    })
    public ResponseEntity<byte[]> exportarTransacoes(
            @io.swagger.v3.oas.annotations.Parameter(description = "ID do clube", example = "1")
            @PathVariable String id,
            @io.swagger.v3.oas.annotations.Parameter(description = "Filtro por tipo: COMPRA, VENDA ou COMPRA,VENDA", example = "VENDA")
            @RequestParam(required = false) String type,
            @io.swagger.v3.oas.annotations.Parameter(description = "Filtro por ID do jogador", example = "2")
            @RequestParam(name = "player_id", required = false) String playerId) {
        Integer parsedPlayerId = playerId == null ? null : ValidacoesGeraisUtils.inteiroPositivo("player_id", playerId);
        byte[] csv = mercadoService.exportarTransacoesCsv(ValidacoesGeraisUtils.idUrl(id), type, parsedPlayerId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=utf-8")
                .body(csv);
    }
}
