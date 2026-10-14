package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record TransacaoDto(
        Long id,
        Long clubId,
        Long playerId,
        String playerName,
        String type,
        BigDecimal value,
        BigDecimal fee,
        BigDecimal penalty,
        BigDecimal profit,
        BigDecimal cashChange,
        OffsetDateTime createdAt,
        ContratoDto contract,
        BigDecimal purchaseValue,
        Integer remainingDays,
        Integer penaltyRate,
        String contractStatus,
        BigDecimal clubCash
) {
}
