package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record TransacaoDto(
        Integer id,
        Integer clubId,
        Integer playerId,
        String playerName,
        String type,
        BigDecimal value,
        BigDecimal fee,
        BigDecimal penalty,
        BigDecimal profit,
        BigDecimal cashChange,
        OffsetDateTime createdAt,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        ContratoDto contract,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        BigDecimal purchaseValue,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Integer remainingDays,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Integer penaltyRate,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        String contractStatus,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        BigDecimal clubCash
) {
}
