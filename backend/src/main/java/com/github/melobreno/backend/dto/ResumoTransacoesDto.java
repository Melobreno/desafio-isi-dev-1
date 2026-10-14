package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ResumoTransacoesDto(
        BigDecimal totalSpent,
        BigDecimal totalReceived,
        BigDecimal totalFees,
        BigDecimal totalPenalties,
        BigDecimal totalProfit
) {
}
