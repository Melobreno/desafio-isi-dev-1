package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;
import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ClubeDto(
        Integer id,
        String name,
        String acronym,
        BigDecimal cash,
        BigDecimal squadValue,
        BigDecimal netWorth,
        List<JogadorDto> players
) {
    public ClubeDto(Integer id, String name, String acronym, BigDecimal cash, BigDecimal squadValue, BigDecimal netWorth) {
        this(id, name, acronym, cash, squadValue, netWorth, null);
    }
}
