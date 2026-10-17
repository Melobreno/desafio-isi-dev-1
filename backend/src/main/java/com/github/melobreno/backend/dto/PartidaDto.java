package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.time.OffsetDateTime;
import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PartidaDto(
        Integer id,
        OffsetDateTime playedAt,
        PartidaClubeDto home,
        PartidaClubeDto away,
        String result,
        List<DueloPartidaDto> duels
) {
}
