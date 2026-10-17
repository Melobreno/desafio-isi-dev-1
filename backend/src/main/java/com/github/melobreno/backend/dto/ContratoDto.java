package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ContratoDto(
        BigDecimal purchaseValue,
        OffsetDateTime loyaltyUntil,
        Integer remainingDays,
        Integer penaltyRate,
        String status
) {
    public ContratoDto(BigDecimal purchaseValue, OffsetDateTime loyaltyUntil, Integer remainingDays, Integer penaltyRate) {
        this(purchaseValue, loyaltyUntil, remainingDays, penaltyRate, null);
    }
}
